<?php

namespace App\Http\Controllers\Api;

use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFinanceTransactionRequest;
use App\Http\Requests\UpdateFinanceTransactionRequest;
use App\Models\FinanceTransaction;
use App\Models\MasterCurrency;
use App\Models\RecurringRule;
use App\Models\TenantCategory;
use App\Models\TenantTag;
use App\Models\Tenant;
use App\Services\FinanceSummaryService;
use App\Services\TagService;
use App\Support\SubscriptionEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FinanceTransactionApiController extends Controller
{
    public function __construct(
        private readonly FinanceSummaryService $summary,
        private readonly TagService $tags,
        private readonly SubscriptionEntitlements $entitlements,
    ) {}

    // ─── GET /finance/transactions ───────────────────────────────────────────
    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', FinanceTransaction::class);

        $query = FinanceTransaction::query()
            ->forTenant($tenant->id)
            ->with(['category:id,name,icon,color', 'currency:id,code,symbol,decimal_places', 'createdBy:id,full_name', 'tags:id,name,color'])
            ->when($request->search, fn ($q) => $q->search($request->search))
            ->when($request->type, fn ($q) => $q->byType($request->type))
            ->when($request->category_id, fn ($q) => $q->byCategory($request->category_id))
            ->when($request->currency_code, fn ($q) => $q->byCurrency($request->currency_code))
            ->when($request->payment_method, fn ($q) => $q->where('payment_method', $request->payment_method))
            ->when($request->month, fn ($q) => $q->forMonth($request->month))
            ->when(! $request->month, fn ($q) => $q->byDateRange($request->date_from, $request->date_to));

        $sortField = in_array($request->sort, ['transaction_date', 'amount_base', 'created_at'])
            ? $request->sort
            : 'transaction_date';
        $direction = $request->direction === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortField, $direction);

        $perPage = min((int) ($request->per_page ?? 15), 100);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'ok'   => true,
            'data' => [
                'transactions' => $paginator->items(),
                'meta'         => [
                    'current_page' => $paginator->currentPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                    'last_page'    => $paginator->lastPage(),
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

        /** @var \App\Models\TenantMember $member */
        $member = $request->attributes->get('currentTenantMember');

        if (!$member) {
            return response()->json(['ok' => false, 'message' => 'Profil anggota tidak ditemukan.'], 403);
        }

        $data = $request->validated();
        $isRecurring = (bool) ($data['is_recurring'] ?? false);

        DB::beginTransaction();
        try {
            $transaction = FinanceTransaction::create([
                'tenant_id'        => $tenant->id,
                'category_id'      => $data['category_id'],
                'currency_code'    => $data['currency_code'],
                'base_currency'    => $tenant->currency_code ?? 'IDR',
                'created_by'       => $member->id,
                'type'             => $data['type'],
                'transaction_date' => $data['transaction_date'],
                'amount'           => $data['amount'],
                'exchange_rate'    => $data['exchange_rate'],
                'description'      => $data['description'],
                'payment_method'   => $data['payment_method'],
                'notes'            => $data['notes'] ?? null,
                'reference_number' => $data['reference_number'] ?? null,
                'merchant_name'    => $data['merchant_name'] ?? null,
                'location'         => $data['location'] ?? null,
                'row_version'      => 1,
            ]);

            // Sync tags
            if (! empty($data['tags'])) {
                $this->tags->syncTags($transaction, $tenant->id, $data['tags']);
            }

            // Recurring rule
            if ($isRecurring && ! empty($data['recurring_freq'])) {
                RecurringRule::create([
                    'tenant_id'     => $tenant->id,
                    'ruleable_type' => FinanceTransaction::class,
                    'ruleable_id'   => $transaction->id,
                    'frequency'     => $data['recurring_freq'],
                    'interval'      => 1,
                    'start_date'    => $data['transaction_date'],
                    'end_date'      => $data['recurring_end_date'] ?? null,
                    'next_run_at'   => $data['transaction_date'],
                    'is_active'     => true,
                ]);
            }

            DB::commit();

            // Invalidate summary cache
            $month = date('Y-m', strtotime($data['transaction_date']));
            $this->summary->invalidate($tenant->id, $month);

            return response()->json([
                'ok'   => true,
                'data' => ['transaction' => $transaction->load(['category', 'currency', 'tags'])],
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
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
            'data' => ['transaction' => $transaction->load(['category', 'currency', 'createdBy', 'tags', 'recurringRule'])],
        ]);
    }

    // ─── PATCH /finance/transactions/{id} ───────────────────────────────────
    public function update(UpdateFinanceTransactionRequest $request, Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $this->authorize('update', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        $data = $request->validated();

        // OCC check
        if ((int) $transaction->row_version !== (int) $data['row_version']) {
            return response()->json([
                'ok'         => false,
                'error_code' => 'VERSION_CONFLICT',
                'message'    => 'Transaksi diubah oleh pengguna lain. Silakan muat ulang.',
            ], 409);
        }

        $isRecurring = (bool) ($data['is_recurring'] ?? false);
        $oldMonth    = date('Y-m', strtotime((string) $transaction->transaction_date));
        $newMonth    = date('Y-m', strtotime($data['transaction_date']));

        DB::beginTransaction();
        try {
            $transaction->update([
                'category_id'      => $data['category_id'],
                'currency_code'    => $data['currency_code'],
                'type'             => $data['type'],
                'transaction_date' => $data['transaction_date'],
                'amount'           => $data['amount'],
                'exchange_rate'    => $data['exchange_rate'],
                'description'      => $data['description'],
                'payment_method'   => $data['payment_method'],
                'notes'            => $data['notes'] ?? null,
                'reference_number' => $data['reference_number'] ?? null,
                'merchant_name'    => $data['merchant_name'] ?? null,
                'location'         => $data['location'] ?? null,
                'row_version'      => $transaction->row_version + 1,
            ]);

            $this->tags->syncTags($transaction, $tenant->id, $data['tags'] ?? []);

            // Update or delete recurring rule
            if ($isRecurring && ! empty($data['recurring_freq'])) {
                RecurringRule::updateOrCreate(
                    ['ruleable_type' => FinanceTransaction::class, 'ruleable_id' => $transaction->id],
                    ['frequency' => $data['recurring_freq'], 'end_date' => $data['recurring_end_date'] ?? null, 'is_active' => true]
                );
            } else {
                $transaction->recurringRule?->delete();
            }

            DB::commit();

            $this->summary->invalidate($tenant->id, $oldMonth);
            if ($newMonth !== $oldMonth) {
                $this->summary->invalidate($tenant->id, $newMonth);
            }

            return response()->json([
                'ok'   => true,
                'data' => ['transaction' => $transaction->fresh(['category', 'currency', 'tags'])],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return response()->json(['ok' => false, 'message' => 'Gagal memperbarui transaksi.'], 500);
        }
    }

    // ─── DELETE /finance/transactions/{id} ──────────────────────────────────
    public function destroy(Tenant $tenant, FinanceTransaction $transaction): JsonResponse
    {
        $this->authorize('delete', $transaction);
        abort_if((int) $transaction->tenant_id !== (int) $tenant->id, 404);

        $month = date('Y-m', strtotime((string) $transaction->transaction_date));
        $transaction->delete();
        $this->summary->invalidate($tenant->id, $month);

        return response()->json(['ok' => true]);
    }

    // ─── DELETE /finance/transactions (bulk) ─────────────────────────────────
    public function bulkDestroy(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('delete', new FinanceTransaction());

        $ids = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'string'])['ids'];

        $affected = FinanceTransaction::query()
            ->forTenant($tenant->id)
            ->whereIn('id', $ids)
            ->get();

        $months = $affected->map(fn ($t) => date('Y-m', strtotime((string) $t->transaction_date)))->unique();

        FinanceTransaction::query()
            ->forTenant($tenant->id)
            ->whereIn('id', $ids)
            ->delete();

        foreach ($months as $month) {
            $this->summary->invalidate($tenant->id, $month);
        }

        return response()->json(['ok' => true, 'deleted' => $affected->count()]);
    }

    // ─── GET /finance/summary ─────────────────────────────────────────────────
    public function summary(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', FinanceTransaction::class);

        $month = $request->get('month', now()->format('Y-m'));

        return response()->json([
            'ok'   => true,
            'data' => $this->summary->getSummary($tenant, $month),
        ]);
    }

    // ─── GET /finance/categories ──────────────────────────────────────────────
    public function categories(Request $request, Tenant $tenant): JsonResponse
    {
         $module = $request->get('module', 'finance');
         $query = TenantCategory::forTenant($tenant->id)
            ->forModule($module)
            ->roots()
            ->with(['children' => function($q) {
                $q->active()->ordered();
            }])
            ->active()
            ->ordered();

        if ($request->sub_type) {
            $query->bySubType($request->sub_type);
        }

        return response()->json([
            'ok'   => true,
            'data' => ['categories' => $query->get(['id', 'name', 'sub_type', 'icon', 'color', 'is_default', 'module', 'parent_id', 'row_version'])],
        ]);
    }

    // ─── POST /finance/categories ─────────────────────────────────────────────
    public function storeCategory(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('create', TenantCategory::class);

        // Custom category quota check
        $limit = $this->entitlements->limit($tenant, 'finance.custom_cat.max');
        if ($limit === null) $limit = -1;
        if ($limit !== -1) {
            $customCount = TenantCategory::forTenant($tenant->id)
                ->forModule('finance')
                ->where('is_default', false)
                ->count();
            if ($customCount >= $limit) {
                return response()->json([
                    'ok'         => false,
                    'error_code' => 'PLAN_QUOTA_EXCEEDED',
                    'message'    => "Batas {$limit} kategori kustom tercapai.",
                ], 422);
            }
        }

        $data = $request->validate([
            'name'       => [
                'required',
                'string',
                'max:100',
                \Illuminate\Validation\Rule::unique('tenant_categories')
                    ->where(function ($query) use ($tenant, $request) {
                        return $query->where('tenant_id', $tenant->id)
                            ->where('module', $request->get('module', 'finance'))
                            ->where('sub_type', $request->get('sub_type'));
                    }),
            ],
            'module'     => ['nullable', 'string'],
            'parent_id'  => ['nullable', 'integer'],
            'sub_type'   => ['required_if:module,finance', 'nullable', 'in:pemasukan,pengeluaran'],
            'icon'       => ['nullable', 'string', 'max:60'],
            'color'      => ['nullable', 'string', 'max:30'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category = TenantCategory::create([
            'tenant_id'  => $tenant->id,
            'module'     => $data['module'] ?? 'finance',
            'sub_type'   => $data['sub_type'] ?? null,
            'parent_id'  => $data['parent_id'] ?? null,
            'name'       => $data['name'],
            'icon'       => $data['icon'] ?? 'ri-price-tag-3-line',
            'color'      => $data['color'] ?? '#95A5A6',
            'is_default' => false,
            'is_active'  => true,
            'sort_order' => $data['sort_order'] ?? 50,
        ]);

        return response()->json(['ok' => true, 'data' => ['category' => $category]], 201);
    }

    // ─── PATCH /finance/categories/{category} ─────────────────────────────────
    public function updateCategory(Request $request, Tenant $tenant, TenantCategory $category): JsonResponse
    {
        $this->authorize('update', $category);
        abort_if((int) $category->tenant_id !== (int) $tenant->id, 404);

        // Cannot edit default system categories
        if ($category->is_default) {
            return response()->json([
                'ok'         => false,
                'error_code' => 'FORBIDDEN',
                'message'    => 'Kategori default tidak dapat diubah.',
            ], 403);
        }

        $data = $request->validate([
            'name'       => [
                'required',
                'string',
                'max:100',
                \Illuminate\Validation\Rule::unique('tenant_categories')
                    ->ignore($category->id)
                    ->where(fn ($query) => $query->where('tenant_id', $tenant->id)->where('module', $category->module)->where('sub_type', $data['sub_type'] ?? null)),
            ],
            'parent_id'  => ['nullable', 'integer'],
            'sub_type'   => ['nullable', 'in:pemasukan,pengeluaran'],
            'icon'        => ['nullable', 'string', 'max:60'],
            'color'       => ['nullable', 'string', 'max:30'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'is_active'   => ['nullable', 'boolean'],
            'row_version' => ['required', 'integer'],
        ]);

        $category->update([
            'name'       => $data['name'],
            'sub_type'   => $data['sub_type'] ?? $category->sub_type,
            'parent_id'  => array_key_exists('parent_id', $data) ? $data['parent_id'] : $category->parent_id,
            'icon'       => $data['icon'] ?? $category->icon,
            'color'      => $data['color'] ?? $category->color,
            'sort_order' => $data['sort_order'] ?? $category->sort_order,
            'is_active'  => $data['is_active'] ?? $category->is_active,
        ]);

        return response()->json(['ok' => true, 'data' => ['category' => $category]]);
    }

    // ─── DELETE /finance/categories/{category} ────────────────────────────────
    public function destroyCategory(Request $request, Tenant $tenant, TenantCategory $category): JsonResponse
    {
        $request->validate(['row_version' => 'required|integer']);
        $this->authorize('delete', $category);
        abort_if((int) $category->tenant_id !== (int) $tenant->id, 404);

        // Cannot delete default system categories
        if ($category->is_default) {
            return response()->json([
                'ok'         => false,
                'error_code' => 'FORBIDDEN',
                'message'    => 'Kategori default tidak dapat dihapus.',
            ], 403);
        }

        // Check if category is being used by transactions
        $txCount = $category->financeTransactions()->count();
        if ($txCount > 0) {
            return response()->json([
                'ok'         => false,
                'error_code' => 'CATEGORY_IN_USE',
                'message'    => "Kategori tidak dapat dihapus karena masih digunakan oleh {$txCount} transaksi.",
            ], 422);
        }

        $category->delete();

        return response()->json(['ok' => true]);
    }

    // ─── DELETE /finance/categories (bulk) ───────────────────────────────────
    public function bulkDestroyCategory(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('delete', TenantCategory::class);
        $ids = $request->validate(['ids' => 'required|array|min:1'])['ids'];

        $count = TenantCategory::forTenant($tenant->id)
            ->whereIn('id', $ids)
            ->where('is_default', false)
            ->delete();

        return response()->json(['ok' => true, 'deleted' => $count]);
    }

    // ─── PATCH /finance/categories/bulk-parent ──────────────────────────────
    public function bulkSetParentCategory(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('update', FinanceTransaction::class);
        $data = $request->validate([
            'ids'       => 'required|array|min:1',
            'parent_id' => 'nullable|integer',
        ]);

        $count = TenantCategory::forTenant($tenant->id)
            ->whereIn('id', $data['ids'])
            ->where('is_default', false)
            ->update(['parent_id' => $data['parent_id']]);

        return response()->json(['ok' => true, 'updated' => $count]);
    }

    // ─── GET /finance/tags/suggest ────────────────────────────────────────────
    public function suggestTags(Request $request, Tenant $tenant): JsonResponse
    {
        $q = $request->get('q', '');

        $suggestions = $this->tags->suggest($tenant->id, $q);

        return response()->json(['ok' => true, 'data' => ['tags' => $suggestions]]);
    }

    // ─── GET /finance/transactions/export ────────────────────────────────────
    public function export(Request $request, Tenant $tenant): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('viewAny', FinanceTransaction::class);

        $month    = $request->get('month', now()->format('Y-m'));
        $filename = "transaksi-{$month}-{$tenant->slug}.csv";

        $query = FinanceTransaction::query()
            ->forTenant($tenant->id)
            ->with(['category:id,name', 'currency:code,symbol'])
            ->when($request->search, fn ($q) => $q->search($request->search))
            ->when($request->type, fn ($q) => $q->byType($request->type))
            ->when($request->category_id, fn ($q) => $q->byCategory($request->category_id))
            ->when($request->currency_code, fn ($q) => $q->byCurrency($request->currency_code))
            ->when($request->payment_method, fn ($q) => $q->where('payment_method', $request->payment_method))
            ->when($request->month, fn ($q) => $q->forMonth($request->month))
            ->when(! $request->month, fn ($q) => $q->byDateRange($request->date_from, $request->date_to))
            ->orderBy('transaction_date', 'desc');

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');

            // BOM for Excel UTF-8
            fputs($handle, "\xEF\xBB\xBF");

            // Header row
            fputcsv($handle, [
                'Tanggal', 'Deskripsi', 'Merchant/Toko', 'Kategori',
                'Tipe', 'Jumlah', 'Mata Uang', 'Kurs ke IDR',
                'Jumlah (IDR)', 'Metode Pembayaran', 'No. Referensi', 'Catatan', 'Tag',
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
                        $tx->payment_method->label(),
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
}
