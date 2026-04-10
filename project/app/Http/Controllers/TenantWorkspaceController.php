<?php

namespace App\Http\Controllers;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Services\SubscriptionEntitlements;
use App\Support\SubscriptionEntitlements as SupportSubscriptionEntitlements;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantWorkspaceController extends Controller
{
    public function selector(Request $request)
    {
        $user = $request->user();

        if ($user?->is_superadmin) {
            return redirect('/admin/tenants');
        }

        $membership = TenantMember::query()
            ->where('user_id', $user?->id)
            ->where('profile_status', 'active')
            ->first();

        if ($membership) {
            $tenant = Tenant::find($membership->tenant_id);
            if ($tenant) {
                return redirect()->route('tenant.dashboard', $tenant->slug);
            }
        }

        return redirect()->route('home');
    }

    public function accessRequired(): Response
    {
        return Inertia::render('Tenant/AccessRequired');
    }

    public function upgradeRequired(Request $request, SupportSubscriptionEntitlements $entitlements): Response
    {
        $tenant = $request->attributes->get('currentTenant');
        $module = (string) $request->query('module', '');

        return Inertia::render('Tenant/UpgradeRequired', [
            'module'       => $module,
            'module_label' => $module !== '' ? $entitlements->moduleLabel($module) : 'This module',
            'plan_code'    => $entitlements->normalizePlan($tenant?->plan_code),
        ]);
    }
}
