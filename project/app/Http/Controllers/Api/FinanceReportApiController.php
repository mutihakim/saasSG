<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\Finance\FinanceReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceReportApiController extends Controller
{
    public function __construct(
        private readonly FinanceReportService $reports,
    ) {}

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $member = $request->attributes->get('currentTenantMember');
        abort_unless($request->user()?->hasPermissionTo('finance.view'), 403);

        $data = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'group_by' => ['nullable', 'in:day,week,month'],
            'account_id' => ['nullable', 'string', 'size:26'],
            'budget_id' => ['nullable', 'string', 'size:26'],
            'category_id' => ['nullable', 'integer'],
            'owner_member_id' => ['nullable', 'integer'],
        ]);

        return response()->json([
            'ok' => true,
            'data' => $this->reports->getReport($tenant, $member, $data),
        ]);
    }
}
