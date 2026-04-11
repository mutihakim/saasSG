<?php

namespace Tests\Feature;

use App\Models\Identity\User;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MathGameApiTest extends TestCase
{
    use RefreshDatabase;

    private function seedTenantMember(string $slug = 'tenant-a'): array
    {
        $user = User::factory()->create();

        $tenant = Tenant::create([
            'owner_user_id' => $user->id,
            'name' => strtoupper($slug),
            'slug' => $slug,
            'locale' => 'id',
            'timezone' => 'Asia/Jakarta',
            'plan_code' => 'pro',
            'status' => 'active',
        ]);

        $member = TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'full_name' => 'Owner',
            'role_code' => 'owner',
            'profile_status' => 'active',
            'row_version' => 1,
        ]);

        Sanctum::actingAs($user);

        return [$tenant, $user, $member];
    }

    public function test_attempt_updates_math_stats_and_marks_mastered_when_streak_reaches_threshold(): void
    {
        [$tenant] = $this->seedTenantMember();

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/games/math/attempt", [
            'operator' => '+',
            'angka_pilihan' => 5,
            'angka_random' => 7,
            'is_correct' => true,
            'current_streak' => 8,
        ]);

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.stats.jumlah_benar', 1)
            ->assertJsonPath('data.stats.current_streak_benar', 8)
            ->assertJsonPath('data.stats.max_streak_benar', 8)
            ->assertJsonPath('data.stats.mastered', true);

        $this->assertDatabaseHas('tenant_game_math_stats', [
            'tenant_id' => $tenant->id,
            'operator' => '+',
            'angka_pilihan' => 5,
            'angka_random' => 7,
            'jumlah_benar' => 1,
            'jumlah_salah' => 0,
            'current_streak_benar' => 8,
            'max_streak_benar' => 8,
        ]);
    }

    public function test_wrong_attempt_resets_current_streak_and_increments_wrong_count(): void
    {
        [$tenant] = $this->seedTenantMember();

        $this->postJson("/api/v1/tenants/{$tenant->slug}/games/math/attempt", [
            'operator' => '*',
            'angka_pilihan' => 3,
            'angka_random' => 4,
            'is_correct' => true,
            'current_streak' => 3,
        ])->assertOk();

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/games/math/attempt", [
            'operator' => '*',
            'angka_pilihan' => 3,
            'angka_random' => 4,
            'is_correct' => false,
            'current_streak' => 0,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.stats.jumlah_benar', 1)
            ->assertJsonPath('data.stats.jumlah_salah', 1)
            ->assertJsonPath('data.stats.current_streak_benar', 0)
            ->assertJsonPath('data.stats.max_streak_benar', 3);
    }

    public function test_stats_returns_batch_math_pair_history(): void
    {
        [$tenant] = $this->seedTenantMember();

        $this->postJson("/api/v1/tenants/{$tenant->slug}/games/math/attempt", [
            'operator' => '/',
            'angka_pilihan' => 6,
            'angka_random' => 4,
            'is_correct' => true,
            'current_streak' => 2,
        ])->assertOk();

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/games/math/stats", [
            'pairs' => [
                [
                    'operator' => '/',
                    'angka_pilihan' => 6,
                    'angka_random' => 4,
                ],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('ok', true);

        $stats = $response->json('data.stats');
        $this->assertSame(1, $stats['/|6|4']['jumlah_benar']);
        $this->assertSame(2, $stats['/|6|4']['current_streak_benar']);
        $this->assertFalse($stats['/|6|4']['mastered']);
    }

    public function test_finish_session_and_history_return_saved_math_session(): void
    {
        [$tenant] = $this->seedTenantMember();

        $finish = $this->postJson("/api/v1/tenants/{$tenant->slug}/games/math/session/finish", [
            'operator' => '-',
            'game_mode' => 'mencariC',
            'number_range' => 9,
            'random_range' => 1,
            'question_count' => 10,
            'time_limit' => 15,
            'correct_count' => 7,
            'wrong_count' => 3,
            'best_streak' => 4,
            'duration_seconds' => 88,
            'summary' => ['source' => 'feature-test'],
        ]);

        $finish->assertCreated()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.session.score_percent', 70);

        $history = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/math/history?limit=5");

        $history->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonCount(1, 'data.sessions')
            ->assertJsonPath('data.sessions.0.operator', '-')
            ->assertJsonPath('data.sessions.0.correct_count', 7)
            ->assertJsonPath('data.sessions.0.wrong_count', 3);
    }

    public function test_cross_tenant_math_access_is_hidden_with_404(): void
    {
        [$tenantA] = $this->seedTenantMember('tenant-a');

        $otherOwner = User::factory()->create();
        $tenantB = Tenant::create([
            'owner_user_id' => $otherOwner->id,
            'name' => 'Tenant B',
            'slug' => 'tenant-b',
            'locale' => 'id',
            'timezone' => 'Asia/Jakarta',
            'plan_code' => 'pro',
            'status' => 'active',
        ]);

        $response = $this->getJson("/api/v1/tenants/{$tenantB->slug}/games/math/history");

        $response->assertStatus(404)
            ->assertJsonPath('ok', false)
            ->assertJsonPath('error.code', 'NOT_FOUND');

        $this->assertTrue($tenantA->exists);
    }
}
