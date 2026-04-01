<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantHomeController extends Controller
{
    /**
     * Display the tenant home page (Family Profile).
     */
    public function index(Request $request): Response
    {
        $tenant = tenant();

        return Inertia::render('Tenant/Home', [
            'tenantName' => $tenant->name ?? $tenant->id,
            'membersCount' => $tenant->members()->count(),
            // You can add more data here like family description, etc.
        ]);
    }
}
