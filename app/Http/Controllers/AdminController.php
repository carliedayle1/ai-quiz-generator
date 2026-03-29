<?php

namespace App\Http\Controllers;

use App\Mail\InvitationMail;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Spatie\SimpleExcel\SimpleExcelReader;

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

    public function bulkInvite(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:5120',
        ]);

        $uploadedFile = $request->file('file');
        $ext = strtolower($uploadedFile->getClientOriginalExtension()) ?: 'csv';
        $ext = $ext === 'txt' ? 'csv' : $ext;

        $storedPath = $uploadedFile->storeAs('temp-imports', uniqid('import_') . '.' . $ext);
        $fullPath   = Storage::path($storedPath);

        try {
            $rows = SimpleExcelReader::create($fullPath)->trimHeaderRow()->getRows();
        } catch (\Exception $e) {
            Storage::delete($storedPath);
            return back()->withErrors(['file' => 'Could not read file. Ensure it has "email" and "role" columns.']);
        }

        $sent = 0;
        $skipped = [];

        foreach ($rows as $row) {
            $email = strtolower(trim($row['email'] ?? $row['Email'] ?? ''));
            $role  = strtolower(trim($row['role']  ?? $row['Role']  ?? ''));

            if (empty($email)) {
                continue;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $skipped[] = ['email' => $email, 'reason' => 'Invalid email address'];
                continue;
            }

            if (!in_array($role, ['teacher', 'student', 'admin'])) {
                $skipped[] = ['email' => $email, 'reason' => "Invalid role \"{$role}\" — must be teacher, student, or admin"];
                continue;
            }

            if (User::where('email', $email)->exists()) {
                $skipped[] = ['email' => $email, 'reason' => 'User already exists'];
                continue;
            }

            $existing = Invitation::where('email', $email)
                ->whereNull('accepted_at')
                ->where('expires_at', '>', now())
                ->first();

            if ($existing) {
                $skipped[] = ['email' => $email, 'reason' => 'Pending invitation already exists'];
                continue;
            }

            $invitation = Invitation::create([
                'invited_by' => $request->user()->id,
                'email'      => $email,
                'role'       => $role,
                'token'      => Invitation::generateToken(),
                'expires_at' => now()->addDays(7),
            ]);

            // Mailtrap sandbox limits to 1 email/second; pause between sends
            if ($sent > 0) {
                usleep(3000000); // 3 seconds
            }

            Mail::to($invitation->email)->send(new InvitationMail($invitation));
            $sent++;
        }

        Storage::delete($storedPath);

        return back()->with('bulk_results', compact('sent', 'skipped'));
    }

    public function downloadSample()
    {
        $csv = "email,role\njohn.doe@example.com,teacher\njane.smith@example.com,student\ncarol.white@example.com,admin\n";

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="invitation_template.csv"',
        ]);
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
