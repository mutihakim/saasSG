<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TenantWhatsappSettingController extends Controller
{
    public function index(Request $request, string $tenant): Response|HttpResponse
    {
        if (!(bool) config('whatsapp.enabled', false)) {
            return $this->forbidden($request, 'WhatsApp module is disabled.');
        }

        if (!$this->canManage($request)) {
            return $this->forbidden($request, 'WhatsApp settings access denied.');
        }

        return Inertia::render('Tenant/WhatsApp/Settings');
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private function canManage(Request $request): bool
    {
        $user   = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) return true;
        if ($user && ($user->can('whatsapp.settings.view') || $user->can('whatsapp.settings.update'))) {
            return true;
        }

        return in_array($member?->role_code, ['owner', 'tenant_owner'], true);
    }

    private function forbidden(Request $request, string $message): HttpResponse
    {
        return Inertia::render('Tenant/Forbidden', ['message' => $message])
            ->toResponse($request)
            ->setStatusCode(403);
    }
}
