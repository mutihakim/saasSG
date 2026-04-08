<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\Finance\Wallet\WalletSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletSummaryApiController extends Controller
{
    public function __construct(
        private readonly WalletSummaryService $summary,
    ) {
    }

    public function show(Request $request, Tenant $tenant): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'data' => [
                'summary' => $this->summary->build(
                    $tenant,
                    $request->attributes->get('currentTenantMember')
                ),
            ],
        ]);
    }
}
