<?php

namespace Tests\Feature\Apps\Games;

use App\Models\Identity\User;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TahfizGameApiTest extends TestCase
{
    private function seedTenantMember(string $slug = 'tenant-tahfiz'): array
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

    public function test_surahs_returns_list_of_surahs(): void
    {
        [$tenant] = $this->seedTenantMember();

        DB::table('quran_surahs')->updateOrInsert(['id' => 1], [
            'nama' => 'الفاتحة',
            'nama_latin' => 'Al-Fatihah',
            'jumlah_ayat' => 7,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/tahfiz/surahs");

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonFragment(['nama_latin' => 'Al-Fatihah']);
    }

    public function test_surah_detail_returns_verses(): void
    {
        [$tenant] = $this->seedTenantMember();

        DB::table('quran_surahs')->updateOrInsert(['id' => 114], [
            'nama' => 'الناس',
            'nama_latin' => 'An-Nas',
            'jumlah_ayat' => 6,
        ]);

        DB::table('quran_ayahs')->updateOrInsert([
            'surah_id' => 114,
            'nomor_ayat' => 1,
        ], [
            'teks_arab' => 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
            'teks_indonesia' => 'Katakanlah, "Aku berlindung kepada Tuhannya manusia',
        ]);

        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/tahfiz/surahs/114");

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.ayahs.0.nomor_ayat', 1);
    }

    public function test_settings_can_be_retrieved_and_saved(): void
    {
        [$tenant, $member] = $this->seedTenantMember();

        // Save settings (using snake_case as expected by controller validation)
        $this->postJson("/api/v1/tenants/{$tenant->slug}/games/tahfiz/settings", [
            'repeat_count' => 5,
            'auto_next' => true,
            'default_provider' => 'EQURAN_ID',
            'default_reciter' => '01'
        ])->assertOk();

        // Retrieve settings
        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/tahfiz/settings");

        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('data.repeat_count', 5)
            ->assertJsonPath('data.auto_next', true);
    }

    public function test_ayah_can_be_favorited_and_retrieved(): void
    {
        [$tenant] = $this->seedTenantMember();

        // Ensure surah and ayah exist
        DB::table('quran_surahs')->updateOrInsert(['id' => 1], [
            'nama' => 'الفاتحة',
            'nama_latin' => 'Al-Fatihah',
            'jumlah_ayat' => 7,
        ]);

        DB::table('quran_ayahs')->updateOrInsert(['id' => 1], [
            'surah_id' => 1,
            'nomor_ayat' => 1,
            'teks_arab' => '...',
            'teks_indonesia' => '...',
        ]);

        // Favorite the ayah
        $this->postJson("/api/v1/tenants/{$tenant->slug}/games/tahfiz/favorites", [
            'surah_id' => 1,
            'ayah_start' => 1,
            'ayah_end' => 1,
            'note' => 'My favorite ayah',
            'category' => 'Testing'
        ])->assertOk();

        // Retrieve favorites
        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/tahfiz/favorites");
        $response->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.note', 'My favorite ayah');

        // Check if surah detail includes favorite info
        $response = $this->getJson("/api/v1/tenants/{$tenant->slug}/games/tahfiz/surahs/1");
        $response->assertOk()
            ->assertJsonPath('data.ayahs.0.tenant_favorites.0.note', 'My favorite ayah');

        // Remove favorite
        $this->postJson("/api/v1/tenants/{$tenant->slug}/games/tahfiz/favorites/remove", [
            'surah_id' => 1,
            'ayah_start' => 1,
            'ayah_end' => 1,
        ])->assertOk();

        // Verify removed
        $this->getJson("/api/v1/tenants/{$tenant->slug}/games/tahfiz/favorites")
            ->assertJsonCount(0, 'data');
    }
}
