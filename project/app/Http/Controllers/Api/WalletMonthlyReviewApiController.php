<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\MonthlyReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class WalletMonthlyReviewApiController extends Controller
{
    public function __construct(
        private readonly MonthlyReviewService $reviews,
    ) {
    }

    public function status(Request $request, Tenant $tenant): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'data' => [
                'monthly_review' => $this->reviews->buildStatus(
                    $tenant,
                    $request->attributes->get('currentTenantMember')
                ),
            ],
        ]);
    }

    public function preview(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'period_month' => ['required', 'date_format:Y-m'],
            'budget_method' => ['nullable', 'in:copy_last_month,average_3_months,zero_based'],
        ]);

        try {
            return response()->json([
                'ok' => true,
                'data' => [
                    'preview' => $this->reviews->preview(
                        $tenant,
                        $request->attributes->get('currentTenantMember'),
                        $validated['period_month'],
                        $validated['budget_method'] ?? 'copy_last_month',
                    ),
                ],
            ]);
        } catch (RuntimeException $exception) {
            return response()->json([
                'ok' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    public function autoGenerate(Request $request, Tenant $tenant): JsonResponse
    {
        return $this->preview($request, $tenant);
    }

    public function submit(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'period_month' => ['required', 'date_format:Y-m'],
            'budget_method' => ['required', 'in:copy_last_month,average_3_months,zero_based'],
            'sweep_actions' => ['nullable', 'array'],
            'sweep_actions.*.source_pocket_id' => ['required', 'string', 'size:26'],
            'sweep_actions.*.action' => ['required', 'in:rollover,sweep_to_wallet,sweep_to_goal'],
            'sweep_actions.*.amount' => ['required', 'numeric', 'min:0'],
            'sweep_actions.*.target_pocket_id' => ['nullable', 'string', 'size:26'],
            'sweep_actions.*.goal_id' => ['nullable', 'string', 'size:26'],
            'budget_drafts' => ['nullable', 'array'],
            'budget_drafts.*.budget_key' => ['required', 'string', 'max:120'],
            'budget_drafts.*.name' => ['required', 'string', 'max:100'],
            'budget_drafts.*.scope' => ['required', 'in:private,shared'],
            'budget_drafts.*.owner_member_id' => ['nullable', 'integer'],
            'budget_drafts.*.pocket_id' => ['nullable', 'string', 'size:26'],
            'budget_drafts.*.allocated_amount' => ['required', 'numeric', 'min:0'],
        ]);

        try {
            return response()->json([
                'ok' => true,
                'data' => [
                    'review' => $this->reviews->submit(
                        $tenant,
                        $request->attributes->get('currentTenantMember'),
                        $validated,
                    ),
                ],
            ]);
        } catch (RuntimeException $exception) {
            return response()->json([
                'ok' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }
    }
}
