<?php

namespace App\Http\Controllers\Api\V1\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFinanceTransactionRequest;
use App\Http\Requests\UpdateFinanceTransactionRequest;
use App\Models\Finance\FinanceTransaction;
use App\Models\Tenant\Tenant;
use App\Models\Misc\TenantAttachment;
use App\Models\Tenant\TenantMember;
use App\Services\Finance\FinanceAccessService;
use App\Services\Finance\FinanceAttachmentService;
use App\Services\Finance\Transactions\FinanceTransactionMutationService;
use App\Services\Finance\Transactions\FinanceTransactionPresenter;
use App\Services\Finance\Transactions\FinanceTransactionQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceTransactionApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly FinanceAttachmentService $attachmentService,
        private readonly FinanceTransactionPresenter $presenter,
        private readonly FinanceTransactionQueryService $queries,
        private readonly FinanceTransactionMutationService $mutations,
    ) {
    }

    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', FinanceTransaction::class);

        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');

        return response()->json([
            'ok' => true,
            'data' => $this->queries->paginatedTransactions($request, $tenant, $member),
        ]);
    }

    public function store(StoreFinanceTransactionRequest $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('create', FinanceTransaction::class);

        return $this->mutations->store($request, $tenant);
    }

    public function show(Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $this->authorize('view', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        return response()->json([
            'ok' => true,
            'data' => [
                'transaction' => $this->presenter->transaction($tenant, $transaction->load($this->presenter->relations())),
            ],
        ]);
    }

    public function update(UpdateFinanceTransactionRequest $request, Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $this->authorize('update', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        return $this->mutations->update($request, $tenant, $transaction);
    }

    public function destroy(Request $request, Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $this->authorize('delete', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        return $this->mutations->destroy($request, $tenant, $transaction);
    }

    public function destroyGroup(Request $request, Tenant $tenant, string $sourceId): JsonResponse
    {
        $this->authorize('delete', new FinanceTransaction());

        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');

        $transactions = $this->queries->visibleQuery($tenant, $member)
            ->with($this->presenter->relations())
            ->where('source_type', 'finance_bulk')
            ->where('source_id', $sourceId)
            ->get();

        if ($transactions->isEmpty()) {
            return response()->json(['ok' => false, 'message' => 'Grup transaksi tidak ditemukan.'], 404);
        }

        return $this->mutations->destroyGroup($request, $tenant, $transactions);
    }

    public function uploadAttachments(Request $request, Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $this->authorize('update', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        return $this->mutations->uploadAttachments($request, $tenant, $transaction);
    }

    public function previewAttachment(Tenant $tenant, FinanceTransaction $transaction, TenantAttachment $attachment): StreamedResponse|JsonResponse
    {
        $this->authorize('view', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        if (! $this->attachmentService->belongsToTransaction($transaction, $attachment)) {
            return response()->json(['ok' => false, 'message' => 'Attachment not found.'], 404);
        }

        if ($this->attachmentService->normalizeAttachmentStatus($attachment) !== 'ready') {
            return response()->json(['ok' => false, 'message' => 'Attachment is still processing.'], 409);
        }

        $resolvedPath = $this->attachmentService->resolveStoragePath($attachment);
        if ($resolvedPath === null) {
            return response()->json(['ok' => false, 'message' => 'Attachment file not found.'], 404);
        }

        $stream = Storage::readStream($resolvedPath);
        if ($stream === false) {
            return response()->json(['ok' => false, 'message' => 'Attachment file not found.'], 404);
        }

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $attachment->mime_type ?: 'application/octet-stream',
            'Content-Length' => (string) max((int) (Storage::size($resolvedPath) ?: $attachment->file_size), 0),
            'Content-Disposition' => 'inline; filename="' . addslashes($attachment->file_name) . '"',
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    public function destroyAttachment(Tenant $tenant, FinanceTransaction $transaction, TenantAttachment $attachment): JsonResponse
    {
        $this->authorize('update', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        if (! $this->attachmentService->belongsToTransaction($transaction, $attachment)) {
            return response()->json(['ok' => false, 'message' => 'Attachment not found.'], 404);
        }

        return $this->mutations->destroyAttachment($attachment);
    }

    public function bulkDestroy(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('delete', new FinanceTransaction());

        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'string'])['ids'];

        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');

        $affected = $this->queries->visibleQuery($tenant, $member)
            ->whereIn('id', $ids)
            ->get();

        return $this->mutations->bulkDestroy($request, $tenant, $affected);
    }

    public function summary(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', FinanceTransaction::class);

        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'in:pemasukan,pengeluaran,transfer'],
            'category_id' => ['nullable', 'integer'],
            'currency_code' => ['nullable', 'string', 'max:10'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'bank_account_id' => ['nullable', 'string', 'size:26'],
            'wallet_id' => ['nullable', 'string', 'size:26'],
            'budget_id' => ['nullable', 'string', 'size:26'],
            'owner_member_id' => ['nullable', 'integer'],
            'month' => ['nullable', 'date_format:Y-m'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'transaction_kind' => ['nullable', 'in:all,external,internal_transfer'],
        ]);

        return response()->json([
            'ok' => true,
            'data' => $this->queries->filteredSummary($tenant, $member, $validated),
        ]);
    }

    public function export(Request $request, Tenant $tenant): StreamedResponse
    {
        $this->authorize('viewAny', FinanceTransaction::class);

        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');

        $month = $request->get('month', now()->format('Y-m'));
        $filename = "transaksi-{$month}-{$tenant->slug}.csv";
        $query = $this->queries->exportQuery($request, $tenant, $member);

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Tanggal', 'Deskripsi', 'Merchant/Toko', 'Kategori',
                'Tipe', 'Jumlah', 'Mata Uang', 'Kurs ke IDR',
                'Jumlah (IDR)', 'Akun', 'Budget', 'Pemilik', 'Metode Pembayaran', 'No. Referensi', 'Catatan', 'Tag',
            ]);

            $query->chunk(500, function ($transactions) use ($handle) {
                foreach ($transactions as $tx) {
                    fputcsv($handle, [
                        date('d/m/Y', strtotime((string) $tx->transaction_date)),
                        $tx->description,
                        $tx->merchant_name ?? '',
                        $tx->category?->name ?? '',
                        $tx->type->label(),
                        number_format((float) $tx->amount, 2, ',', '.'),
                        $tx->currency_code,
                        number_format((float) $tx->exchange_rate, 6, ',', '.'),
                        number_format((float) $tx->amount_base, 0, ',', '.'),
                        $tx->bankAccount?->name ?? '',
                        $tx->budget?->name ?? '',
                        $tx->ownerMember?->full_name ?? '',
                        $tx->payment_method?->label() ?? '',
                        $tx->reference_number ?? '',
                        $tx->notes ?? '',
                        $tx->tags->pluck('name')->join(', '),
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
