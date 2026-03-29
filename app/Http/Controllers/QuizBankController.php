<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuizBankController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user()->isTeacher()) {
            abort(403);
        }

        $query = Quiz::public()
            ->with(['classModel:id,name', 'classModel.teacher:id,first_name,last_name'])
            ->withCount('questions');

        if ($search = $request->input('search')) {
            $query->where('title', 'like', '%' . $search . '%');
        }

        $quizzes = $query->latest()->paginate(20)->withQueryString();

        return Inertia::render('QuizBank/Index', [
            'quizzes' => $quizzes,
            'search' => $search ?? '',
        ]);
    }

    public function togglePublic(Quiz $quiz, Request $request)
    {
        $ownerId = $quiz->class_id !== null ? $quiz->classModel?->user_id : $quiz->user_id;
        if ($ownerId !== $request->user()->id) {
            abort(403);
        }

        $quiz->update(['is_public' => !$quiz->is_public]);

        return back();
    }
}
