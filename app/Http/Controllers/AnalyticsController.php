<?php

namespace App\Http\Controllers;

use App\Models\ClassModel;
use App\Models\Quiz;
use App\Models\Submission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Teacher sees analytics for their own classes/quizzes only
        $classIds = ClassModel::where('user_id', $user->id)->pluck('id');
        $quizIds = Quiz::whereIn('class_id', $classIds)->pluck('id');

        // Overall stats
        $totalSubmissions = Submission::whereIn('quiz_id', $quizIds)->whereNotNull('submitted_at')->count();
        $avgScore = Submission::whereIn('quiz_id', $quizIds)->whereNotNull('score')->avg('score');
        $passRate = $totalSubmissions > 0
            ? Submission::whereIn('quiz_id', $quizIds)->whereNotNull('score')->where('score', '>=', 60)->count() / $totalSubmissions * 100
            : 0;

        // Per-quiz stats
        $quizStats = Quiz::whereIn('id', $quizIds)
            ->with(['classModel:id,name', 'submissions' => function ($q) {
                $q->whereNotNull('submitted_at')->select('quiz_id', 'score', 'earned_points', 'total_points');
            }])
            ->get()
            ->map(function (Quiz $quiz) {
                $subs = $quiz->submissions;
                $count = $subs->count();
                $avg = $count > 0 ? $subs->avg('score') : null;
                $high = $count > 0 ? $subs->max('score') : null;
                $low = $count > 0 ? $subs->min('score') : null;
                $passing = $count > 0 ? $subs->where('score', '>=', 60)->count() : 0;

                return [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'class_name' => $quiz->classModel?->name,
                    'status' => $quiz->status,
                    'submission_count' => $count,
                    'avg_score' => $avg !== null ? round($avg, 1) : null,
                    'high_score' => $high !== null ? round($high, 1) : null,
                    'low_score' => $low !== null ? round($low, 1) : null,
                    'pass_rate' => $count > 0 ? round($passing / $count * 100, 1) : null,
                ];
            });

        // Anti-cheat flag summary across all quizzes
        $flaggedSubmissions = Submission::whereIn('quiz_id', $quizIds)
            ->whereHas('examLogs')
            ->with(['student:id,first_name,last_name', 'quiz:id,title'])
            ->withCount('examLogs')
            ->orderByDesc('exam_logs_count')
            ->limit(20)
            ->get()
            ->map(fn ($s) => [
                'submission_id' => $s->id,
                'student_name' => $s->student ? $s->student->first_name . ' ' . $s->student->last_name : 'Unknown',
                'quiz_title' => $s->quiz?->title,
                'flag_count' => $s->exam_logs_count,
                'score' => $s->score,
            ]);

        return Inertia::render('Analytics/Index', [
            'stats' => [
                'total_submissions' => $totalSubmissions,
                'avg_score' => $avgScore !== null ? round($avgScore, 1) : null,
                'pass_rate' => round($passRate, 1),
                'quiz_count' => $quizIds->count(),
            ],
            'quizStats' => $quizStats,
            'flaggedSubmissions' => $flaggedSubmissions,
        ]);
    }

    /**
     * Export gradebook as CSV for a specific quiz.
     */
    public function exportGradebook(Quiz $quiz, Request $request)
    {
        $ownerId = $quiz->class_id !== null ? $quiz->classModel?->user_id : $quiz->user_id;
        if ($ownerId !== $request->user()->id) {
            abort(403);
        }

        $submissions = Submission::where('quiz_id', $quiz->id)
            ->whereNotNull('submitted_at')
            ->with('student')
            ->get();

        $csvRows = [['Student ID', 'First Name', 'Last Name', 'Email', 'Score (%)', 'Earned Points', 'Total Points', 'Submitted At']];

        foreach ($submissions as $sub) {
            $csvRows[] = [
                $sub->student?->id_number ?? '',
                $sub->student?->first_name ?? '',
                $sub->student?->last_name ?? '',
                $sub->student?->email ?? '',
                $sub->score ?? '',
                $sub->earned_points ?? '',
                $sub->total_points ?? '',
                $sub->submitted_at?->toDateTimeString() ?? '',
            ];
        }

        $filename = 'gradebook_' . str_replace(' ', '_', $quiz->title) . '_' . now()->format('Y-m-d') . '.csv';

        $output = fopen('php://temp', 'r+');
        foreach ($csvRows as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
