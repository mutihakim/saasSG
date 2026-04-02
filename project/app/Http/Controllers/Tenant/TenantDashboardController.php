<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\TenantInvitation;
use App\Models\TenantMember;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantDashboardController extends Controller
{
    public function index(Request $request, string $tenant): Response
    {
        $tenant = $request->attributes->get('currentTenant');

        return Inertia::render('Tenant/Dashboard', [
            'stats' => [
                'members_count' => TenantMember::query()
                    ->where('tenant_id', $tenant->id)
                    ->count(),
                'invitations_count' => TenantInvitation::query()
                    ->where('tenant_id', $tenant->id)
                    ->count(),
            ],
        ]);
    }
}
