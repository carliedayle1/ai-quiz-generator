<?php

namespace App\Services;

use App\Models\Quiz;
use App\Models\User;

class QuizCloningService
{
    /**
     * Deep-clone a quiz and all its questions for a new owner.
     * The clone is always created as a draft with is_public = false.
     */
    public function clone(Quiz $source, User $newOwner, ?int $classId = null): Quiz
    {
        $newQuiz = Quiz::create([
            'class_id' => $classId,
            'title' => $source->title . ' (Copy)',
            'description' => $source->description,
            'time_limit' => $source->time_limit,
            'status' => 'draft',
            'allow_partial_credit' => $source->allow_partial_credit,
            'is_public' => false,
        ]);

        foreach ($source->questions()->orderBy('order')->get() as $question) {
            $newQuiz->questions()->create([
                'type' => $question->type,
                'content' => $question->content,
                'points' => $question->points,
                'order' => $question->order,
            ]);
        }

        return $newQuiz;
    }
}
