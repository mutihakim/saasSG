<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFinanceTransactionRequest;
use App\Http\Requests\UpdateFinanceTransactionRequest;
use App\Models\ActivityLog;
use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantAttachment;
use App\Models\TenantBankAccount;
use App\Models\TenantBudget;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Models\TenantRecurringRule;
use App\Services\FinanceAccessService;
use App\Services\FinanceAttachmentService;
use App\Services\FinanceLedgerService;
use App\Services\FinanceSummaryService;
use App\Services\FinanceTransactionPresenter;
use App\Services\TagService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceTransactionApiController extends Controller
{
    public function __construct(
        private readonly FinanceSummaryService $summary,
        private readonly TagService $tags,
        private readonly SubscriptionEntitlements $entitlements,
        private readonly FinanceAccessService $access,
        private readonly FinanceLedgerService $ledger,
        private readonly FinanceAttachmentService $attachmentService,
        private readonly FinanceTransactionPresenter $presenter,
    ) {}

    // ─── GET /finance/transactions ───────────────────────────────────────────
    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', FinanceTransaction::class);

        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');

        $query = $this->access->visibleTransactionsQuery($tenant, $member)
            ->with($this->presenter->relations())
            ->tap(fn (Builder $builder) => $this->applyTransactionFilters($builder, $request));

        $sortField = in_array($request->sort, ['transaction_date', 'amount_base', 'created_at'])
            ? $request->sort
            : 'transaction_date';
        $direction = $request->direction === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortField, $direction);
        if ($sortField !== 'created_at') {
            $query->orderBy('created_at', $direction);
        }
        if ($sortField !== 'id') {
            $query->orderBy('id', $direction);
        }

        $perPage   = max(1, min((int) ($request->per_page ?? 15), 100));
        $paginator = $query->paginate($perPage);

        return response()->json([
            'ok'   => true,
            'data' => [
                'transactions' => collect($paginator->items())
                    ->map(fn (FinanceTransaction $transaction) => $this->presenter->transaction($tenant, $transaction))
                    ->values(),
                'meta'         => [
                    'current_page' => $paginator->currentPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                    'last_page'    => $paginator->lastPage(),
                    'has_more'     => $paginator->hasMorePages(),
                ],
            ],
        ]);
    }

    // ─── POST /finance/transactions ──────────────────────────────────────────
    public function store(StoreFinanceTransactionRequest $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('create', FinanceTransaction::class);

        // Quota check
        $limit = $this->entitlements->limit($tenant, 'finance.monthly_tx.max');
        if ($limit === null) $limit = -1;
        if ($limit !== -1) {
            $monthlyCount = FinanceTransaction::query()
                ->forTenant($tenant->id)
                ->whereYear('transaction_date', now()->year)
                ->whereMonth('transaction_date', now()->month)
                ->count();

            if ($monthlyCount >= $limit) {
                return response()->json([
                    'ok'         => false,
                    'error_code' => 'PLAN_QUOTA_EXCEEDED',
                    'message'    => "Batas {$limit} transaksi/bulan tercapai. Upgrade plan untuk lebih banyak.",
                ], 422);
            }
        }

        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');

        if (!$member) {
            return response()->json(['ok' => false, 'message' => 'Profil anggota tidak ditemukan.'], 403);
        }

        $data        = $request->validated();
        $isRecurring = (bool) ($data['is_recurring'] ?? false);

        if (($data['type'] ?? null) === 'transfer') {
            return $this->storeTransfer($request, $tenant, $member, $data, $isRecurring);
        }

        // Resolve currency_id from currency_code
        $currency = $this->resolveCurrency($tenant, $data['currency_code']);

        if (!$currency) {
            return response()->json(['ok' => false, 'message' => 'Mata uang tidak ditemukan.'], 422);
        }

        $ownerMember = $this->access->resolveTransactionOwner($member, $tenant, $data['owner_member_id'] ?? null);
        $account = $this->resolveUsableAccount($tenant, $member, $data['bank_account_id'] ?? null);
        $budget = $this->resolveUsableBudget($tenant, $member, $data['budget_id'] ?? null);

        if (! $account) {
            return response()->json(['ok' => false, 'message' => 'Akun transaksi tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        if (($data['budget_id'] ?? null) && ! $budget) {
            return response()->json(['ok' => false, 'message' => 'Budget tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        if ($account->currency_code !== $data['currency_code']) {
            return response()->json(['ok' => false, 'message' => 'Mata uang transaksi harus sama dengan mata uang akun.'], 422);
        }

        [$budgetStatus, $budgetDelta] = $this->resolveBudgetStatus($data['type'], $budget, (float) $data['amount'] * (float) ($data['exchange_rate'] ?? 1));

        try {
            $transaction = DB::transaction(function () use ($request, $tenant, $member, $ownerMember, $account, $budget, $data, $currency, $isRecurring, $budgetStatus, $budgetDelta) {
                $transaction = FinanceTransaction::create($this->transactionPayload(
                    tenant: $tenant,
                    actorMemberId: $member->id,
                    ownerMemberId: $ownerMember?->id,
                    data: array_merge($data, [
                        'bank_account_id' => $account?->id,
                        'budget_id' => $budget?->id,
                        'budget_status' => $budgetStatus,
                        'budget_delta' => $budgetDelta,
                    ]),
                    currency: $currency,
                    rowVersion: 1,
                ));

                $this->tags->syncTags($transaction, $tenant->id, $data['tags'] ?? []);
                $this->syncRecurringRule($transaction, $tenant->id, $data, $isRecurring);
                $this->ledger->syncAfterCreate($transaction);

                $fresh = $transaction->fresh($this->presenter->relations());

                ActivityLog::create($this->makeActivityLogPayload(
                    request: $request,
                    tenantId: $tenant->id,
                    actorMemberId: $member->id,
                    action: 'finance.transaction.created',
                    targetId: $transaction->id,
                    before: null,
                    after: $this->snapshotTransaction($fresh),
                    beforeVersion: null,
                    afterVersion: 1,
                ));

                return $fresh;
            });

            // Invalidate summary cache
            $month = date('Y-m', strtotime($data['transaction_date']));
            $this->summary->invalidate($tenant->id, $month);

            return response()->json([
                'ok'   => true,
                'data' => ['transaction' => $this->presenter->transaction($tenant, $transaction)],
            ], 201);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['ok' => false, 'message' => 'Gagal menyimpan transaksi.'], 500);
        }
    }

    // ─── GET /finance/transactions/{id} ─────────────────────────────────────
    public function show(Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $this->authorize('view', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        return response()->json([
            'ok'   => true,
            'data' => ['transaction' => $this->presenter->transaction($tenant, $transaction->load($this->presenter->relations()))],
        ]);
    }

    // ─── PATCH /finance/transactions/{id} ───────────────────────────────────
    public function update(UpdateFinanceTransactionRequest $request, Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $this->authorize('update', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        $data = $request->validated();
        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');

        if (($transaction->type?->value ?? $transaction->type) === 'transfer' || ($data['type'] ?? null) === 'transfer') {
            return response()->json([
                'ok' => false,
                'error_code' => 'TRANSFER_UPDATE_NOT_SUPPORTED',
                'message' => 'Transfer internal harus dihapus dan dibuat ulang agar saldo tetap konsisten.',
            ], 422);
        }

        // OCC check
        if ((int) $transaction->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok'         => false,
                'error_code' => 'VERSION_CONFLICT',
                'message'    => 'Transaksi diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        // Resolve currency_id from currency_code
        $currency = $this->resolveCurrency($tenant, $data['currency_code']);

        if (!$currency) {
            return response()->json(['ok' => false, 'message' => 'Mata uang tidak ditemukan.'], 422);
        }

        $ownerMember = $this->access->resolveTransactionOwner($member, $tenant, $data['owner_member_id'] ?? null);
        $account = $this->resolveUsableAccount($tenant, $member, $data['bank_account_id'] ?? null);
        $budget = $this->resolveUsableBudget($tenant, $member, $data['budget_id'] ?? null);

        if (! $account) {
            return response()->json(['ok' => false, 'message' => 'Akun transaksi tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        if (($data['budget_id'] ?? null) && ! $budget) {
            return response()->json(['ok' => false, 'message' => 'Budget tidak ditemukan atau tidak bisa diakses.'], 422);
        }

        if ($account->currency_code !== $data['currency_code']) {
            return response()->json(['ok' => false, 'message' => 'Mata uang transaksi harus sama dengan mata uang akun.'], 422);
        }

        [$budgetStatus, $budgetDelta] = $this->resolveBudgetStatus($data['type'], $budget, (float) $data['amount'] * (float) ($data['exchange_rate'] ?? 1));
        $isRecurring = (bool) ($data['is_recurring'] ?? false);
        $oldMonth    = date('Y-m', strtotime((string) $transaction->transaction_date));
        $newMonth    = date('Y-m', strtotime($data['transaction_date']));

        try {
            $beforeModel = $transaction->fresh(['tags', 'recurringRule', 'bankAccount', 'budget', 'ownerMember']);
            $before = $this->snapshotTransaction($beforeModel);

            $updated = DB::transaction(function () use ($request, $tenant, $member, $ownerMember, $account, $budget, $data, $currency, $isRecurring, $transaction, $beforeModel, $before, $budgetStatus, $budgetDelta) {
                $nextVersion = $transaction->row_version + 1;

                $transaction->update($this->transactionPayload(
                    tenant: $tenant,
                    actorMemberId: $member?->id,
                    ownerMemberId: $ownerMember?->id,
                    data: array_merge($data, [
                        'bank_account_id' => $account?->id,
                        'budget_id' => $budget?->id,
                        'budget_status' => $budgetStatus,
                        'budget_delta' => $budgetDelta,
                    ]),
                    currency: $currency,
                    rowVersion: $nextVersion,
                    isUpdate: true,
                ));

                $this->tags->syncTags($transaction, $tenant->id, $data['tags'] ?? []);
                $this->syncRecurringRule($transaction, $tenant->id, $data, $isRecurring);
                $this->ledger->syncAfterUpdate($beforeModel, $transaction->fresh());

                $fresh = $transaction->fresh($this->presenter->relations());

                ActivityLog::create($this->makeActivityLogPayload(
                    request: $request,
                    tenantId: $tenant->id,
                    actorMemberId: $member?->id,
                    action: 'finance.transaction.updated',
                    targetId: $transaction->id,
                    before: $before,
                    after: $this->snapshotTransaction($fresh),
                    beforeVersion: (int) $before['row_version'],
                    afterVersion: $nextVersion,
                ));

                return $fresh;
            });

            $this->summary->invalidate($tenant->id, $oldMonth);
            if ($newMonth !== $oldMonth) {
                $this->summary->invalidate($tenant->id, $newMonth);
            }

            return response()->json([
                'ok'   => true,
                'data' => ['transaction' => $this->presenter->transaction($tenant, $updated)],
            ]);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['ok' => false, 'message' => 'Gagal memperbarui transaksi.'], 500);
        }
    }

    // ─── DELETE /finance/transactions/{id} ──────────────────────────────────
    public function destroy(Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $this->authorize('delete', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        /** @var TenantMember|null $member */
        $member = request()->attributes->get('currentTenantMember');
        $month = date('Y-m', strtotime((string) $transaction->transaction_date));

        DB::transaction(function () use ($tenant, $transaction, $member) {
            $transactions = collect([$transaction]);

            if ($transaction->is_internal_transfer && $transaction->transfer_pair_id) {
                $pair = FinanceTransaction::query()
                    ->forTenant($tenant->id)
                    ->find($transaction->transfer_pair_id);

                if ($pair) {
                    $transactions->push($pair);
                }
            }

            $this->deleteTransactions(
                tenant: $tenant,
                transactions: $transactions->unique('id')->values(),
                actorMember: $member,
                request: request(),
                writeDeletionActivityLog: true,
            );
        });

        $this->summary->invalidate($tenant->id, $month);

        return response()->json(['ok' => true]);
    }

    public function destroyGroup(Request $request, Tenant $tenant, string $sourceId): JsonResponse
    {
        $this->authorize('delete', new FinanceTransaction());

        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');

        $transactions = $this->access->visibleTransactionsQuery($tenant, $member)
            ->with($this->presenter->relations())
            ->where('source_type', 'finance_bulk')
            ->where('source_id', $sourceId)
            ->get();

        if ($transactions->isEmpty()) {
            return response()->json(['ok' => false, 'message' => 'Grup transaksi tidak ditemukan.'], 404);
        }

        $months = $transactions
            ->map(fn (FinanceTransaction $transaction) => date('Y-m', strtotime((string) $transaction->transaction_date)))
            ->unique()
            ->values();

        DB::transaction(function () use ($tenant, $transactions, $member, $request) {
            $this->deleteTransactions(
                tenant: $tenant,
                transactions: $transactions,
                actorMember: $member,
                request: $request,
                writeDeletionActivityLog: false,
            );
        });

        foreach ($months as $month) {
            $this->summary->invalidate($tenant->id, $month);
        }

        return response()->json([
            'ok' => true,
            'deleted' => $transactions->count(),
            'source_id' => $sourceId,
        ]);
    }

    public function uploadAttachments(Request $request, Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $this->authorize('update', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        $payload = $request->validate([
            'attachments' => ['required', 'array', 'min:1', 'max:10'],
            'attachments.*' => ['file', 'max:5120', 'mimetypes:image/jpeg,image/png,image/webp,application/pdf'],
        ]);

        $existingSortOrder = (int) $transaction->attachments()->max('sort_order');
        $created = [];

        foreach ($payload['attachments'] as $index => $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            $stored = $this->attachmentService->storeUploadedFile($transaction, $file);
            $created[] = $transaction->attachments()->create([
                'tenant_id' => $tenant->id,
                'file_name' => $stored['file_name'],
                'file_path' => $stored['path'],
                'mime_type' => $stored['mime_type'],
                'file_size' => $stored['file_size'],
                'label' => null,
                'sort_order' => $existingSortOrder + $index + 1,
                'row_version' => 1,
            ]);
        }

        return response()->json([
            'ok' => true,
            'data' => [
                'attachments' => collect($created)->map(fn (TenantAttachment $attachment) => $this->attachmentService->payload($tenant, $transaction, $attachment))->values(),
            ],
        ], 201);
    }

    public function previewAttachment(Tenant $tenant, FinanceTransaction $transaction, TenantAttachment $attachment): StreamedResponse|JsonResponse
    {
        $this->authorize('view', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        if (!$this->attachmentService->belongsToTransaction($transaction, $attachment)) {
            return response()->json(['ok' => false, 'message' => 'Attachment not found.'], 404);
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

        if (!$this->attachmentService->belongsToTransaction($transaction, $attachment)) {
            return response()->json(['ok' => false, 'message' => 'Attachment not found.'], 404);
        }

        $this->deleteAttachmentRecord($attachment);

        return response()->json(['ok' => true]);
    }

    // ─── DELETE /finance/transactions (bulk) ─────────────────────────────────
    public function bulkDestroy(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('delete', new FinanceTransaction());

        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'string'])['ids'];

        $member = $request->attributes->get('currentTenantMember');

        $affected = $this->access->visibleTransactionsQuery($tenant, $member)
            ->whereIn('id', $ids)
            ->get();

        $months = $affected->map(fn ($t) => date('Y-m', strtotime((string) $t->transaction_date)))->unique();

        DB::transaction(function () use ($tenant, $affected) {
            $this->deleteTransactions(
                tenant: $tenant,
                transactions: $affected,
                actorMember: null,
                request: request(),
                writeDeletionActivityLog: false,
            );
        });

        foreach ($months as $month) {
            $this->summary->invalidate($tenant->id, $month);
        }

        return response()->json(['ok' => true, 'deleted' => $affected->count()]);
    }

    // ─── GET /finance/summary ─────────────────────────────────────────────────
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
            'budget_id' => ['nullable', 'string', 'size:26'],
            'owner_member_id' => ['nullable', 'integer'],
            'month' => ['nullable', 'date_format:Y-m'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'transaction_kind' => ['nullable', 'in:all,external,internal_transfer'],
        ]);

        $query = $this->access->visibleTransactionsQuery($tenant, $member);
        $filterRequest = new Request($validated);
        $this->applyTransactionFilters($query, $filterRequest);

        $excludeInternalTransfers = ! ($validated['owner_member_id'] ?? null)
            && $this->access->isPrivileged($member)
            && (($validated['transaction_kind'] ?? 'all') !== 'internal_transfer');

        return response()->json([
            'ok'   => true,
            'data' => $this->summary->getFilteredSummary($query, $tenant, [
                'exclude_internal_transfers' => $excludeInternalTransfers,
            ]),
        ]);
    }

    // ─── GET /finance/transactions/export ────────────────────────────────────
    public function export(Request $request, Tenant $tenant): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('viewAny', FinanceTransaction::class);

        $member = $request->attributes->get('currentTenantMember');

        $month    = $request->get('month', now()->format('Y-m'));
        $filename = "transaksi-{$month}-{$tenant->slug}.csv";

        $query = $this->access->visibleTransactionsQuery($tenant, $member)
            ->with(['category:id,name', 'currency:code,symbol', 'bankAccount:id,name', 'budget:id,name', 'ownerMember:id,full_name'])
            ->tap(fn (Builder $builder) => $this->applyTransactionFilters($builder, $request))
            ->orderBy('transaction_date', 'desc');

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');

            // BOM for Excel UTF-8
            fputs($handle, "\xEF\xBB\xBF");

            // Header row
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
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function resolveCurrency(Tenant $tenant, string $currencyCode): ?TenantCurrency
    {
        return TenantCurrency::query()
            ->where('tenant_id', $tenant->id)
            ->where('code', $currencyCode)
            ->first();
    }

    private function applyTransactionFilters(Builder $query, Request $request): Builder
    {
        return $query
            ->when($request->search, fn ($q) => $q->search($request->search))
            ->when($request->type, fn ($q) => $q->byType($request->type))
            ->when($request->category_id, fn ($q) => $q->byCategory((int) $request->category_id))
            ->when($request->currency_code, fn ($q) => $q->byCurrency($request->currency_code))
            ->when($request->payment_method, fn ($q) => $q->where('payment_method', $request->payment_method))
            ->when($request->bank_account_id, fn ($q) => $q->where('bank_account_id', $request->bank_account_id))
            ->when($request->budget_id, fn ($q) => $q->where('budget_id', $request->budget_id))
            ->when($request->owner_member_id, fn ($q) => $q->where('owner_member_id', $request->owner_member_id))
            ->when($request->transaction_kind === 'external', fn ($q) => $q->where('type', '!=', 'transfer'))
            ->when($request->transaction_kind === 'internal_transfer', fn ($q) => $q->where(function (Builder $internal) {
                $internal
                    ->where('type', 'transfer')
                    ->orWhere('is_internal_transfer', true);
            }))
            ->when($request->month, fn ($q) => $q->forMonth($request->month))
            ->when(! $request->month, fn ($q) => $q->byDateRange($request->date_from, $request->date_to));
    }

    private function transactionPayload(
        Tenant $tenant,
        ?int $actorMemberId,
        ?int $ownerMemberId,
        array $data,
        TenantCurrency $currency,
        int $rowVersion,
        bool $isUpdate = false,
    ): array {
        $baseCurrency = $tenant->currency_code ?? 'IDR';
        $exchangeRate = (float) ($data['exchange_rate'] ?? 1.0);

        if ($data['currency_code'] === $baseCurrency) {
            $exchangeRate = 1.0;
        }

        $payload = [
            'tenant_id' => $tenant->id,
            'category_id' => $data['category_id'] ?? null,
            'currency_id' => $currency->id,
            'base_currency_code' => $baseCurrency,
            'type' => $data['type'],
            'transaction_date' => $data['transaction_date'],
            'amount' => $data['amount'],
            'exchange_rate' => $exchangeRate,
            'description' => $data['description'],
            'payment_method' => $data['payment_method'] ?? null,
            'notes' => $data['notes'] ?? null,
            'reference_number' => $data['reference_number'] ?? null,
            'merchant_name' => $data['merchant_name'] ?? null,
            'location' => $data['location'] ?? null,
            'source_type' => $data['source_type'] ?? null,
            'source_id' => $data['source_id'] ?? null,
            'budget_id' => $data['budget_id'] ?? null,
            'budget_status' => $data['budget_status'] ?? 'unbudgeted',
            'budget_delta' => $data['budget_delta'] ?? 0,
            'bank_account_id' => $data['bank_account_id'] ?? null,
            'is_internal_transfer' => (bool) ($data['is_internal_transfer'] ?? $data['type'] === 'transfer'),
            'transfer_direction' => $data['transfer_direction'] ?? null,
            'transfer_pair_id' => $data['transfer_pair_id'] ?? null,
            'row_version' => $rowVersion,
        ];

        if ($isUpdate) {
            $payload['updated_by'] = $actorMemberId;
        } else {
            $payload['created_by'] = $actorMemberId;
        }

        $payload['owner_member_id'] = $ownerMemberId ?? $actorMemberId;

        return $payload;
    }

    private function syncRecurringRule(FinanceTransaction $transaction, int $tenantId, array $data, bool $isRecurring): void
    {
        if ($isRecurring && ! empty($data['recurring_freq'])) {
            TenantRecurringRule::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'ruleable_type' => FinanceTransaction::class,
                    'ruleable_id' => $transaction->id,
                ],
                [
                    'frequency' => $data['recurring_freq'],
                    'interval' => 1,
                    'start_date' => $data['transaction_date'],
                    'end_date' => $data['recurring_end_date'] ?? null,
                    'next_run_at' => $data['transaction_date'],
                    'is_active' => true,
                    'row_version' => 1,
                ]
            );

            return;
        }

        $transaction->recurringRule?->delete();
    }

    private function snapshotTransaction(FinanceTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'type' => $transaction->type?->value ?? $transaction->type,
            'transaction_date' => optional($transaction->transaction_date)->toDateString(),
            'amount' => (string) $transaction->amount,
            'amount_base' => (string) $transaction->amount_base,
            'description' => $transaction->description,
            'category_id' => $transaction->category_id,
            'currency_id' => $transaction->currency_id,
            'owner_member_id' => $transaction->owner_member_id,
            'payment_method' => $transaction->payment_method?->value ?? $transaction->payment_method,
            'merchant_name' => $transaction->merchant_name,
            'location' => $transaction->location,
            'notes' => $transaction->notes,
            'reference_number' => $transaction->reference_number,
            'source_type' => $transaction->source_type,
            'source_id' => $transaction->source_id,
            'budget_id' => $transaction->budget_id,
            'budget_status' => $transaction->budget_status,
            'budget_delta' => (string) $transaction->budget_delta,
            'bank_account_id' => $transaction->bank_account_id,
            'is_internal_transfer' => (bool) $transaction->is_internal_transfer,
            'transfer_direction' => $transaction->transfer_direction,
            'transfer_pair_id' => $transaction->transfer_pair_id,
            'row_version' => $transaction->row_version,
            'tags' => $transaction->relationLoaded('tags') ? $transaction->tags->pluck('name')->values()->all() : [],
            'recurring_rule' => $transaction->relationLoaded('recurringRule') && $transaction->recurringRule
                ? Arr::only($transaction->recurringRule->toArray(), ['frequency', 'interval', 'start_date', 'end_date', 'next_run_at', 'is_active'])
                : null,
        ];
    }

    private function makeActivityLogPayload(
        Request $request,
        int $tenantId,
        ?int $actorMemberId,
        string $action,
        string $targetId,
        ?array $before,
        ?array $after,
        ?int $beforeVersion,
        ?int $afterVersion,
    ): array {
        return [
            'tenant_id' => $tenantId,
            'actor_user_id' => $request->user()?->id,
            'actor_member_id' => $actorMemberId,
            'action' => $action,
            'target_type' => 'finance_transactions',
            'target_id' => $targetId,
            'changes' => array_filter([
                'before' => $before,
                'after' => $after,
            ], fn ($value) => $value !== null),
            'metadata' => [
                'channel' => 'api',
                'tags' => $after['tags'] ?? $before['tags'] ?? [],
                'has_recurring_rule' => ($after['recurring_rule'] ?? $before['recurring_rule'] ?? null) !== null,
                'is_internal_transfer' => $after['is_internal_transfer'] ?? $before['is_internal_transfer'] ?? false,
                'transfer_direction' => $after['transfer_direction'] ?? $before['transfer_direction'] ?? null,
                'source_type' => $after['source_type'] ?? $before['source_type'] ?? null,
                'source_id' => $after['source_id'] ?? $before['source_id'] ?? null,
            ],
            'request_id' => (string) $request->header('X-Request-Id', $request->fingerprint()),
            'occurred_at' => now()->utc(),
            'result_status' => 'success',
            'before_version' => $beforeVersion,
            'after_version' => $afterVersion,
            'source_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];
    }

    private function deleteTransactions(
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

                $before = $this->snapshotTransaction($beforeModel);

                $this->deleteTransactionArtifacts($tenant, $beforeModel);
                $this->ledger->syncAfterDelete($beforeModel);
                $beforeModel->delete();

                if ($writeDeletionActivityLog) {
                    ActivityLog::create($this->makeActivityLogPayload(
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

    private function deleteAttachmentRecord(TenantAttachment $attachment): void
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

        if (!$stillReferenced && Storage::exists($filePath)) {
            Storage::delete($filePath);
        }
    }

    private function resolveUsableAccount(Tenant $tenant, ?TenantMember $member, ?string $accountId): ?TenantBankAccount
    {
        if (! $accountId) {
            return null;
        }

        return $this->access->usableAccountsQuery($tenant, $member)
            ->whereKey($accountId)
            ->first();
    }

    private function resolveUsableBudget(Tenant $tenant, ?TenantMember $member, ?string $budgetId): ?TenantBudget
    {
        if (! $budgetId) {
            return null;
        }

        return $this->access->usableBudgetsQuery($tenant, $member)
            ->whereKey($budgetId)
            ->first();
    }

    private function resolveBudgetStatus(string $type, ?TenantBudget $budget, float $amountBase): array
    {
        if ($type !== 'pengeluaran' || ! $budget) {
            return ['unbudgeted', 0];
        }

        $remainingAfter = round((float) $budget->remaining_amount - $amountBase, 2);

        return [
            $remainingAfter < 0 ? 'over_budget' : 'within_budget',
            $remainingAfter,
        ];
    }

    private function storeTransfer(
        StoreFinanceTransactionRequest $request,
        Tenant $tenant,
        TenantMember $member,
        array $data,
        bool $isRecurring
    ): JsonResponse {
        if ($isRecurring) {
            return response()->json(['ok' => false, 'message' => 'Transfer internal tidak mendukung recurring.'], 422);
        }

        $currency = $this->resolveCurrency($tenant, $data['currency_code']);
        if (! $currency) {
            return response()->json(['ok' => false, 'message' => 'Mata uang tidak ditemukan.'], 422);
        }

        $fromAccount = $this->resolveUsableAccount($tenant, $member, $data['from_account_id'] ?? null);
        $toAccount = $this->resolveUsableAccount($tenant, $member, $data['to_account_id'] ?? null);

        if (! $fromAccount || ! $toAccount) {
            return response()->json(['ok' => false, 'message' => 'Akun asal atau tujuan tidak ditemukan / tidak dapat diakses.'], 422);
        }

        if ($fromAccount->id === $toAccount->id) {
            return response()->json(['ok' => false, 'message' => 'Akun asal dan tujuan harus berbeda.'], 422);
        }

        if ($fromAccount->currency_code !== $toAccount->currency_code || $fromAccount->currency_code !== $data['currency_code']) {
            return response()->json(['ok' => false, 'message' => 'Transfer hanya mendukung akun dengan mata uang yang sama.'], 422);
        }

        if (! in_array($fromAccount->type, ['credit_card', 'paylater'], true) && (float) $fromAccount->current_balance < (float) $data['amount']) {
            return response()->json(['ok' => false, 'message' => 'Saldo akun asal tidak cukup untuk transfer.'], 422);
        }

        $sourceOwner = $this->access->resolveTransactionOwner($member, $tenant, $data['owner_member_id'] ?? null);
        $targetOwner = $this->access->resolveTransactionOwner($member, $tenant, $data['recipient_member_id'] ?? null) ?? $sourceOwner;

        try {
            $transactions = DB::transaction(function () use ($request, $tenant, $member, $sourceOwner, $targetOwner, $fromAccount, $toAccount, $data, $currency) {
                $source = FinanceTransaction::create($this->transactionPayload(
                    tenant: $tenant,
                    actorMemberId: $member->id,
                    ownerMemberId: $sourceOwner?->id,
                    data: array_merge($data, [
                        'bank_account_id' => $fromAccount->id,
                        'budget_id' => null,
                        'budget_status' => 'unbudgeted',
                        'budget_delta' => 0,
                        'transfer_direction' => 'out',
                        'description' => $data['description'] ?: "Transfer ke {$toAccount->name}",
                    ]),
                    currency: $currency,
                    rowVersion: 1,
                ));

                $target = FinanceTransaction::create($this->transactionPayload(
                    tenant: $tenant,
                    actorMemberId: $member->id,
                    ownerMemberId: $targetOwner?->id,
                    data: array_merge($data, [
                        'bank_account_id' => $toAccount->id,
                        'budget_id' => null,
                        'budget_status' => 'unbudgeted',
                        'budget_delta' => 0,
                        'transfer_direction' => 'in',
                        'description' => $data['description'] ?: "Transfer dari {$fromAccount->name}",
                    ]),
                    currency: $currency,
                    rowVersion: 1,
                ));

                $source->update(['transfer_pair_id' => $target->id]);
                $target->update(['transfer_pair_id' => $source->id]);

                $this->ledger->syncAfterCreate($source);
                $this->ledger->syncAfterCreate($target);

                ActivityLog::create($this->makeActivityLogPayload(
                    request: $request,
                    tenantId: $tenant->id,
                    actorMemberId: $member->id,
                    action: 'finance.transaction.created',
                    targetId: $source->id,
                    before: null,
                    after: $this->snapshotTransaction($source->fresh()),
                    beforeVersion: null,
                    afterVersion: 1,
                ));

                ActivityLog::create($this->makeActivityLogPayload(
                    request: $request,
                    tenantId: $tenant->id,
                    actorMemberId: $member->id,
                    action: 'finance.transaction.created',
                    targetId: $target->id,
                    before: null,
                    after: $this->snapshotTransaction($target->fresh()),
                    beforeVersion: null,
                    afterVersion: 1,
                ));

                return [$source->fresh(['bankAccount', 'ownerMember']), $target->fresh(['bankAccount', 'ownerMember'])];
            });

            $month = date('Y-m', strtotime($data['transaction_date']));
            $this->summary->invalidate($tenant->id, $month);

            return response()->json([
                'ok' => true,
                'data' => [
                    'transaction' => $transactions[0],
                    'paired_transaction' => $transactions[1],
                ],
            ], 201);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['ok' => false, 'message' => 'Gagal menyimpan transfer.'], 500);
        }
    }
}
