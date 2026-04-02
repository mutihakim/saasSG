<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
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
    use HasFactory;
    use HasUlids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id', 'category_id', 'currency_code', 'created_by',
        'type', 'transaction_date', 'amount', 'description',
        'exchange_rate', 'base_currency', 'amount_base',
        'notes', 'payment_method', 'reference_number',
        'merchant_name', 'location', 'row_version',
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
            'row_version'      => 'integer',
        ];
    }

    protected static function booted(): void
    {
        // Auto-compute amount_base on create/update
        static::saving(function (self $transaction) {
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

    public function scopeByCategory(Builder $query, string $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByCurrency(Builder $query, string $code): Builder
    {
        return $query->where('currency_code', $code);
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
        return $this->belongsTo(SharedCategory::class, 'category_id');
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(MasterCurrency::class, 'currency_code', 'code');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'created_by');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(SharedAttachment::class, 'attachable')
                    ->orderBy('sort_order');
    }

    public function tags(): MorphToMany
    {
        return $this->morphToMany(SharedTag::class, 'taggable', 'shared_taggables', 'taggable_id', 'tag_id')
                    ->withPivot('created_at');
    }

    public function recurringRule(): MorphOne
    {
        return $this->morphOne(RecurringRule::class, 'ruleable');
    }

    // Accessors
    public function getFormattedAmountAttribute(): string
    {
        $currency = $this->currency;
        if (! $currency) {
            return number_format((float) $this->amount, 2) . ' ' . $this->currency_code;
        }
        return $currency->formatAmount((float) $this->amount);
    }

    public function getFormattedAmountBaseAttribute(): string
    {
        return 'Rp ' . number_format((float) $this->amount_base, 0, ',', '.');
    }
}
