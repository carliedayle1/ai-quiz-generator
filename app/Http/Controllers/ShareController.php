<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\QuizShare;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\QuizCloningService;
use Illuminate\Http\Request;

class ShareController extends Controller
{
    public function create(Request $request, QuizShare $share = null)
    {
        // This method is unused — share creation is via QuizController::share()
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
