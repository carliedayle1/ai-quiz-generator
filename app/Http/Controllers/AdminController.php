<?php

namespace App\Http\Controllers;

use App\Mail\InvitationMail;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_users' => User::count(),
                'teachers' => User::where('role', 'teacher')->count(),
                'students' => User::where('role', 'student')->count(),
                'admins' => User::where('role', 'admin')->count(),
                'pending_invitations' => Invitation::whereNull('accepted_at')->where('expires_at', '>', now())->count(),
            ],
        ]);
    }

    public function users()
    {
        $users = User::latest()->paginate(20);

        return Inertia::render('Admin/Users', [
            'users' => $users,
        ]);
    }

    public function invitations()
    {
        $invitations = Invitation::with('invitedByUser')->latest()->paginate(20);

        return Inertia::render('Admin/Invitations', [
            'invitations' => $invitations,
        ]);
    }

    public function sendInvitation(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'role' => 'required|in:teacher,student,admin',
        ]);

        // Check if user already exists
        if (User::where('email', $validated['email'])->exists()) {
            return back()->withErrors(['email' => 'A user with this email already exists.']);
        }

        // Check for existing pending invitation
        $existing = Invitation::where('email', $validated['email'])
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        if ($existing) {
            return back()->withErrors(['email' => 'A pending invitation already exists for this email.']);
        }

        $invitation = Invitation::create([
            'invited_by' => $request->user()->id,
            'email' => $validated['email'],
            'role' => $validated['role'],
            'token' => Invitation::generateToken(),
            'expires_at' => now()->addDays(7),
        ]);

        Mail::to($invitation->email)->send(new InvitationMail($invitation));

        return back()->with('success', 'Invitation sent successfully.');
    }

    public function revokeInvitation(Invitation $invitation)
    {
        if ($invitation->isAccepted()) {
            return back()->withErrors(['invitation' => 'Cannot revoke an accepted invitation.']);
        }

        $invitation->delete();

        return back()->with('success', 'Invitation revoked.');
    }

    public function deleteUser(User $user, Request $request)
    {
        if ($user->id === $request->user()->id) {
            return back()->withErrors(['user' => 'You cannot delete yourself.']);
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}
