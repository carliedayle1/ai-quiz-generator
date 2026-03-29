<?php

namespace App\Http\Controllers;

use App\Models\ClassModel;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\User;
use App\Services\FileTextExtractor;
use App\Services\QuizCloningService;
use App\Services\QuizGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class QuizController extends Controller
{
    public function create(ClassModel $class, Request $request)
    {
        if ($class->user_id !== $request->user()->id) {
            abort(403);
        }

        return Inertia::render('Quizzes/Create', [
            'classData' => $class,
        ]);
    }

    public function generate(ClassModel $class, Request $request, QuizGeneratorService $service)
    {
        if ($class->user_id !== $request->user()->id) {
            abort(403);
        }

        $mode = $request->input('mode', 'standard');

        if ($mode === 'context') {
            $request->validate([
                'context_file' => 'required|file|mimes:pdf,txt,md|max:20480',
                'instructions' => 'required|string|min:10|max:2000',
            ]);

            try {
                $extractor = app(FileTextExtractor::class);
                $documentText = $extractor->extract($request->file('context_file'));

                $questions = $service->generateFromContext(
                    $documentText,
                    $request->input('instructions'),
                );

                return response()->json(['questions' => $questions]);
            } catch (\Exception $e) {
                return response()->json(['error' => $e->getMessage()], 422);
            }
        }

        $validated = $request->validate([
            'topic' => 'required|string|max:500',
            'num_questions' => 'required|integer|min:1|max:50',
            'difficulty' => 'required|in:easy,medium,hard',
            'question_types_breakdown' => 'nullable|array',
            'question_types_breakdown.multiple_choice' => 'nullable|integer|min:0|max:50',
            'question_types_breakdown.true_false' => 'nullable|integer|min:0|max:50',
            'question_types_breakdown.identification' => 'nullable|integer|min:0|max:50',
            'question_types_breakdown.coding' => 'nullable|integer|min:0|max:50',
            'question_types_breakdown.essay' => 'nullable|integer|min:0|max:50',
            'reference_file' => 'nullable|file|mimes:pdf,txt,md|max:10240',
        ]);

        try {
            $referenceText = null;
            if ($request->hasFile('reference_file')) {
                $extractor = app(FileTextExtractor::class);
                $referenceText = $extractor->extract($request->file('reference_file'));
            }

            $questions = $service->generate(
                $validated['topic'],
                $validated['num_questions'],
                $validated['difficulty'],
                $validated['question_types_breakdown'] ?? [],
                $referenceText,
            );

            return response()->json(['questions' => $questions]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function store(ClassModel $class, Request $request, QuizGeneratorService $service)
    {
        if ($class->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'time_limit' => 'nullable|integer|min:1|max:480',
            'questions' => 'required|array|min:1',
            'questions.*.type' => 'required|in:multiple_choice,true_false,identification,coding,essay',
            'questions.*.content' => 'required|array',
            'questions.*.points' => 'required|integer|min:1',
        ]);

        $description = $validated['description'] ?? null;
        if (empty($description)) {
            try {
                $typeCounts = collect($validated['questions'])->pluck('type')->countBy()->toArray();
                $description = $service->generateDescription($validated['title'], $typeCounts);
            } catch (\Exception $e) {
                Log::warning('Failed to auto-generate description', ['error' => $e->getMessage()]);
            }
        }

        $quiz = $class->quizzes()->create([
            'title' => $validated['title'],
            'description' => $description,
            'time_limit' => $validated['time_limit'] ?? null,
            'status' => 'draft',
        ]);

        foreach ($validated['questions'] as $index => $q) {
            $quiz->questions()->create([
                'type' => $q['type'],
                'content' => $q['content'],
                'points' => $q['points'],
                'order' => $index,
            ]);
        }

        return redirect()->route('quizzes.edit', $quiz);
    }

    /**
     * Resolve the owner ID of a quiz regardless of whether it has a class.
     * Quizzes cloned without a class store their owner directly in user_id.
     */
    private function quizOwnerId(Quiz $quiz): ?int
    {
        if ($quiz->class_id !== null) {
            return $quiz->classModel?->user_id;
        }
        return $quiz->user_id;
    }

    private function authorizeOwner(Quiz $quiz, Request $request): void
    {
        if ($this->quizOwnerId($quiz) !== $request->user()->id) {
            abort(403);
        }
    }

    public function edit(Quiz $quiz, Request $request)
    {
        $this->authorizeOwner($quiz, $request);

        $quiz->load(['questions', 'classModel']);

        $teachers = User::where('role', 'teacher')
            ->where('id', '!=', $request->user()->id)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email']);

        return Inertia::render('Quizzes/Edit', [
            'quiz' => $quiz,
            'classData' => $quiz->classModel,
            'teachers' => $teachers,
        ]);
    }

    public function update(Quiz $quiz, Request $request)
    {
        $this->authorizeOwner($quiz, $request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'time_limit' => 'nullable|integer|min:1|max:480',
        ]);

        $quiz->update($validated);

        return back();
    }

    public function destroy(Quiz $quiz, Request $request)
    {
        $this->authorizeOwner($quiz, $request);

        $classId = $quiz->class_id;
        $quiz->delete();

        return $classId
            ? redirect()->route('classes.show', $classId)
            : redirect()->route('classes.index');
    }

    public function schedule(Quiz $quiz, Request $request)
    {
        $this->authorizeOwner($quiz, $request);

        $validated = $request->validate([
            'available_from' => 'nullable|date',
            'available_until' => 'nullable|date|after_or_equal:available_from',
            'due_date' => 'nullable|date',
        ]);

        $status = 'published';
        if (!empty($validated['available_from']) && now()->lt($validated['available_from'])) {
            $status = 'scheduled';
        }

        $quiz->update(array_merge($validated, ['status' => $status]));

        return back();
    }

    public function storeQuestion(Quiz $quiz, Request $request)
    {
        $this->authorizeOwner($quiz, $request);

        $validated = $request->validate([
            'type' => 'required|in:multiple_choice,true_false,identification,coding,essay,section_header',
            'content' => 'required|array',
            'points' => 'required|integer|min:0',
        ]);

        $maxOrder = $quiz->questions()->max('order') ?? -1;

        $question = $quiz->questions()->create([
            'type' => $validated['type'],
            'content' => $validated['content'],
            'points' => $validated['points'],
            'order' => $maxOrder + 1,
        ]);

        return response()->json(['question' => $question]);
    }

    public function updateQuestion(Quiz $quiz, Question $question, Request $request)
    {
        if ($this->quizOwnerId($quiz) !== $request->user()->id || $question->quiz_id !== $quiz->id) {
            abort(403);
        }

        $validated = $request->validate([
            'type' => 'sometimes|in:multiple_choice,true_false,identification,coding,essay,section_header',
            'content' => 'sometimes|array',
            'points' => 'sometimes|integer|min:0',
        ]);

        $question->update($validated);

        return response()->json(['question' => $question->fresh()]);
    }

    public function destroyQuestion(Quiz $quiz, Question $question, Request $request)
    {
        if ($this->quizOwnerId($quiz) !== $request->user()->id || $question->quiz_id !== $quiz->id) {
            abort(403);
        }

        $deletedOrder = $question->order;
        $question->delete();

        // Re-sequence orders after the deleted position
        $quiz->questions()
            ->where('order', '>', $deletedOrder)
            ->decrement('order');

        return response()->json(['success' => true]);
    }

    public function reorderQuestions(Quiz $quiz, Request $request)
    {
        $this->authorizeOwner($quiz, $request);

        $validated = $request->validate([
            'questions' => 'required|array',
            'questions.*.id' => 'required|integer',
            'questions.*.order' => 'required|integer|min:0',
        ]);

        foreach ($validated['questions'] as $item) {
            $quiz->questions()->where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json(['success' => true]);
    }

    public function show(Quiz $quiz, Request $request)
    {
        $user = $request->user();
        $quiz->load(['questions', 'classModel', 'submissions.student']);

        if ($user->isTeacher() && $this->quizOwnerId($quiz) !== $user->id) {
            abort(403);
        }

        $teachers = [];
        if ($user->isTeacher()) {
            $teachers = User::where('role', 'teacher')
                ->where('id', '!=', $user->id)
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'email'])
                ->toArray();
        }

        return Inertia::render('Quizzes/Show', [
            'quiz' => $quiz,
            'isTeacher' => $user->isTeacher(),
            'teachers' => $teachers,
        ]);
    }

    public function generateSingle(Quiz $quiz, Request $request, QuizGeneratorService $service)
    {
        $this->authorizeOwner($quiz, $request);

        $validated = $request->validate([
            'question_type' => 'required|in:multiple_choice,true_false,identification,coding,essay',
        ]);

        // Build context from existing questions
        $existingContext = $quiz->questions()
            ->whereNotIn('type', ['section_header'])
            ->get()
            ->map(fn($q) => $q->content['question'] ?? '')
            ->filter()
            ->values()
            ->toArray();

        try {
            $question = $service->generateSingle($validated['question_type'], $existingContext);
            return response()->json(['question' => $question]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function clone(Quiz $quiz, Request $request, QuizCloningService $cloningService)
    {
        if (!$request->user()->isTeacher()) {
            abort(403);
        }

        // Only allow cloning public quizzes (or own quizzes)
        if (!$quiz->is_public && $this->quizOwnerId($quiz) !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'class_id' => 'required|integer|exists:classes,id',
        ]);

        $class = ClassModel::findOrFail($validated['class_id']);
        if ($class->user_id !== $request->user()->id) {
            abort(403);
        }

        $newQuiz = $cloningService->clone($quiz, $request->user(), $validated['class_id']);

        return redirect()->route('quizzes.edit', $newQuiz->id);
    }

    public function printQuiz(Quiz $quiz, Request $request)
    {
        $this->authorizeOwner($quiz, $request);

        $quiz->load(['questions' => fn($q) => $q->orderBy('order'), 'classModel']);

        return Inertia::render('Quizzes/Print', [
            'quiz' => $quiz,
            'classData' => $quiz->classModel,
        ]);
    }

    public function publish(Quiz $quiz, Request $request)
    {
        $this->authorizeOwner($quiz, $request);

        $quiz->update(['status' => 'published']);

        return back();
    }

    public function unpublish(Quiz $quiz, Request $request)
    {
        $this->authorizeOwner($quiz, $request);

        $quiz->update(['status' => 'draft']);

        return back();
    }
}
