<?php

namespace App\Http\Controllers;

use App\Models\ClassModel;
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

        $classes = ClassModel::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('QuizBank/Index', [
            'quizzes' => $quizzes,
            'search' => $search ?? '',
            'classes' => $classes,
        ]);
    }

    public function preview(Quiz $quiz, Request $request)
    {
        if (!$request->user()->isTeacher()) {
            abort(403);
        }

        if (!$quiz->is_public) {
            abort(404);
        }

        $quiz->load(['questions' => fn($q) => $q->orderBy('order'), 'classModel:id,name']);

        return response()->json(['quiz' => $quiz]);
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
