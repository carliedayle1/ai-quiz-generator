<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\Quiz;
use App\Models\QuizShare;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\QuizCloningService;
use Illuminate\Http\Request;

class ShareController extends Controller
{
    public function shareQuiz(Quiz $quiz, Request $request, NotificationService $notificationService)
    {
        if ($quiz->classModel->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'recipient_id' => 'required|integer|exists:users,id',
        ]);

        $recipient = User::findOrFail($validated['recipient_id']);

        if (!$recipient->isTeacher()) {
            return back()->withErrors(['recipient_id' => 'You can only share with other teachers.']);
        }

        if ($recipient->id === $request->user()->id) {
            return back()->withErrors(['recipient_id' => 'You cannot share a quiz with yourself.']);
        }

        // Prevent duplicate pending shares
        $existing = QuizShare::where('quiz_id', $quiz->id)
            ->where('sender_id', $request->user()->id)
            ->where('recipient_id', $recipient->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return back()->with('flash', ['info' => 'You already have a pending share with this teacher.']);
        }

        $share = QuizShare::create([
            'quiz_id' => $quiz->id,
            'sender_id' => $request->user()->id,
            'recipient_id' => $recipient->id,
            'status' => 'pending',
        ]);

        $share->load(['quiz', 'sender']);
        $notificationService->notifyQuizShared($share);

        return back()->with('flash', ['success' => 'Quiz shared successfully!']);
    }

    public function accept(QuizShare $share, Request $request, QuizCloningService $cloningService)
    {
        if ($share->recipient_id !== $request->user()->id) {
            abort(403);
        }

        if ($share->status !== 'pending') {
            return redirect()->route('classes.index')->with('flash', ['info' => 'This share has already been responded to.']);
        }

        $newQuiz = $cloningService->clone($share->quiz, $request->user());

        $share->update(['status' => 'accepted']);

        // Mark associated notification read
        AppNotification::where('user_id', $request->user()->id)
            ->whereJsonContains('data->share_id', $share->id)
            ->update(['read_at' => now()]);

        return redirect()->route('quizzes.edit', $newQuiz->id)
            ->with('flash', ['success' => 'Quiz copied to your drafts!']);
    }

    public function decline(QuizShare $share, Request $request)
    {
        if ($share->recipient_id !== $request->user()->id) {
            abort(403);
        }

        $share->update(['status' => 'declined']);

        // Mark associated notification read
        AppNotification::where('user_id', $request->user()->id)
            ->whereJsonContains('data->share_id', $share->id)
            ->update(['read_at' => now()]);

        return back();
    }
}
