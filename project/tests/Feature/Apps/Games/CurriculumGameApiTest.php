<?php

namespace Tests\Feature\Apps\Games;

use App\Models\Games\GameCurriculumQuestion;
use App\Models\Games\GameCurriculumUnit;
use App\Models\Games\TenantCurriculumEntitlement;
use App\Models\Identity\User;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CurriculumGameApiTest extends TestCase
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

        return [$tenant, $user, $member];
    }

    private function createUnitWithQuestions(?int $tenantId = null): GameCurriculumUnit
    {
        $unit = GameCurriculumUnit::create([
            'tenant_id' => $tenantId,
            'educational_phase' => 'sd',
            'grade' => 4,
            'subject' => 'Matematika',
            'semester' => 1,
            'chapter' => 'Pecahan',
            'curriculum_type' => 'kurikulum_merdeka',
            'difficulty_level' => 'pilot',
            'row_version' => 1,
        ]);

        foreach ([
            ['question_text' => 'Pecahan setara 1/2?', 'options' => ['2/4', '3/4', '1/3', '2/3'], 'correct_answer' => '2/4'],
            ['question_text' => 'Bagian dimakan dari 8 potong jika 3 diambil?', 'options' => ['3/8', '5/8', '3/5', '8/3'], 'correct_answer' => '3/8'],
        ] as $index => $seed) {
            GameCurriculumQuestion::create([
                'tenant_id' => $tenantId,
                'curriculum_unit_id' => $unit->id,
                'question_key' => "q-{$index}",
                'question_text' => $seed['question_text'],
                'options' => $seed['options'],
                'correct_answer' => $seed['correct_answer'],
                'question_type' => 'multiple_choice',
                'points' => 10,
                'difficulty_order' => $index + 1,
                'row_version' => 1,
            ]);
        }

        return $unit;
    }

    public function test_config_returns_only_entitled_units_and_question_deck(): void
    {
        [$tenant, $user, $member] = $this->seedTenantMember();

        $visibleUnit = $this->createUnitWithQuestions();
        $hiddenUnit = GameCurriculumUnit::create([
            'tenant_id' => null,
            'educational_phase' => 'smp',
            'grade' => 7,
            'subject' => 'IPA',
            'semester' => 1,
            'chapter' => 'Suhu',
            'curriculum_type' => 'kurikulum_merdeka',
            'row_version' => 1,
        ]);

        TenantCurriculumEntitlement::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'subject' => 'Matematika',
            'is_active' => true,
        ]);

        $config = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/curriculum/config");

        $config->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonCount(1, 'data.config.units')
            ->assertJsonPath('data.config.units.0.id', $visibleUnit->id)
            ->assertJsonPath('data.config.default_time_limit', 20)
            ->assertJsonPath('data.config.time_limit_options.0', 10);

        $questions = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/curriculum/units/{$visibleUnit->id}/questions?limit=2");

        $questions->assertOk()
            ->assertJsonCount(2, 'data.questions')
            ->assertJsonPath('data.unit.id', $visibleUnit->id);

        $this->assertDatabaseHas('curriculum_units', ['id' => $hiddenUnit->id]);
        $this->assertSame($member->id, $member->fresh()->id);
    }

    public function test_attempt_finish_and_history_return_saved_curriculum_session(): void
    {
        [$tenant, $user] = $this->seedTenantMember();

        $unit = $this->createUnitWithQuestions();
        $question = GameCurriculumQuestion::query()->where('curriculum_unit_id', $unit->id)->firstOrFail();

        TenantCurriculumEntitlement::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'subject' => 'Matematika',
            'is_active' => true,
        ]);

        $attempt = $this->postJson("/api/v1/tenants/{$tenant->slug}/games/curriculum/attempt", [
            'question_id' => $question->id,
            'selected_answer' => '2/4',
        ]);

        $attempt->assertOk()
            ->assertJsonPath('data.result.is_correct', true)
            ->assertJsonPath('data.result.correct_answer', '2/4');

        $finish = $this->postJson("/api/v1/tenants/{$tenant->slug}/games/curriculum/session/finish", [
            'unit_id' => $unit->id,
            'question_count' => 2,
            'correct_count' => 1,
            'wrong_count' => 1,
            'best_streak' => 1,
            'time_limit' => 20,
            'duration_seconds' => 30,
            'summary' => [
                'attempts' => [
                    [
                        'question_text' => 'Pecahan setara 1/2?',
                        'selected_answer' => '2/4',
                        'correct_answer' => '2/4',
                        'is_correct' => true,
                    ],
                ],
            ],
        ]);

        $finish->assertCreated()
            ->assertJsonPath('data.session.score_percent', 50);

        $history = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/curriculum/history");

        $history->assertOk()
            ->assertJsonCount(1, 'data.sessions')
            ->assertJsonPath('data.sessions.0.subject', 'Matematika')
            ->assertJsonPath('data.sessions.0.chapter', 'Pecahan')
            ->assertJsonPath('data.sessions.0.correct_count', 1)
            ->assertJsonPath('data.sessions.0.time_limit_seconds', 20);
    }

    public function test_unit_update_uses_optimistic_locking_and_logs_activity(): void
    {
        [$tenant] = $this->seedTenantMember();

        $unit = GameCurriculumUnit::create([
            'tenant_id' => $tenant->id,
            'educational_phase' => 'sd',
            'grade' => 4,
            'subject' => 'Matematika',
            'semester' => 1,
            'chapter' => 'Bangun Datar',
            'curriculum_type' => 'kurikulum_merdeka',
            'row_version' => 1,
        ]);

        $this->patchJson("/api/v1/tenants/{$tenant->slug}/games/curriculum/admin/units/{$unit->id}", [
            'educational_phase' => 'sd',
            'grade' => 4,
            'subject' => 'Matematika',
            'semester' => 1,
            'chapter' => 'Bangun Datar Lanjutan',
            'curriculum_type' => 'kurikulum_merdeka',
            'row_version' => 1,
        ])->assertOk()
            ->assertJsonPath('data.unit.chapter', 'Bangun Datar Lanjutan')
            ->assertJsonPath('data.unit.row_version', 2);

        $conflict = $this->patchJson("/api/v1/tenants/{$tenant->slug}/games/curriculum/admin/units/{$unit->id}", [
            'educational_phase' => 'sd',
            'grade' => 4,
            'subject' => 'Matematika',
            'semester' => 1,
            'chapter' => 'Stale Update',
            'curriculum_type' => 'kurikulum_merdeka',
            'row_version' => 1,
        ]);

        $conflict->assertStatus(409)
            ->assertJsonPath('ok', false)
            ->assertJsonPath('error.code', 'VERSION_CONFLICT');

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $tenant->id,
            'action' => 'games.curriculum.unit.updated',
            'target_type' => GameCurriculumUnit::class,
            'target_id' => (string) $unit->id,
        ]);
    }

    public function test_question_csv_import_creates_questions_with_contextual_options(): void
    {
        [$tenant] = $this->seedTenantMember();

        $unit = GameCurriculumUnit::create([
            'tenant_id' => $tenant->id,
            'educational_phase' => 'sd',
            'grade' => 4,
            'subject' => 'Matematika',
            'semester' => 1,
            'chapter' => 'Keliling',
            'curriculum_type' => 'kurikulum_merdeka',
            'row_version' => 1,
        ]);

        $file = UploadedFile::fake()->createWithContent('curriculum.csv', implode("\n", [
            'question_key,question_text,option_a,option_b,option_c,option_d,correct_answer,points,difficulty_order',
            'perimeter-01,"Keliling persegi dengan sisi 5 cm adalah...","20 cm","25 cm","10 cm","15 cm","20 cm",10,1',
        ]));

        $response = $this->postJson("/api/v1/tenants/{$tenant->slug}/games/curriculum/admin/units/{$unit->id}/questions/import", [
            'file' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.created', 1)
            ->assertJsonCount(0, 'data.errors');

        $this->assertDatabaseHas('curriculum_questions', [
            'tenant_id' => $tenant->id,
            'curriculum_unit_id' => $unit->id,
            'question_key' => 'perimeter-01',
            'correct_answer' => '20 cm',
        ]);
    }

    public function test_cross_tenant_curriculum_access_is_hidden_with_404(): void
    {
        [$tenantA, $user] = $this->seedTenantMember('tenant-a');

        $tenantB = Tenant::create([
            'owner_user_id' => $user->id,
            'name' => 'Tenant B',
            'slug' => 'tenant-b',
            'locale' => 'id',
            'timezone' => 'Asia/Jakarta',
            'plan_code' => 'pro',
            'status' => 'active',
        ]);

        $unit = $this->createUnitWithQuestions($tenantB->id);

        $response = $this->getJson("/api/v1/tenants/{$tenantB->slug}/games/curriculum/units/{$unit->id}/questions");

        $response->assertStatus(404)
            ->assertJsonPath('ok', false)
            ->assertJsonPath('error.code', 'NOT_FOUND');

        $this->assertTrue($tenantA->exists);
        $this->assertSame(0, DB::table('tenant_game_sessions')->where('game_slug', 'curriculum')->count());
    }
}
