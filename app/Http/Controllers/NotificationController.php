<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\QuizShare;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * JSON endpoint for the bell dropdown — 10 most recent, enriched with share_status.
     */
    public function index(Request $request)
    {
        $notifications = AppNotification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function ($n) {
                if ($n->type === 'quiz_shared' && isset($n->data['share_id'])) {
                    $share = QuizShare::find($n->data['share_id']);
                    $n->share_status = $share?->status ?? 'unknown';
                }
                return $n;
            });

        return response()->json(['notifications' => $notifications]);
    }

    /**
     * Inertia full notifications page — paginated 20/page, enriched with share_status.
     */
    public function page(Request $request)
    {
        $notifications = AppNotification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(function ($n) {
                if ($n->type === 'quiz_shared' && isset($n->data['share_id'])) {
                    $share = QuizShare::find($n->data['share_id']);
                    $n->share_status = $share?->status ?? 'unknown';
                }
                return $n;
            });

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * Called when the bell is opened — clears the badge by setting seen_at on all unseen notifications.
     */
    public function markSeen(Request $request)
    {
        AppNotification::where('user_id', $request->user()->id)
            ->whereNull('seen_at')
            ->update(['seen_at' => now()]);

        return response()->json(['ok' => true]);
    }

    /**
     * Mark a single notification as read (actioned/dismissed).
     */
    public function markRead(Request $request, AppNotification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403);
        }

        $notification->update(['read_at' => now(), 'seen_at' => now()]);

        return response()->json(['ok' => true]);
    }

    /**
     * Mark all read — clears badge for all, sets read_at only for non-actionable types.
     * quiz_shared keeps read_at null so Accept/Decline remains visible.
     */
    public function markAllRead(Request $request)
    {
        AppNotification::where('user_id', $request->user()->id)
            ->whereNull('seen_at')
            ->update(['seen_at' => now()]);

        AppNotification::where('user_id', $request->user()->id)
            ->where('type', '!=', 'quiz_shared')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
