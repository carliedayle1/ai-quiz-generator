<?php

namespace Tests\Feature\Auth;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_without_token_returns_403(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(403);
    }

    public function test_registration_screen_with_valid_token_can_be_rendered(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = str_repeat('a', 64);
        Invitation::create([
            'invited_by' => $admin->id,
            'email' => 'newuser@example.com',
            'role' => 'student',
            'token' => $token,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->get('/register?token=' . $token);

        $response->assertStatus(200);
    }

    public function test_new_users_can_register_with_valid_invitation(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = str_repeat('a', 64);
        Invitation::create([
            'invited_by' => $admin->id,
            'email' => 'newuser@example.com',
            'role' => 'student',
            'token' => $token,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->post('/register', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'token' => $token,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('users', ['email' => 'newuser@example.com', 'role' => 'student']);
    }
}
