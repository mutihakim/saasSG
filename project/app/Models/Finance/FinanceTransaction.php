<?php

namespace App\Models\Finance;

use App\Models\Misc\TenantRecurringRule;
use App\Models\Misc\TenantAttachment;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Master\TenantCurrency;
use App\Models\Master\TenantCategory;
use App\Models\Master\TenantBankAccount;
use App\Models\Master\TenantTag;

use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
use App\Services\Finance\Wallet\FinanceWalletService;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinanceTransaction extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): \Database\Factories\Finance\FinanceTransactionFactory
    {
        return \Database\Factories\Finance\FinanceTransactionFactory::new();
    }

    protected $fillable = [
        'tenant_id', 'category_id', 'currency_id', 'created_by', 'owner_member_id', 'updated_by',
        'approved_by', 'approved_at',
        'type', 'transaction_date', 'amount', 'description',
        'exchange_rate', 'base_currency_code', 'amount_base',
        'notes', 'payment_method', 'reference_number',
        'merchant_name', 'location', 'status', 'row_version',
        'source_type', 'source_id', 'budget_id', 'bank_account_id', 'wallet_id',
        'budget_status', 'budget_delta',
        'is_internal_transfer', 'transfer_direction', 'transfer_pair_id',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = [
        'currency_code',
        'formatted_amount',
        'formatted_amount_base',
    ];

    protected function casts(): array
    {
        return [
            'type'             => TransactionType::class,
            'payment_method'   => PaymentMethod::class,
            'transaction_date' => 'date',
            'amount'           => 'decimal:2',
            'exchange_rate'    => 'decimal:6',
            'amount_base'      => 'decimal:2',
            'budget_delta'     => 'decimal:2',
            'row_version'      => 'integer',
            'approved_at'      => 'datetime',
            'is_internal_transfer' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        // Auto-compute amount_base on create/update
        static::saving(function (self $transaction) {
            if (! $transaction->wallet_id && $transaction->bank_account_id) {
                $account = TenantBankAccount::query()->find($transaction->bank_account_id);
                if ($account) {
                    $transaction->wallet_id = app(FinanceWalletService::class)
                        ->ensureMainWallet($account)
                        ->id;
                }
            }

            if (! $transaction->bank_account_id && $transaction->wallet_id) {
                $wallet = FinanceWallet::query()->find($transaction->wallet_id);
                if ($wallet) {
                    $transaction->bank_account_id = $wallet->real_account_id;
                }
            }

            $transaction->amount_base = round(
                (float) $transaction->amount * (float) $transaction->exchange_rate,
                2
            );
        });
    }

    // Scopes
    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where($this->getTable() . '.tenant_id', $tenantId);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeByCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByCurrency(Builder $query, $currency): Builder
    {
        if (is_numeric($currency)) {
            return $query->where('currency_id', $currency);
        }
        return $query->whereHas('currency', fn($q) => $q->where('code', $currency));
    }

    public function scopeByDateRange(Builder $query, ?string $from, ?string $to): Builder
    {
        return $query
            ->when($from, fn ($q) => $q->where('transaction_date', '>=', $from))
            ->when($to,   fn ($q) => $q->where('transaction_date', '<=', $to));
    }

    public function scopeForMonth(Builder $query, string $yearMonth): Builder
    {
        [$year, $month] = explode('-', $yearMonth);
        return $query->whereYear('transaction_date', $year)
                     ->whereMonth('transaction_date', $month);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function ($q) use ($term) {
            $q->where('description', 'like', "%{$term}%")
              ->orWhere('merchant_name', 'like', "%{$term}%")
              ->orWhere('reference_number', 'like', "%{$term}%");
        });
    }

    // Relations
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TenantCategory::class, 'category_id');
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(TenantCurrency::class, 'currency_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'updated_by');
    }

    public function ownerMember(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'owner_member_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'approved_by');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(TenantAttachment::class, 'attachable')
                    ->orderBy('sort_order');
    }

    public function tags(): MorphToMany
    {
        return $this->morphToMany(TenantTag::class, 'taggable', 'tenant_taggables', 'taggable_id', 'tenant_tag_id')
            ->withPivot('created_at');
    }

    public function recurringRule(): MorphOne
    {
        return $this->morphOne(TenantRecurringRule::class, 'ruleable');
    }

    public function pairedTransfer(): BelongsTo
    {
        return $this->belongsTo(self::class, 'transfer_pair_id');
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(TenantBankAccount::class, 'bank_account_id');
    }

    public function budget(): BelongsTo
    {
        return $this->belongsTo(TenantBudget::class, 'budget_id');
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(FinanceWallet::class, 'wallet_id');
    }

    public function pocket(): BelongsTo
    {
        return $this->wallet();
    }

    // Accessors
    public function getFormattedAmountAttribute(): string
    {
        $currency = $this->currency;
        if (! $currency) {
            return number_format((float) $this->amount, 2);
        }
        return $currency->formatAmount((float) $this->amount);
    }

    public function getFormattedAmountBaseAttribute(): string
    {
        return 'Rp ' . number_format((float) $this->amount_base, 0, ',', '.');
    }

    public function getCurrencyCodeAttribute(): ?string
    {
        return $this->currency?->code ?? $this->base_currency_code;
    }
}
