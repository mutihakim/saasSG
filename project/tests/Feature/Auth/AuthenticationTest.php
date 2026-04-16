<?php

namespace Tests\Feature\Auth;

use App\Models\Identity\User;
use App\Providers\RouteServiceProvider;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{


    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();
        $tenant = \App\Models\Tenant\Tenant::factory()->create();
        \App\Models\Tenant\TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'full_name' => $user->name,
            'role_code' => 'owner',
            'profile_status' => 'active',
        ]);


        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect();
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();
        $tenant = \App\Models\Tenant\Tenant::factory()->create();
        \App\Models\Tenant\TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'full_name' => $user->name,
            'role_code' => 'owner',
            'profile_status' => 'active',
        ]);

        $response = $this->actingAs($user)->post('/logout', [], ['X-Inertia' => 'true']);

        $this->assertGuest();
        $response->assertStatus(409);
        $this->assertEquals(config('app.url'), $response->headers->get('X-Inertia-Location'));
    }
}
