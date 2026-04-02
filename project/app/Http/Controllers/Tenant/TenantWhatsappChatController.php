<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TenantWhatsappChatController extends Controller
{
    public function index(Request $request, string $tenant): Response|HttpResponse
    {
        if (!(bool) config('whatsapp.enabled', false)) {
            return $this->forbidden($request, 'WhatsApp module is disabled.');
        }

        if (!$this->canView($request)) {
            return $this->forbidden($request, 'WhatsApp chats access denied.');
        }

        return Inertia::render('Tenant/WhatsApp/Chats');
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private function canView(Request $request): bool
    {
        $user   = $request->user();
        $member = $request->attributes->get('currentTenantMember');

        if ($user?->is_superadmin) return true;
        if ($user && ($user->can('whatsapp.chats.view') || $user->can('whatsapp.chats.update'))) {
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
