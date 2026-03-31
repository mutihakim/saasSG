<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ], ['X-Inertia' => 'true']);

        $this->assertAuthenticated();
        // Since we are using Inertia::location, it may not be a standard 302 redirect.
        // We check for the location header or status code.
        $response->assertStatus(409);
        $this->assertEquals(route('tenant.dashboard', 'test-user'), $response->headers->get('X-Inertia-Location'));
    }
}