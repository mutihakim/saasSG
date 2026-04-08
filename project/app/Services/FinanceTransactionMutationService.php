<?php

namespace App\Services;

use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantAttachment;
use App\Models\TenantMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use App\Services\MonthlyReviewService;

class FinanceTransactionMutationService
{
    public function __construct(
        private readonly FinanceSummaryService $summary,
        private readonly FinanceTransactionCleanupService $cleanup,
        private readonly FinanceTransactionStoreService $stores,
        private readonly FinanceTransactionUpdateService $updates,
        private readonly FinanceTransactionAttachmentMutationService $attachments,
        private readonly MonthlyReviewService $monthlyReview,
    ) {
    }

    public function store(\App\Http\Requests\StoreFinanceTransactionRequest $request, Tenant $tenant): JsonResponse
    {
        return $this->stores->store($request, $tenant);
    }

    public function update(\App\Http\Requests\UpdateFinanceTransactionRequest $request, Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        return $this->updates->update($request, $tenant, $transaction);
    }

    public function destroy(Request $request, Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');
        $month = date('Y-m', strtotime((string) $transaction->transaction_date));

        if ($this->monthlyReview->isMonthClosed($tenant, $month)) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_CLOSED',
                'message' => "Bulan {$month} sudah tutup buku dan tidak dapat dihapus lagi.",
            ], 422);
        }

        if ($this->monthlyReview->isPlanningBlockedForPeriod($tenant, $month)) {
            return response()->json([
                'ok' => false,
                'error_code' => 'MONTHLY_REVIEW_REQUIRED',
                'message' => 'Transaksi tidak dapat dihapus karena ' . $this->monthlyReview->planningBlockedMessage($tenant),
            ], 422);
        }

        DB::transaction(function () use ($tenant, $transaction, $member, $request) {
            $transactions = collect([$transaction]);

            if ($transaction->is_internal_transfer && $transaction->transfer_pair_id) {
                $pair = FinanceTransaction::query()
                    ->forTenant($tenant->id)
                    ->find($transaction->transfer_pair_id);

                if ($pair) {
                    $transactions->push($pair);
                }
            }

            $this->cleanup->deleteTransactions($tenant, $transactions->unique('id')->values(), $member, $request, true);
        });

        $this->summary->invalidate($tenant->id, $month);

        return response()->json(['ok' => true]);
    }

    public function destroyGroup(Request $request, Tenant $tenant, Collection $transactions): JsonResponse
    {
        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');

        $months = $transactions
            ->map(fn (FinanceTransaction $transaction) => date('Y-m', strtotime((string) $transaction->transaction_date)))
            ->unique()
            ->values();

        foreach ($months as $month) {
            if ($this->monthlyReview->isMonthClosed($tenant, $month)) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'MONTHLY_REVIEW_CLOSED',
                    'message' => "Sebagian data berada di bulan {$month} yang sudah tutup buku dan tidak dapat dihapus lagi.",
                ], 422);
            }

            if ($this->monthlyReview->isPlanningBlockedForPeriod($tenant, $month)) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'MONTHLY_REVIEW_REQUIRED',
                    'message' => 'Grup transaksi tidak dapat dihapus karena ' . $this->monthlyReview->planningBlockedMessage($tenant),
                ], 422);
            }
        }

        DB::transaction(function () use ($tenant, $transactions, $member, $request) {
            $this->cleanup->deleteTransactions($tenant, $transactions, $member, $request, false);
        });

        foreach ($months as $month) {
            $this->summary->invalidate($tenant->id, $month);
        }

        return response()->json([
            'ok' => true,
            'deleted' => $transactions->count(),
            'source_id' => (string) $transactions->first()?->source_id,
        ]);
    }

    public function bulkDestroy(Request $request, Tenant $tenant, Collection $affected): JsonResponse
    {
        $months = $affected
            ->map(fn (FinanceTransaction $transaction) => date('Y-m', strtotime((string) $transaction->transaction_date)))
            ->unique();

        foreach ($months as $month) {
            if ($this->monthlyReview->isPlanningBlockedForPeriod($tenant, $month)) {
                return response()->json([
                    'ok' => false,
                    'error_code' => 'MONTHLY_REVIEW_REQUIRED',
                    'message' => 'Beberapa transaksi tidak dapat dihapus karena ' . $this->monthlyReview->planningBlockedMessage($tenant),
                ], 422);
            }
        }

        DB::transaction(function () use ($tenant, $affected, $request) {
            $this->cleanup->deleteTransactions($tenant, $affected, null, $request, false);
        });

        foreach ($months as $month) {
            $this->summary->invalidate($tenant->id, $month);
        }

        return response()->json(['ok' => true, 'deleted' => $affected->count()]);
    }

    public function uploadAttachments(Request $request, Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        return $this->attachments->uploadAttachments($request, $tenant, $transaction);
    }

    public function destroyAttachment(TenantAttachment $attachment): JsonResponse
    {
        return $this->attachments->destroyAttachment($attachment);
    }
}
