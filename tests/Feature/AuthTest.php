<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function makePendingInvitation(array $overrides = []): Invitation
    {
        $admin = User::factory()->create(['role' => 'admin']);

        return Invitation::create(array_merge([
            'invited_by' => $admin->id,
            'email' => 'invite@example.com',
            'role' => 'teacher',
            'token' => Str::random(64),
            'expires_at' => now()->addDays(7),
        ], $overrides));
    }

    // -------------------------------------------------------------------------
    // Register page without token shows 403
    // -------------------------------------------------------------------------

    public function test_register_page_without_token_shows_forbidden(): void
    {
        $response = $this->get(route('register'));

        $response->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // Register page with valid token shows form with pre-filled email
    // -------------------------------------------------------------------------

    public function test_register_page_with_valid_token_shows_form_with_prefilled_email(): void
    {
        $invitation = $this->makePendingInvitation(['email' => 'prefilled@example.com']);

        $response = $this->get(route('register', ['token' => $invitation->token]));

        $response->assertOk();
        $response->assertInertia(function ($page) use ($invitation) {
            $page->component('Auth/Register')
                ->has('invitation')
                ->where('invitation.email', $invitation->email)
                ->where('invitation.role', $invitation->role)
                ->where('invitation.token', $invitation->token);
        });
    }

    // -------------------------------------------------------------------------
    // Register page with expired token shows 404
    // -------------------------------------------------------------------------

    public function test_register_page_with_expired_token_shows_not_found(): void
    {
        $invitation = $this->makePendingInvitation([
            'expires_at' => now()->subDay(),
        ]);

        $response = $this->get(route('register', ['token' => $invitation->token]));

        $response->assertNotFound();
    }

    // -------------------------------------------------------------------------
    // Register page with already-accepted token shows 404
    // -------------------------------------------------------------------------

    public function test_register_page_with_accepted_token_shows_not_found(): void
    {
        $invitation = $this->makePendingInvitation([
            'accepted_at' => now()->subHour(),
        ]);

        $response = $this->get(route('register', ['token' => $invitation->token]));

        $response->assertNotFound();
    }

    // -------------------------------------------------------------------------
    // Registration with valid token creates user with correct role
    // -------------------------------------------------------------------------

    public function test_registration_with_valid_token_creates_user_with_correct_role(): void
    {
        $invitation = $this->makePendingInvitation([
            'email' => 'newteacher@example.com',
            'role' => 'teacher',
        ]);

        $response = $this->post(route('register'), [
            'first_name' => 'New', 'last_name' => 'Teacher', 'id_number' => 'USR000001',
            'email' => 'newteacher@example.com',
            'password' => 'password123!',
            'password_confirmation' => 'password123!',
            'token' => $invitation->token,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'newteacher@example.com',
            'role' => 'teacher',
        ]);
    }

    public function test_registration_creates_user_with_student_role_from_invitation(): void
    {
        $invitation = $this->makePendingInvitation([
            'email' => 'newstudent@example.com',
            'role' => 'student',
        ]);

        $this->post(route('register'), [
            'first_name' => 'New', 'last_name' => 'Student', 'id_number' => 'USR000002',
            'email' => 'newstudent@example.com',
            'password' => 'password123!',
            'password_confirmation' => 'password123!',
            'token' => $invitation->token,
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'newstudent@example.com',
            'role' => 'student',
        ]);
    }

    // -------------------------------------------------------------------------
    // Registration email must match invitation
    // -------------------------------------------------------------------------

    public function test_registration_email_must_match_invitation_email(): void
    {
        $invitation = $this->makePendingInvitation([
            'email' => 'correct@example.com',
            'role' => 'teacher',
        ]);

        $response = $this->post(route('register'), [
            'first_name' => 'Wrong', 'last_name' => 'Email', 'id_number' => 'USR000003',
            'email' => 'wrong@example.com',
            'password' => 'password123!',
            'password_confirmation' => 'password123!',
            'token' => $invitation->token,
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseMissing('users', ['email' => 'wrong@example.com']);
    }

    // -------------------------------------------------------------------------
    // Registration marks invitation as accepted
    // -------------------------------------------------------------------------

    public function test_registration_marks_invitation_as_accepted(): void
    {
        $invitation = $this->makePendingInvitation([
            'email' => 'user@example.com',
            'role' => 'teacher',
        ]);

        $this->assertNull($invitation->accepted_at);

        $this->post(route('register'), [
            'first_name' => 'New', 'last_name' => 'User', 'id_number' => 'USR000004',
            'email' => 'user@example.com',
            'password' => 'password123!',
            'password_confirmation' => 'password123!',
            'token' => $invitation->token,
        ]);

        $invitation->refresh();
        $this->assertNotNull($invitation->accepted_at);
    }

    // -------------------------------------------------------------------------
    // Registration with invalid / missing token is rejected
    // -------------------------------------------------------------------------

    public function test_registration_with_missing_token_is_rejected(): void
    {
        $response = $this->post(route('register'), [
            'first_name' => 'No', 'last_name' => 'Token', 'id_number' => 'USR000005',
            'email' => 'notoken@example.com',
            'password' => 'password123!',
            'password_confirmation' => 'password123!',
        ]);

        $response->assertSessionHasErrors('token');
    }

    public function test_registration_with_expired_token_is_rejected(): void
    {
        $invitation = $this->makePendingInvitation([
            'email' => 'expired@example.com',
            'expires_at' => now()->subDay(),
        ]);

        // firstOrFail on an expired token 404s
        $response = $this->post(route('register'), [
            'first_name' => 'Expired', 'last_name' => 'Token', 'id_number' => 'USR000006',
            'email' => 'expired@example.com',
            'password' => 'password123!',
            'password_confirmation' => 'password123!',
            'token' => $invitation->token,
        ]);

        $response->assertNotFound();
        $this->assertDatabaseMissing('users', ['email' => 'expired@example.com']);
    }

    // -------------------------------------------------------------------------
    // Login works correctly
    // -------------------------------------------------------------------------

    public function test_login_works_correctly(): void
    {
        $user = User::factory()->create([
            'email' => 'logintest@example.com',
            'role' => 'teacher',
        ]);

        $response = $this->post(route('login'), [
            'email' => 'logintest@example.com',
            'password' => 'password',
        ]);

        $response->assertRedirect();
        $this->assertAuthenticated();
    }

    public function test_login_with_wrong_password_fails(): void
    {
        User::factory()->create([
            'email' => 'badlogin@example.com',
            'role' => 'student',
        ]);

        $response = $this->post(route('login'), [
            'email' => 'badlogin@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertSessionHasErrors();
        $this->assertGuest();
    }

    public function test_login_with_nonexistent_email_fails(): void
    {
        $response = $this->post(route('login'), [
            'email' => 'nobody@example.com',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors();
        $this->assertGuest();
    }

    // -------------------------------------------------------------------------
    // Unauthenticated users are redirected to login
    // -------------------------------------------------------------------------

    public function test_unauthenticated_user_is_redirected_to_login_from_dashboard(): void
    {
        $response = $this->get(route('dashboard'));

        $response->assertRedirect(route('login'));
    }

    public function test_unauthenticated_user_is_redirected_to_login_from_classes(): void
    {
        $response = $this->get(route('classes.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_unauthenticated_user_is_redirected_to_login_from_admin(): void
    {
        $response = $this->get(route('admin.dashboard'));

        $response->assertRedirect(route('login'));
    }

    // -------------------------------------------------------------------------
    // Successful registration logs user in
    // -------------------------------------------------------------------------

    public function test_successful_registration_authenticates_user(): void
    {
        $invitation = $this->makePendingInvitation([
            'email' => 'autologin@example.com',
            'role' => 'student',
        ]);

        $this->post(route('register'), [
            'first_name' => 'Auto', 'last_name' => 'Login', 'id_number' => 'USR000007',
            'email' => 'autologin@example.com',
            'password' => 'password123!',
            'password_confirmation' => 'password123!',
            'token' => $invitation->token,
        ]);

        $this->assertAuthenticated();
    }

    // -------------------------------------------------------------------------
    // Logout works correctly
    // -------------------------------------------------------------------------

    public function test_logged_in_user_can_log_out(): void
    {
        $user = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($user)->post(route('logout'));

        $response->assertRedirect('/');
        $this->assertGuest();
    }
}
