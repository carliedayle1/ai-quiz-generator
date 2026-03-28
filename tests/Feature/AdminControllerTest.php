<?php

namespace Tests\Feature;

use App\Mail\InvitationMail;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminControllerTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function makeAdmin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function makePendingInvitation(User $admin, string $email = null): Invitation
    {
        return Invitation::create([
            'invited_by' => $admin->id,
            'email' => $email ?? fake()->unique()->safeEmail(),
            'role' => 'teacher',
            'token' => Str::random(64),
            'expires_at' => now()->addDays(7),
        ]);
    }

    // -------------------------------------------------------------------------
    // Non-admin gets 403 on all admin routes
    // -------------------------------------------------------------------------

    public function test_teacher_cannot_access_admin_dashboard(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->get(route('admin.dashboard'));

        $response->assertForbidden();
    }

    public function test_student_cannot_access_admin_dashboard(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)->get(route('admin.dashboard'));

        $response->assertForbidden();
    }

    public function test_non_admin_cannot_access_admin_users(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->get(route('admin.users'));

        $response->assertForbidden();
    }

    public function test_non_admin_cannot_access_admin_invitations(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->get(route('admin.invitations'));

        $response->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_access_admin_routes(): void
    {
        $response = $this->get(route('admin.dashboard'));

        $response->assertRedirect(route('login'));
    }

    // -------------------------------------------------------------------------
    // Admin can view dashboard with stats
    // -------------------------------------------------------------------------

    public function test_admin_can_view_dashboard_with_stats(): void
    {
        $admin = $this->makeAdmin();
        User::factory()->create(['role' => 'teacher']);
        User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $page->component('Admin/Dashboard')
                ->has('stats')
                ->has('stats.total_users')
                ->has('stats.teachers')
                ->has('stats.students')
                ->has('stats.admins')
                ->has('stats.pending_invitations');
        });
    }

    public function test_admin_dashboard_stats_are_accurate(): void
    {
        $admin = $this->makeAdmin();
        User::factory()->create(['role' => 'teacher']);
        User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $page->component('Admin/Dashboard')
                ->where('stats.total_users', 3)  // admin + teacher + student
                ->where('stats.teachers', 1)
                ->where('stats.students', 1)
                ->where('stats.admins', 1);
        });
    }

    // -------------------------------------------------------------------------
    // Admin can view users list
    // -------------------------------------------------------------------------

    public function test_admin_can_view_users_list(): void
    {
        $admin = $this->makeAdmin();
        User::factory()->count(3)->create(['role' => 'student']);

        $response = $this->actingAs($admin)->get(route('admin.users'));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $page->component('Admin/Users')
                ->has('users');
        });
    }

    // -------------------------------------------------------------------------
    // Admin can view invitations list
    // -------------------------------------------------------------------------

    public function test_admin_can_view_invitations_list(): void
    {
        $admin = $this->makeAdmin();
        $this->makePendingInvitation($admin);

        $response = $this->actingAs($admin)->get(route('admin.invitations'));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $page->component('Admin/Invitations')
                ->has('invitations');
        });
    }

    // -------------------------------------------------------------------------
    // Admin can send invitation (mocks Mail)
    // -------------------------------------------------------------------------

    public function test_admin_can_send_invitation(): void
    {
        Mail::fake();

        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin)->post(route('admin.invitations.send'), [
            'email' => 'newteacher@example.com',
            'role' => 'teacher',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('invitations', [
            'email' => 'newteacher@example.com',
            'role' => 'teacher',
            'invited_by' => $admin->id,
        ]);

        Mail::assertSent(InvitationMail::class, function (InvitationMail $mail) {
            return $mail->invitation->email === 'newteacher@example.com';
        });
    }

    // -------------------------------------------------------------------------
    // Cannot send invitation to existing user
    // -------------------------------------------------------------------------

    public function test_cannot_send_invitation_to_existing_user(): void
    {
        Mail::fake();

        $admin = $this->makeAdmin();
        $existing = User::factory()->create(['email' => 'existing@example.com', 'role' => 'teacher']);

        $response = $this->actingAs($admin)
            ->from(route('admin.invitations'))
            ->post(route('admin.invitations.send'), [
                'email' => 'existing@example.com',
                'role' => 'teacher',
            ]);

        $response->assertSessionHasErrors('email');
        Mail::assertNothingSent();
    }

    // -------------------------------------------------------------------------
    // Cannot send duplicate pending invitation
    // -------------------------------------------------------------------------

    public function test_cannot_send_duplicate_pending_invitation(): void
    {
        Mail::fake();

        $admin = $this->makeAdmin();
        $this->makePendingInvitation($admin, 'pending@example.com');

        $response = $this->actingAs($admin)
            ->from(route('admin.invitations'))
            ->post(route('admin.invitations.send'), [
                'email' => 'pending@example.com',
                'role' => 'student',
            ]);

        $response->assertSessionHasErrors('email');
        Mail::assertNothingSent();
    }

    // -------------------------------------------------------------------------
    // Admin can revoke pending invitation
    // -------------------------------------------------------------------------

    public function test_admin_can_revoke_pending_invitation(): void
    {
        $admin = $this->makeAdmin();
        $invitation = $this->makePendingInvitation($admin);

        $response = $this->actingAs($admin)
            ->delete(route('admin.invitations.revoke', $invitation));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('invitations', ['id' => $invitation->id]);
    }

    // -------------------------------------------------------------------------
    // Cannot revoke accepted invitation
    // -------------------------------------------------------------------------

    public function test_cannot_revoke_accepted_invitation(): void
    {
        $admin = $this->makeAdmin();

        $invitation = Invitation::create([
            'invited_by' => $admin->id,
            'email' => 'accepted@example.com',
            'role' => 'teacher',
            'token' => Str::random(64),
            'expires_at' => now()->addDays(7),
            'accepted_at' => now(),
        ]);

        $response = $this->actingAs($admin)
            ->from(route('admin.invitations'))
            ->delete(route('admin.invitations.revoke', $invitation));

        $response->assertSessionHasErrors('invitation');

        $this->assertDatabaseHas('invitations', ['id' => $invitation->id]);
    }

    // -------------------------------------------------------------------------
    // Admin can delete user
    // -------------------------------------------------------------------------

    public function test_admin_can_delete_user(): void
    {
        $admin = $this->makeAdmin();
        $target = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($admin)
            ->delete(route('admin.users.destroy', $target));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }

    // -------------------------------------------------------------------------
    // Admin cannot delete themselves
    // -------------------------------------------------------------------------

    public function test_admin_cannot_delete_themselves(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin)
            ->from(route('admin.users'))
            ->delete(route('admin.users.destroy', $admin));

        $response->assertSessionHasErrors('user');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    // -------------------------------------------------------------------------
    // Invitation validation
    // -------------------------------------------------------------------------

    public function test_send_invitation_requires_valid_role(): void
    {
        Mail::fake();

        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin)
            ->from(route('admin.invitations'))
            ->post(route('admin.invitations.send'), [
                'email' => 'someone@example.com',
                'role' => 'superuser',
            ]);

        $response->assertSessionHasErrors('role');
        Mail::assertNothingSent();
    }

    public function test_send_invitation_requires_valid_email(): void
    {
        Mail::fake();

        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin)
            ->from(route('admin.invitations'))
            ->post(route('admin.invitations.send'), [
                'email' => 'not-an-email',
                'role' => 'teacher',
            ]);

        $response->assertSessionHasErrors('email');
        Mail::assertNothingSent();
    }
}
