<?php

namespace App\Services;

use App\Mail\AppNotificationMail;
use App\Models\AppNotification;
use App\Models\QuizShare;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function notifyQuizOpened(User $student, \App\Models\Quiz $quiz): AppNotification
    {
        $notification = AppNotification::create([
            'user_id' => $student->id,
            'type' => 'quiz_opened',
            'title' => 'New Quiz Available',
            'body' => "\"{$quiz->title}\" is now open for submission.",
            'data' => [
                'quiz_id' => $quiz->id,
                'quiz_title' => $quiz->title,
                'route' => route('quizzes.take', $quiz->id),
            ],
        ]);

        $this->sendEmail($notification, $student);

        return $notification;
    }

    public function notifyQuizMissed(User $student, \App\Models\Quiz $quiz): AppNotification
    {
        $notification = AppNotification::create([
            'user_id' => $student->id,
            'type' => 'quiz_missed',
            'title' => 'Quiz Deadline Passed',
            'body' => "You missed \"{$quiz->title}\". The submission window has closed.",
            'data' => [
                'quiz_id' => $quiz->id,
                'quiz_title' => $quiz->title,
                'route' => $quiz->class_id
                    ? route('classes.show', $quiz->class_id)
                    : route('classes.index'),
            ],
        ]);

        $this->sendEmail($notification, $student);

        return $notification;
    }

    public function notifyQuizShared(QuizShare $share): AppNotification
    {
        $senderName = $share->sender->first_name . ' ' . $share->sender->last_name;
        $quizTitle = $share->quiz->title;
        $recipient = $share->recipient;

        $notification = AppNotification::create([
            'user_id' => $share->recipient_id,
            'type' => 'quiz_shared',
            'title' => 'Quiz Shared With You',
            'body' => "Teacher {$senderName} shared \"{$quizTitle}\" with you.",
            'data' => [
                'share_id' => $share->id,
                'quiz_title' => $quizTitle,
                'sender_name' => $senderName,
                'route' => route('notifications.page'),
            ],
        ]);

        $this->sendEmail($notification, $recipient);

        return $notification;
    }

    public function sendStudyTip(User $student, \App\Models\Quiz $quiz, string $tip): AppNotification
    {
        $notification = AppNotification::create([
            'user_id' => $student->id,
            'type' => 'study_tip',
            'title' => 'Study Tip',
            'body' => $tip,
            'data' => [
                'quiz_id' => $quiz->id,
                'quiz_title' => $quiz->title,
                'route' => route('quizzes.take', $quiz->id),
            ],
        ]);

        $this->sendEmail($notification, $student);

        return $notification;
    }

    private function sendEmail(AppNotification $notification, User $user): void
    {
        try {
            Mail::to($user->email)->send(new AppNotificationMail($notification, $user));
        } catch (\Throwable $e) {
            Log::warning('Notification email failed for user ' . $user->id . ': ' . $e->getMessage());
        }
    }
}
