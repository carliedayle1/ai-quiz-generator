<?php

namespace App\Console\Commands;

use App\Models\Quiz;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class NotifyQuizOpened extends Command
{
    protected $signature = 'notifications:quiz-opened';
    protected $description = 'Send notifications for quizzes that just became available';

    public function handle(NotificationService $service): void
    {
        $recentlyOpened = Quiz::where('status', 'published')
            ->where('available_from', '>=', now()->subMinutes(5))
            ->where('available_from', '<=', now())
            ->with('classModel.students')
            ->get();

        $sent = 0;
        foreach ($recentlyOpened as $quiz) {
            foreach ($quiz->classModel->students as $student) {
                $service->notifyQuizOpened($student, $quiz);
                $sent++;
            }
        }

        $this->info("Sent {$sent} quiz-opened notification(s).");
    }
}
