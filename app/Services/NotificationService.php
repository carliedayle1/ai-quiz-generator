<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\QuizShare;
use App\Models\User;

class NotificationService
{
    public function notifyQuizOpened(User $student, \App\Models\Quiz $quiz): AppNotification
    {
        return AppNotification::create([
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
    }

    public function notifyQuizMissed(User $student, \App\Models\Quiz $quiz): AppNotification
    {
        return AppNotification::create([
            'user_id' => $student->id,
            'type' => 'quiz_missed',
            'title' => 'Quiz Deadline Passed',
            'body' => "You missed \"{$quiz->title}\". The submission window has closed.",
            'data' => [
                'quiz_id' => $quiz->id,
                'quiz_title' => $quiz->title,
            ],
        ]);
    }

    public function notifyQuizShared(QuizShare $share): AppNotification
    {
        $senderName = $share->sender->first_name . ' ' . $share->sender->last_name;
        $quizTitle = $share->quiz->title;

        return AppNotification::create([
            'user_id' => $share->recipient_id,
            'type' => 'quiz_shared',
            'title' => 'Quiz Shared With You',
            'body' => "Teacher {$senderName} shared \"{$quizTitle}\" with you.",
            'data' => [
                'share_id' => $share->id,
                'quiz_title' => $quizTitle,
                'sender_name' => $senderName,
            ],
        ]);
    }

    public function sendStudyTip(User $student, \App\Models\Quiz $quiz, string $tip): AppNotification
    {
        return AppNotification::create([
            'user_id' => $student->id,
            'type' => 'study_tip',
            'title' => 'Study Tip',
            'body' => $tip,
            'data' => [
                'quiz_id' => $quiz->id,
                'quiz_title' => $quiz->title,
            ],
        ]);
    }
}
