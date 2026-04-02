<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TenantInvitationController extends Controller
{
    public function index(Request $request, string $tenant): Response|HttpResponse
    {
        $tenant = $request->attributes->get('currentTenant');

        if (!$this->canView($request)) {
            return $this->forbidden($request, 'Invitations access denied.');
        }

        return Inertia::render('Tenant/Invitations/Index', [
            'roleOptions' => Role::query()
                ->where('tenant_id', $tenant->id)
                ->whereNotIn('name', ['owner', 'tenant_owner'])
                ->orderBy('is_system', 'desc')
                ->orderBy('name')
                ->pluck('name')
                ->values()
                ->all(),
        ]);
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private function canView(Request $request): bool
    {
        $user   = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) return true;
        if ($user && (
            $user->can('team.invitations.view') ||
            $user->can('team.invitations.update') ||
            $user->can('team.invitations.create')
        )) {
            return true;
        }

        return in_array($member?->role_code, ['owner', 'admin', 'tenant_owner', 'tenant_admin'], true);
    }

    private function forbidden(Request $request, string $message): HttpResponse
    {
        return Inertia::render('Tenant/Forbidden', ['message' => $message])
            ->toResponse($request)
            ->setStatusCode(403);
    }
}
