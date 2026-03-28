<?php

namespace App\Http\Controllers;

use App\Models\ClassModel;
use App\Models\Question;
use App\Models\Quiz;
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
        ]);

        try {
            $questions = $service->generate(
                $validated['topic'],
                $validated['num_questions'],
                $validated['difficulty'],
                $validated['question_types_breakdown'] ?? [],
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
        ]);

        foreach ($validated['questions'] as $index => $q) {
            $quiz->questions()->create([
                'type' => $q['type'],
                'content' => $q['content'],
                'points' => $q['points'],
                'order' => $index,
            ]);
        }

        return redirect()->route('quizzes.show', $quiz);
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

        $quiz->update(['is_published' => true]);

        return back();
    }

    public function unpublish(Quiz $quiz, Request $request)
    {
        if ($quiz->classModel->user_id !== $request->user()->id) {
            abort(403);
        }

        $quiz->update(['is_published' => false]);

        return back();
    }
}
