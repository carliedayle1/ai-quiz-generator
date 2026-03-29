<?php

namespace App\Http\Middleware;

use App\Models\AppNotification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'unread_notifications' => $request->user()
                ? AppNotification::where('user_id', $request->user()->id)->whereNull('read_at')->count()
                : 0,
            'flash' => [
                'success' => $request->session()->get('success'),
                'bulk_results' => $request->session()->get('bulk_results'),
            ],
        ];
    }
}
