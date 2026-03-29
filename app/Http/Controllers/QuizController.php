<?php

namespace App\Http\Controllers;

use App\Models\ClassModel;
use App\Models\Question;
use App\Models\Quiz;
use App\Services\FileTextExtractor;
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
                'instructions' => 'nullable|string|max:1000',
                'num_questions' => 'required|integer|min:1|max:50',
                'difficulty' => 'required|in:easy,medium,hard',
                'question_types_breakdown' => 'nullable|array',
                'question_types_breakdown.multiple_choice' => 'nullable|integer|min:0|max:50',
                'question_types_breakdown.true_false' => 'nullable|integer|min:0|max:50',
                'question_types_breakdown.identification' => 'nullable|integer|min:0|max:50',
                'question_types_breakdown.coding' => 'nullable|integer|min:0|max:50',
                'question_types_breakdown.essay' => 'nullable|integer|min:0|max:50',
            ]);

            try {
                $extractor = app(FileTextExtractor::class);
                $documentText = $extractor->extract($request->file('context_file'));

                $questions = $service->generateFromContext(
                    $documentText,
                    $request->input('instructions', ''),
                    (int) $request->input('num_questions'),
                    $request->input('difficulty'),
                    $request->input('question_types_breakdown', []),
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

    public function edit(Quiz $quiz, Request $request)
    {
        if ($quiz->classModel->user_id !== $request->user()->id) {
            abort(403);
        }

        $quiz->load(['questions', 'classModel']);

        return Inertia::render('Quizzes/Edit', [
            'quiz' => $quiz,
            'classData' => $quiz->classModel,
        ]);
    }

    public function update(Quiz $quiz, Request $request)
    {
        if ($quiz->classModel->user_id !== $request->user()->id) {
            abort(403);
        }

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
        if ($quiz->classModel->user_id !== $request->user()->id) {
            abort(403);
        }

        $classId = $quiz->class_id;
        $quiz->delete();

        return redirect()->route('classes.show', $classId);
    }

    public function schedule(Quiz $quiz, Request $request)
    {
        if ($quiz->classModel->user_id !== $request->user()->id) {
            abort(403);
        }

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
        if ($quiz->classModel->user_id !== $request->user()->id) {
            abort(403);
        }

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
        if ($quiz->classModel->user_id !== $request->user()->id || $question->quiz_id !== $quiz->id) {
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
        if ($quiz->classModel->user_id !== $request->user()->id || $question->quiz_id !== $quiz->id) {
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
        if ($quiz->classModel->user_id !== $request->user()->id) {
            abort(403);
        }

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

        if ($user->isTeacher() && $quiz->classModel->user_id !== $user->id) {
            abort(403);
        }

        return Inertia::render('Quizzes/Show', [
            'quiz' => $quiz,
            'isTeacher' => $user->isTeacher(),
        ]);
    }

    public function publish(Quiz $quiz, Request $request)
    {
        if ($quiz->classModel->user_id !== $request->user()->id) {
            abort(403);
        }

        $quiz->update(['status' => 'published']);

        return back();
    }

    public function unpublish(Quiz $quiz, Request $request)
    {
        if ($quiz->classModel->user_id !== $request->user()->id) {
            abort(403);
        }

        $quiz->update(['status' => 'draft']);

        return back();
    }
}
