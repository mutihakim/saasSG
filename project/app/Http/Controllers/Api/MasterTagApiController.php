<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenantTag;
use App\Models\Tenant;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MasterTagApiController extends Controller
{
    public function __construct(
        private readonly SubscriptionEntitlements $entitlements,
    ) {}

    // GET /master/tags
    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', TenantTag::class);

        $query = TenantTag::forTenant($tenant->id)->popular();

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        return response()->json([
            'ok'   => true,
            'data' => ['tags' => $query->get(['id', 'name', 'color', 'usage_count', 'is_active', 'row_version', 'created_at'])],
        ]);
    }

    // GET /master/tags/suggest?q=
    public function suggest(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', TenantTag::class);

        $q    = $request->get('q', '');
        $tags = TenantTag::forTenant($tenant->id)
            ->when($q, fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->popular()
            ->limit(10)
            ->get(['id', 'name', 'color', 'usage_count']);

        return response()->json(['ok' => true, 'data' => ['tags' => $tags]]);
    }

    // POST /master/tags
    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('create', TenantTag::class);

        $limit = $this->entitlements->limit($tenant, 'master.tags.max');
        if ($limit !== null && $limit !== -1) {
            $current = TenantTag::query()
                ->where('tenant_id', $tenant->id)
                ->whereNull('deleted_at')
                ->count();

            if ($current >= $limit) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'PLAN_QUOTA_EXCEEDED',
                    'limit_key' => 'master.tags.max',
                    'message' => "Batas {$limit} tag tercapai. Upgrade plan untuk menambah tag.",
                ], 422);
            }
        }

        $data = $request->validate([
            'name'  => [
                'required',
                'string',
                'max:50',
                Rule::unique('tenant_tags')
                    ->where(fn ($q) => $q->where('tenant_id', $tenant->id)->whereNull('deleted_at')),
            ],
            'color' => ['nullable', 'string', 'max:30'],
        ]);

        $tag = TenantTag::create([
            'tenant_id'   => $tenant->id,
            'name'        => $data['name'],
            'color'       => $data['color'] ?? $this->generateColor($data['name']),
            'usage_count' => 0,
            'row_version' => 1,
        ]);

        return response()->json(['ok' => true, 'data' => ['tag' => $tag]], 201);
    }

    // PATCH /master/tags/{tag}
    public function update(Request $request, Tenant $tenant, TenantTag $tag): JsonResponse
    {
        $this->authorize('update', $tag);
        abort_if((int) $tag->tenant_id !== (int) $tenant->id, 404);

        $data = $request->validate([
            'name'        => [
                'required',
                'string',
                'max:50',
                Rule::unique('tenant_tags')
                    ->ignore($tag->id)
                    ->where(fn ($q) => $q->where('tenant_id', $tenant->id)->whereNull('deleted_at')),
            ],
            'color'       => ['nullable', 'string', 'max:30'],
            'row_version' => ['required', 'integer'],
        ]);

        if ((int) $tag->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok'         => false,
                'error_code' => 'VERSION_CONFLICT',
                'message'    => 'Tag diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        $tag->update([
            'name'        => $data['name'],
            'color'       => $data['color'] ?? $tag->color,
            'row_version' => $tag->row_version + 1,
        ]);

        return response()->json(['ok' => true, 'data' => ['tag' => $tag->fresh()]]);
    }

    public function destroy(Request $request, Tenant $tenant, TenantTag $tag): JsonResponse
    {
        $this->authorize('delete', $tag);
        abort_if((int) $tag->tenant_id !== (int) $tenant->id, 404);

        $isUsed = \Illuminate\Support\Facades\DB::table('tenant_taggables')->where('tenant_tag_id', $tag->id)->exists();
        if ($isUsed) {
            return response()->json([
                'ok' => false,
                'error_code' => 'TAG_IN_USE',
                'message' => 'Tag tidak dapat dihapus karena masih digunakan pada transaksi atau entitas lain.',
            ], 422);
        }

        $tag->delete();

        return response()->json(['ok' => true]);
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private function generateColor(string $name): string
    {
        $colors = [
            '#3498DB', '#2ECC71', '#E74C3C', '#F39C12', '#9B59B6',
            '#1ABC9C', '#E67E22', '#2980B9', '#27AE60', '#8E44AD',
        ];
        return $colors[abs(crc32($name)) % count($colors)];
    }
}
