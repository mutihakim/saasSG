<?php

namespace App\Http\Controllers\Api\V1\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;
use App\Support\ApiResponder;
use App\Support\SubscriptionEntitlements;
use App\Support\TenantBranding;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;

class MobileBootstrapApiController extends Controller
{
    use ApiResponder;

    public function show(Request $request, SubscriptionEntitlements $entitlements)
    {
        /** @var User $user */
        $user = $request->user();
        $tenantKey = trim((string) $request->query('tenant', ''));

        if ($tenantKey === '') {
            return $this->error('VALIDATION_ERROR', 'Tenant is required.', [
                'field' => 'tenant',
            ], 422);
        }

        /** @var Tenant|null $tenant */
        $tenantQuery = Tenant::query()->where('slug', $tenantKey);
        if (ctype_digit($tenantKey)) {
            $tenantQuery->orWhere('id', (int) $tenantKey);
        }
        $tenant = $tenantQuery->first();

        if (! $tenant) {
            return $this->error('NOT_FOUND', 'Tenant not found.', [], 404);
        }

        if ($tenant->status !== 'active' && ! $user->is_superadmin) {
            return $this->error('NOT_FOUND', 'Tenant not found.', [], 404);
        }

        $member = TenantMember::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('profile_status', 'active')
            ->whereNull('deleted_at')
            ->first();

        if (! $member && ! $user->is_superadmin) {
            return $this->error('NOT_FOUND', 'Tenant not found.', [], 404);
        }

        if (! $member && $user->is_superadmin) {
            $member = new TenantMember([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'full_name' => $user->name,
                'role_code' => 'owner',
                'profile_status' => 'active',
                'row_version' => 1,
            ]);
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);

        $moduleMap = $entitlements->moduleMapForTenant($tenant);

        return $this->ok([
            'tenant' => [
                'id' => $tenant->id,
                'slug' => $tenant->slug,
                'name' => $tenant->presentableName(),
                'status' => $tenant->status,
                'locale' => $tenant->locale,
                'timezone' => $tenant->timezone,
                'currency_code' => $tenant->currency_code,
                'plan_code' => $entitlements->normalizePlan($tenant->plan_code),
                'branding' => TenantBranding::resolved($tenant),
            ],
            'member' => [
                'id' => $member->id,
                'full_name' => $member->full_name,
                'role_code' => $member->role_code,
                'profile_status' => $member->profile_status,
            ],
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                    'is_superadmin' => (bool) $user->is_superadmin,
                ],
                'roles' => $user->getRoleNames()->values()->all(),
                'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
            ],
            'entitlements' => [
                'modules' => $moduleMap,
            ],
            'subscription' => [
                'plan' => [
                    'code' => $entitlements->normalizePlan($tenant->plan_code),
                    'limits' => $entitlements->limitsForTenant($tenant),
                ],
            ],
            'mobile' => [
                'recommended_modules' => array_values(array_filter([
                    $moduleMap['finance'] ?? false ? 'finance' : null,
                    $moduleMap['whatsapp.chats'] ?? false ? 'whatsapp' : null,
                ])),
            ],
        ]);
    }
}
