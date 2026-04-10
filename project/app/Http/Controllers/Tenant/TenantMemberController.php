<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\TenantMember;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TenantMemberController extends Controller
{
    public function index(Request $request, string $tenant): Response|HttpResponse
    {
        $tenant = $request->attributes->get('currentTenant');

        if (!$this->canView($request)) {
            return $this->forbidden($request, 'Members access denied.');
        }

        $members = TenantMember::query()
            ->with(['user:id,email,email_verified_at'])
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->get(['id', 'user_id', 'full_name', 'role_code', 'profile_status', 'onboarding_status', 'whatsapp_jid', 'row_version'])
            ->map(function (TenantMember $member) {
                return [
                    'id'                => $member->id,
                    'user_id'           => $member->user_id,
                    'full_name'         => $member->full_name,
                    'role_code'         => $member->role_code,
                    'profile_status'    => $member->profile_status,
                    'onboarding_status' => $member->onboarding_status,
                    'account_status'    => $member->user_id
                        ? ($member->user?->email_verified_at ? 'verified' : 'unverified')
                        : 'no_account',
                    'user_email'        => $member->user?->email,
                    'whatsapp_jid'      => $member->whatsapp_jid,
                    'row_version'       => $member->row_version,
                ];
            })
            ->values();

        return Inertia::render('Tenant/Members/Index', [
            'members'     => $members,
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

    public function show(Request $request, string $tenant, int $member): Response|HttpResponse
    {
        $tenant = $request->attributes->get('currentTenant');

        if (!$this->canView($request)) {
            return $this->forbidden($request, 'Members access denied.');
        }

        $target = TenantMember::query()
            ->with('user')
            ->where('tenant_id', $tenant->id)
            ->where('id', $member)
            ->firstOrFail();

        return Inertia::render('Tenant/Members/View', [
            'member'  => $this->formatMember($target),
            'canEdit' => $this->canUpdate($request),
        ]);
    }

    public function edit(Request $request, string $tenant, int $member): Response|HttpResponse
    {
        $tenant = $request->attributes->get('currentTenant');

        if (!$this->canUpdate($request)) {
            return $this->forbidden($request, 'You do not have permission to edit member profile.');
        }

        $target = TenantMember::query()
            ->with('user')
            ->where('tenant_id', $tenant->id)
            ->where('id', $member)
            ->firstOrFail();

        return Inertia::render('Tenant/Members/Edit', [
            'member'      => $this->formatMember($target),
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

    private function formatMember(TenantMember $member): array
    {
        return [
            'id'             => $member->id,
            'full_name'      => $member->full_name,
            'role_code'      => $member->role_code,
            'profile_status' => $member->profile_status,
            'whatsapp_jid'   => $member->whatsapp_jid,
            'row_version'    => $member->row_version,
            'user'           => $member->user ? [
                'id'           => $member->user->id,
                'name'         => $member->user->name,
                'email'        => $member->user->email,
                'phone'        => $member->user->phone,
                'job_title'    => $member->user->job_title,
                'bio'          => $member->user->bio,
                'avatar_url'   => $member->user->avatar_url,
                'address_line' => $member->user->address_line,
                'city'         => $member->user->city,
                'country'      => $member->user->country,
                'postal_code'  => $member->user->postal_code,
            ] : null,
        ];
    }

    private function canView(Request $request): bool
    {
        $user   = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) return true;
        if ($user && ($user->can('team.members.view') || $user->can('tenant_members.view'))) return true;

        return in_array($member?->role_code, [
            'owner', 'admin', 'member', 'viewer', 'operator',
            'tenant_owner', 'tenant_admin', 'tenant_member', 'tenant_viewer', 'tenant_operator',
        ], true);
    }

    private function canUpdate(Request $request): bool
    {
        $user   = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) return true;
        if ($user && ($user->can('team.members.update') || $user->can('tenant_members.update'))) return true;

        return in_array($member?->role_code, [
            'owner', 'admin', 'operator', 'tenant_owner', 'tenant_admin', 'tenant_operator',
        ], true);
    }

    private function forbidden(Request $request, string $message): HttpResponse
    {
        return Inertia::render('Tenant/Forbidden', ['message' => $message])
            ->toResponse($request)
            ->setStatusCode(403);
    }
}
