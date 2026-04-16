<?php

namespace Tests\Feature\Apps\Games;

use App\Models\Identity\User;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;

use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VocabularyGameApiTest extends TestCase
{

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

        return [$tenant, $member];
    }

    public function test_words_returns_day_words_with_progress_map(): void
    {
        [$tenant, $member] = $this->seedTenantMember();

        $wordId = DB::table('tenant_game_vocabulary_words')->insertGetId([
            'tenant_id' => null,
            'bahasa_indonesia' => 'apel',
            'bahasa_inggris' => 'apple',
            'fonetik' => 'aepl',
            'bahasa_arab' => 'تفاح',
            'fonetik_arab' => 'tuffah',
            'kategori' => 'Buah-buahan',
            'hari' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_game_vocabulary_progress')->insert([
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'word_id' => $wordId,
            'language' => 'english',
            'jumlah_benar' => 3,
            'jumlah_salah' => 1,
            'correct_streak' => 2,
            'max_streak' => 3,
            'is_mastered' => false,
            'last_practiced_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson(
            "/api/v1/tenants/{$tenant->slug}/games/vocabulary/words?language=english&category=Buah-buahan&day=1"
        );

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonCount(1, 'data.words')
            ->assertJsonPath('data.words.0.bahasa_indonesia', 'apel')
            ->assertJsonPath("data.progress.{$wordId}.correct_streak", 2);
    }

    public function test_config_marks_mastered_days_from_effective_words_not_raw_duplicates(): void
    {
        [$tenant, $member] = $this->seedTenantMember();

        $globalWordId = DB::table('tenant_game_vocabulary_words')->insertGetId([
            'tenant_id' => null,
            'bahasa_indonesia' => 'kepala',
            'bahasa_inggris' => 'head',
            'fonetik' => 'hed',
            'bahasa_arab' => 'رَأْسٌ',
            'fonetik_arab' => 'ra sun',
            'kategori' => 'Anggota Tubuh',
            'hari' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $tenantWordId = DB::table('tenant_game_vocabulary_words')->insertGetId([
            'tenant_id' => $tenant->id,
            'bahasa_indonesia' => 'kepala',
            'bahasa_inggris' => 'head override',
            'fonetik' => 'hed',
            'bahasa_arab' => 'رَأْسٌ',
            'fonetik_arab' => 'ra sun',
            'kategori' => 'Anggota Tubuh',
            'hari' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_game_vocabulary_settings')->insert([
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'language' => 'english',
            'default_mode' => 'practice',
            'default_question_count' => 10,
            'mastered_threshold' => 1,
            'default_time_limit' => 5,
            'auto_tts' => true,
            'translation_direction' => 'id_to_target',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_game_vocabulary_progress')->insert([
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'word_id' => $tenantWordId,
            'language' => 'english',
            'jumlah_benar' => 1,
            'jumlah_salah' => 0,
            'correct_streak' => 1,
            'max_streak' => 1,
            'is_mastered' => true,
            'last_practiced_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/config");

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.config.mastered_days.english.Anggota Tubuh.0', 1);

        $this->assertDatabaseHas('tenant_game_vocabulary_words', ['id' => $globalWordId]);
    }

    public function test_attempt_respects_threshold_setting_and_marks_mastered(): void
    {
        [$tenant, $member] = $this->seedTenantMember();

        $wordId = DB::table('tenant_game_vocabulary_words')->insertGetId([
            'tenant_id' => null,
            'bahasa_indonesia' => 'kucing',
            'bahasa_inggris' => 'cat',
            'fonetik' => null,
            'bahasa_arab' => 'قط',
            'fonetik_arab' => null,
            'kategori' => 'Hewan Darat',
            'hari' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_game_vocabulary_settings')->insert([
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'language' => 'english',
            'default_mode' => 'practice',
            'default_question_count' => 10,
            'mastered_threshold' => 2,
            'auto_tts' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->postJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/attempt", [
            'word_id' => $wordId,
            'language' => 'english',
            'is_correct' => true,
            'current_streak' => 1,
        ])->assertOk()
            ->assertJsonPath('data.stats.is_mastered', false);

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/attempt", [
            'word_id' => $wordId,
            'language' => 'english',
            'is_correct' => true,
            'current_streak' => 2,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.stats.correct_streak', 2)
            ->assertJsonPath('data.stats.max_streak', 2)
            ->assertJsonPath('data.stats.is_mastered', true);
    }

    public function test_wrong_attempt_resets_current_streak_and_can_unmaster_word(): void
    {
        [$tenant, $member] = $this->seedTenantMember();

        $wordId = DB::table('tenant_game_vocabulary_words')->insertGetId([
            'tenant_id' => null,
            'bahasa_indonesia' => 'anjing',
            'bahasa_inggris' => 'dog',
            'fonetik' => null,
            'bahasa_arab' => 'كلب',
            'fonetik_arab' => null,
            'kategori' => 'Hewan Darat',
            'hari' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_game_vocabulary_settings')->insert([
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'language' => 'english',
            'default_mode' => 'practice',
            'default_question_count' => 10,
            'mastered_threshold' => 2,
            'default_time_limit' => 5,
            'auto_tts' => true,
            'translation_direction' => 'id_to_target',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_game_vocabulary_progress')->insert([
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'word_id' => $wordId,
            'language' => 'english',
            'jumlah_benar' => 2,
            'jumlah_salah' => 0,
            'correct_streak' => 2,
            'max_streak' => 2,
            'is_mastered' => true,
            'last_practiced_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/attempt", [
            'word_id' => $wordId,
            'language' => 'english',
            'is_correct' => false,
            'current_streak' => 0,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.stats.jumlah_benar', 2)
            ->assertJsonPath('data.stats.jumlah_salah', 1)
            ->assertJsonPath('data.stats.correct_streak', 0)
            ->assertJsonPath('data.stats.max_streak', 2)
            ->assertJsonPath('data.stats.is_mastered', false);

        $this->assertDatabaseHas('tenant_game_vocabulary_progress', [
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'word_id' => $wordId,
            'language' => 'english',
            'correct_streak' => 0,
            'max_streak' => 2,
            'is_mastered' => false,
        ]);
    }

    public function test_finish_session_and_history_return_saved_vocabulary_session(): void
    {
        [$tenant] = $this->seedTenantMember();

        $finish = $this->postJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/session/finish", [
            'language' => 'english',
            'mode' => 'practice',
            'category' => 'Buah-buahan',
            'day' => 1,
            'question_count' => 5,
            'correct_count' => 4,
            'wrong_count' => 1,
            'best_streak' => 3,
            'duration_seconds' => 45,
            'summary' => ['source' => 'feature-test'],
        ]);

        $finish->assertCreated()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.session.score_percent', 80);

        $history = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/history?limit=5");

        $history->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonCount(1, 'data.sessions')
            ->assertJsonPath('data.sessions.0.language', 'english')
            ->assertJsonPath('data.sessions.0.mode', 'practice')
            ->assertJsonPath('data.sessions.0.category', 'Buah-buahan')
            ->assertJsonPath('data.sessions.0.correct_count', 4);
    }

    public function test_finish_session_accepts_memory_test_and_records_it_in_history(): void
    {
        [$tenant] = $this->seedTenantMember();

        $finish = $this->postJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/session/finish", [
            'language' => 'english',
            'mode' => 'memory_test',
            'category' => 'Buah-buahan',
            'day' => 2,
            'question_count' => 12,
            'correct_count' => 9,
            'wrong_count' => 3,
            'best_streak' => 4,
            'duration_seconds' => 61,
            'summary' => ['source' => 'memory-test'],
        ]);

        $finish->assertCreated()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.session.score_percent', 75);

        $history = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/history?limit=5");

        $history->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonCount(1, 'data.sessions')
            ->assertJsonPath('data.sessions.0.language', 'english')
            ->assertJsonPath('data.sessions.0.mode', 'memory_test')
            ->assertJsonPath('data.sessions.0.category', 'Buah-buahan')
            ->assertJsonPath('data.sessions.0.day', 2)
            ->assertJsonPath('data.sessions.0.question_count', 12)
            ->assertJsonPath('data.sessions.0.correct_count', 9);
    }

    public function test_mastered_returns_vocabulary_words_groupable_by_language(): void
    {
        [$tenant, $member] = $this->seedTenantMember();

        $wordId = DB::table('tenant_game_vocabulary_words')->insertGetId([
            'tenant_id' => null,
            'bahasa_indonesia' => 'air',
            'bahasa_inggris' => 'water',
            'fonetik' => null,
            'bahasa_arab' => 'ماء',
            'fonetik_arab' => null,
            'kategori' => 'Benda',
            'hari' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_game_vocabulary_progress')->insert([
            'tenant_id' => $tenant->id,
            'member_id' => $member->id,
            'word_id' => $wordId,
            'language' => 'english',
            'jumlah_benar' => 8,
            'jumlah_salah' => 1,
            'correct_streak' => 8,
            'max_streak' => 8,
            'is_mastered' => true,
            'last_practiced_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/mastered?language=english");

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonCount(1, 'data.words')
            ->assertJsonPath('data.words.0.language', 'english')
            ->assertJsonPath('data.words.0.word.bahasa_indonesia', 'air')
            ->assertJsonPath('data.words.0.word.kategori', 'Benda');
    }

    public function test_config_mastered_days_are_scoped_to_current_member(): void
    {
        [$tenant] = $this->seedTenantMember();

        $otherUser = User::factory()->create();
        $otherMember = TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $otherUser->id,
            'full_name' => 'Sibling',
            'role_code' => 'member',
            'profile_status' => 'active',
            'row_version' => 1,
        ]);

        $wordId = DB::table('tenant_game_vocabulary_words')->insertGetId([
            'tenant_id' => null,
            'bahasa_indonesia' => 'mata',
            'bahasa_inggris' => 'eye',
            'fonetik' => 'ai',
            'bahasa_arab' => 'عَيْنٌ',
            'fonetik_arab' => 'ainun',
            'kategori' => 'Anggota Tubuh',
            'hari' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_game_vocabulary_settings')->insert([
            'tenant_id' => $tenant->id,
            'member_id' => $otherMember->id,
            'language' => 'english',
            'default_mode' => 'practice',
            'default_question_count' => 10,
            'mastered_threshold' => 1,
            'default_time_limit' => 5,
            'auto_tts' => true,
            'translation_direction' => 'id_to_target',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_game_vocabulary_progress')->insert([
            'tenant_id' => $tenant->id,
            'member_id' => $otherMember->id,
            'word_id' => $wordId,
            'language' => 'english',
            'jumlah_benar' => 1,
            'jumlah_salah' => 0,
            'correct_streak' => 1,
            'max_streak' => 1,
            'is_mastered' => true,
            'last_practiced_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/config");

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonMissingPath('data.config.mastered_days.english.Anggota Tubuh.0');
    }

    public function test_vocabulary_settings_can_be_saved_and_return_timer_and_direction(): void
    {
        [$tenant] = $this->seedTenantMember();

        $this->postJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/settings", [
            'language' => 'english',
            'default_mode' => 'practice',
            'default_question_count' => 10,
            'mastered_threshold' => 5,
            'default_time_limit' => 10,
            'auto_tts' => true,
            'translation_direction' => 'target_to_id',
        ])->assertOk();

        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/vocabulary/settings?language=english");

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonCount(1, 'data.settings')
            ->assertJsonPath('data.settings.0.language', 'english')
            ->assertJsonPath('data.settings.0.default_mode', 'practice')
            ->assertJsonPath('data.settings.0.default_question_count', 10)
            ->assertJsonPath('data.settings.0.mastered_threshold', 5)
            ->assertJsonPath('data.settings.0.default_time_limit', 10)
            ->assertJsonPath('data.settings.0.auto_tts', true)
            ->assertJsonPath('data.settings.0.translation_direction', 'target_to_id');
    }

    public function test_cross_tenant_vocabulary_access_is_hidden_with_404(): void
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

        $response = $this->getJson("/api/v1/tenants/{$tenantB->slug}/games/vocabulary/history");

        $response->assertStatus(404)
            ->assertJsonPath('ok', false)
            ->assertJsonPath('error.code', 'NOT_FOUND');

        $this->assertTrue($tenantA->exists);
    }
}
