<?php

namespace App\Console\Commands;

use App\Models\Quiz;
use App\Models\Submission;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class NotifyQuizMissed extends Command
{
    protected $signature = 'notifications:quiz-missed';
    protected $description = 'Send missed-quiz notifications to students who did not submit before the deadline';

    public function handle(NotificationService $service): void
    {
        // Quizzes that closed in the last 5 minutes
        $recentlyClosed = Quiz::where('status', 'published')
            ->where('available_until', '>=', now()->subMinutes(5))
            ->where('available_until', '<=', now())
            ->with('classModel.students')
            ->get();

        $sent = 0;
        foreach ($recentlyClosed as $quiz) {
            $submittedUserIds = Submission::where('quiz_id', $quiz->id)
                ->whereNotNull('submitted_at')
                ->pluck('user_id');

            foreach ($quiz->classModel->students as $student) {
                if (!$submittedUserIds->contains($student->id)) {
                    $service->notifyQuizMissed($student, $quiz);
                    $sent++;
                }
            }
        }

        $this->info("Sent {$sent} quiz-missed notification(s).");
    }
}
