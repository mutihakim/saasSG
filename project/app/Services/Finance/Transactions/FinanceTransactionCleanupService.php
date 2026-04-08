<?php

namespace App\Services\Finance\Transactions;

use App\Models\ActivityLog;
use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantAttachment;
use App\Models\TenantMember;
use App\Services\Finance\FinanceLedgerService;
use App\Services\Finance\TagService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class FinanceTransactionCleanupService
{
    public function __construct(
        private readonly FinanceLedgerService $ledger,
        private readonly FinanceTransactionPresenter $presenter,
        private readonly FinanceTransactionAuditService $audit,
        private readonly TagService $tags,
    ) {
    }

    public function deleteTransactions(
        Tenant $tenant,
        Collection $transactions,
        ?TenantMember $actorMember,
        Request $request,
        bool $writeDeletionActivityLog,
    ): void {
        $transactions
            ->unique('id')
            ->each(function (FinanceTransaction $transaction) use ($tenant, $actorMember, $request, $writeDeletionActivityLog) {
                $beforeModel = $transaction->relationLoaded('attachments')
                    ? $transaction
                    : $transaction->load($this->presenter->relations());

                $before = $this->audit->snapshotTransaction($beforeModel);

                $this->deleteTransactionArtifacts($tenant, $beforeModel);
                $this->ledger->syncAfterDelete($beforeModel);
                $beforeModel->delete();

                if ($writeDeletionActivityLog) {
                    ActivityLog::create($this->audit->makeActivityLogPayload(
                        request: $request,
                        tenantId: $tenant->id,
                        actorMemberId: $actorMember?->id,
                        action: 'finance.transaction.deleted',
                        targetId: (string) $beforeModel->id,
                        before: $before,
                        after: null,
                        beforeVersion: (int) $beforeModel->row_version,
                        afterVersion: null,
                    ));
                }
            });
    }

    public function deleteAttachmentRecord(TenantAttachment $attachment): void
    {
        $filePath = (string) ($attachment->file_path ?? '');
        $attachment->delete();

        if ($filePath === '') {
            return;
        }

        $stillReferenced = TenantAttachment::query()
            ->where('tenant_id', $attachment->tenant_id)
            ->where('file_path', $filePath)
            ->exists();

        if (! $stillReferenced && Storage::exists($filePath)) {
            Storage::delete($filePath);
        }
    }

    private function deleteTransactionArtifacts(Tenant $tenant, FinanceTransaction $transaction): void
    {
        $attachments = $transaction->relationLoaded('attachments')
            ? $transaction->attachments
            : $transaction->attachments()->get();

        foreach ($attachments as $attachment) {
            $this->deleteAttachmentRecord($attachment);
        }

        $this->tags->syncTags($transaction, $tenant->id, []);

        DB::table('activity_logs')
            ->where('tenant_id', $tenant->id)
            ->where('target_type', 'finance_transactions')
            ->where('target_id', (string) $transaction->id)
            ->delete();

        $transaction->recurringRule?->delete();
    }
}
