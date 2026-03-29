<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Submission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubmissionController extends Controller
{
    public function take(Quiz $quiz, Request $request)
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            abort(403);
        }

        if (!$quiz->isAvailable()) {
            abort(404);
        }

        $classIds = $user->enrolledClasses()->pluck('classes.id');
        if (!$classIds->contains($quiz->class_id)) {
            abort(403);
        }

        $existing = Submission::where('quiz_id', $quiz->id)->where('user_id', $user->id)->first();
        if ($existing && $existing->submitted_at) {
            return redirect()->route('submissions.result', $existing);
        }

        $submission = $existing ?? Submission::create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
        ]);

        $quiz->load('questions');

        return Inertia::render('Exams/Take', [
            'quiz' => $quiz,
            'submission' => $submission,
        ]);
    }

    public function submit(Quiz $quiz, Request $request)
    {
        $user = $request->user();

        $submission = Submission::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->whereNull('submitted_at')
            ->firstOrFail();

        $validated = $request->validate([
            'answers' => 'required|array',
        ]);

        $gradeResult = $this->autoGrade($quiz, $validated['answers']);

        $submission->update([
            'answers' => $validated['answers'],
            'score' => $gradeResult['percentage'],
            'earned_points' => $gradeResult['earned'],
            'total_points' => $gradeResult['total'],
            'submitted_at' => now(),
        ]);

        return redirect()->route('submissions.result', $submission);
    }

    public function result(Submission $submission, Request $request)
    {
        $user = $request->user();

        if ($user->isStudent() && $submission->user_id !== $user->id) {
            abort(403);
        }

        if ($user->isTeacher() && $submission->quiz->classModel->user_id !== $user->id) {
            abort(403);
        }

        $submission->load(['quiz.questions', 'student', 'examLogs']);

        return Inertia::render('Exams/Result', [
            'submission' => $submission,
        ]);
    }

    private function autoGrade(Quiz $quiz, array $answers): array
    {
        $quiz->load('questions');
        $totalPoints = 0;
        $earnedPoints = 0;

        foreach ($quiz->questions as $question) {
            $totalPoints += $question->points;
            $answer = $answers[$question->id] ?? null;

            if ($answer === null) {
                continue;
            }

            $content = $question->content;

            switch ($question->type) {
                case 'multiple_choice':
                    if (isset($content['correct_answer']) && strtolower(trim($answer)) === strtolower(trim($content['correct_answer']))) {
                        $earnedPoints += $question->points;
                    }
                    break;

                case 'true_false':
                    $correctBool = $content['correct_answer'] ?? null;
                    $answerBool = filter_var($answer, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($correctBool === $answerBool) {
                        $earnedPoints += $question->points;
                    }
                    break;

                case 'identification':
                    $acceptableAnswers = array_map('strtolower', array_map('trim', $content['correct_answers'] ?? []));
                    if (in_array(strtolower(trim($answer)), $acceptableAnswers)) {
                        $earnedPoints += $question->points;
                    }
                    break;

                case 'coding':
                case 'essay':
                    // These require manual grading; award 0 for now
                    break;
            }
        }

        $percentage = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100, 2) : 0;

        return [
            'percentage' => $percentage,
            'earned' => $earnedPoints,
            'total' => $totalPoints,
        ];
    }

    /**
     * Print-friendly Blade view of a submission result.
     */
    public function printResult(Submission $submission, Request $request)
    {
        $user = $request->user();
        $quiz = $submission->quiz()->with('questions')->first();

        // Only the student themselves or the teacher who owns the quiz can print
        if ($submission->user_id !== $user->id && $quiz->classModel->user_id !== $user->id) {
            abort(403);
        }

        $submission->load(['student', 'examLogs']);
        $quiz->load('questions');

        return view('print.result', [
            'submission' => $submission,
            'quiz' => $quiz,
        ]);
    }

    /**
     * Teacher manually grades a question (essay / coding) with optional partial credit.
     */
    public function gradeQuestion(Submission $submission, Request $request)
    {
        $quiz = $submission->quiz;

        if ($quiz->classModel->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'question_id' => 'required|integer',
            'points_awarded' => 'required|numeric|min:0',
        ]);

        $questionId = $validated['question_id'];
        $pointsAwarded = (float) $validated['points_awarded'];

        $manualGrades = $submission->manual_grades ?? [];
        $manualGrades[$questionId] = $pointsAwarded;
        $submission->manual_grades = $manualGrades;

        // Recalculate score including manual grades
        $quiz->load('questions');
        $totalPoints = $quiz->questions->sum('points');
        $answers = $submission->answers ?? [];

        $earnedPoints = 0;
        foreach ($quiz->questions as $question) {
            if (isset($manualGrades[$question->id])) {
                $earnedPoints += $manualGrades[$question->id];
                continue;
            }

            $answer = $answers[$question->id] ?? null;
            if ($answer === null) continue;
            $content = $question->content;

            switch ($question->type) {
                case 'multiple_choice':
                    if (isset($content['correct_answer']) && strtolower(trim($answer)) === strtolower(trim($content['correct_answer']))) {
                        $earnedPoints += $question->points;
                    }
                    break;
                case 'true_false':
                    $correctBool = $content['correct_answer'] ?? null;
                    $answerBool = filter_var($answer, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($correctBool === $answerBool) {
                        $earnedPoints += $question->points;
                    }
                    break;
                case 'identification':
                    $acceptable = array_map('strtolower', array_map('trim', $content['correct_answers'] ?? []));
                    if (in_array(strtolower(trim($answer)), $acceptable)) {
                        $earnedPoints += $question->points;
                    }
                    break;
            }
        }

        $percentage = $totalPoints > 0 ? round(($earnedPoints / $totalPoints) * 100, 2) : 0;

        $submission->earned_points = $earnedPoints;
        $submission->total_points = $totalPoints;
        $submission->score = $percentage;
        $submission->save();

        return response()->json([
            'score' => $percentage,
            'earned_points' => $earnedPoints,
            'manual_grades' => $submission->manual_grades,
        ]);
    }
}
