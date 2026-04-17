<?php

namespace App\Http\Controllers\Api\V1\Games;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\Games\TahfizGameService;
use App\Support\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TahfizApiController extends Controller
{
    use ApiResponder;

    public function __construct(private readonly TahfizGameService $tahfizGameService)
    {
    }

    public function bootstrap(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        return $this->ok($this->tahfizGameService->bootstrap($tenant, $member));
    }

    public function surahs(Request $request, Tenant $tenant): JsonResponse
    {
        return $this->ok($this->tahfizGameService->surahs()->toArray());
    }

    public function surah(Request $request, Tenant $tenant, int $id): JsonResponse
    {
        $surah = $this->tahfizGameService->surahDetail($id, $tenant);
        if (!$surah) {
            return $this->error('NOT_FOUND', 'Surat tidak ditemukan.', [], 404);
        }
        return $this->ok($surah->toArray());
    }

    public function settings(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        return $this->ok($this->tahfizGameService->settings($tenant, $member));
    }

    public function updateSettings(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'default_provider' => ['nullable', 'string'],
            'default_reciter' => ['nullable', 'string'],
            'auto_next' => ['required', 'boolean'],
            'repeat_count' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        return $this->ok($this->tahfizGameService->updateSettings($tenant, $member, $data));
    }

    public function history(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        $limit = $request->integer('limit', 20);
        return $this->ok($this->tahfizGameService->history($tenant, $member, $limit)->toArray());
    }

    public function murojaahHistory(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        $limit = $request->integer('limit', 200);
        return $this->ok($this->tahfizGameService->murojaahHistory($tenant, $member, $limit)->toArray());
    }

    public function recordProgress(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'surah_number' => ['required', 'integer', 'min:1', 'max:114'],
            'ayat_awal' => ['required', 'integer', 'min:1'],
            'ayat_akhir' => ['required', 'integer', 'min:1'],
            'status' => ['nullable', 'string'],
        ]);

        return $this->ok($this->tahfizGameService->recordProgress($tenant, $member, $data)->toArray());
    }

    public function recordMurojaah(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $this->resolveMember($request, $tenant);
        if (!$member) {
            return $this->memberNotFound();
        }

        $data = $request->validate([
            'surah_number' => ['required', 'integer', 'min:1', 'max:114'],
            'ayat' => ['required', 'integer', 'min:1'],
            'tajwid_status' => ['required', 'string', 'in:bagus,cukup,kurang'],
            'hafalan_status' => ['required', 'string', 'in:lancar,terbata,belum_hafal'],
            'catatan' => ['nullable', 'string'],
        ]);

        return $this->ok($this->tahfizGameService->recordMurojaah($tenant, $member, $data)->toArray());
    }

    public function favorites(Request $request, Tenant $tenant): JsonResponse
    {
        return $this->ok($this->tahfizGameService->favorites($tenant)->toArray());
    }

    public function updateFavorite(Request $request, Tenant $tenant): JsonResponse
    {
        $data = $request->validate([
            'surah_id' => ['required', 'integer', 'exists:quran_surahs,id'],
            'ayah_start' => ['required', 'integer'],
            'ayah_end' => ['required', 'integer'],
            'note' => ['nullable', 'string'],
            'category' => ['nullable', 'string'],
        ]);

        return $this->ok($this->tahfizGameService->toggleFavorite(
            $tenant, 
            $data['surah_id'], 
            $data['ayah_start'], 
            $data['ayah_end'], 
            $data['note'] ?? null, 
            $data['category'] ?? null
        )->toArray());
    }

    public function removeFavorite(Request $request, Tenant $tenant): JsonResponse
    {
        $data = $request->validate([
            'surah_id' => ['required', 'integer'],
            'ayah_start' => ['required', 'integer'],
            'ayah_end' => ['required', 'integer'],
        ]);

        $this->tahfizGameService->removeFavorite($tenant, $data['surah_id'], $data['ayah_start'], $data['ayah_end']);
        return $this->ok(['message' => 'Favorite removed.']);
    }

    private function resolveMember(Request $request, Tenant $tenant): ?TenantMember
    {
        $member = $request->attributes->get('currentTenantMember');

        if (!$member instanceof TenantMember) {
            return null;
        }

        if ((int) $member->tenant_id !== (int) $tenant->id) {
            return null;
        }

        return $member;
    }

    private function memberNotFound(): JsonResponse
    {
        return $this->error('NOT_FOUND', 'Tenant member not found.', [], 404);
    }
}
