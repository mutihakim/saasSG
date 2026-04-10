<?php

namespace App\Models\Master;

use App\Models\Tenant\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class TenantCurrency extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'code', 'name', 'symbol', 'symbol_position',
        'decimal_places', 'thousands_sep', 'decimal_sep',
        'is_active', 'sort_order', 'row_version',
    ];

    protected function casts(): array
    {
        return [
            'is_active'      => 'boolean',
            'decimal_places' => 'integer',
            'sort_order'     => 'integer',
            'row_version'    => 'integer',
        ];
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where($this->getTable() . '.tenant_id', $tenantId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('code');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function formatAmount(float $amount): string
    {
        $formatted = number_format($amount, $this->decimal_places, $this->decimal_sep, $this->thousands_sep);

        if ($this->symbol_position === 'before') {
            return $this->symbol . ' ' . $formatted;
        }

        return $formatted . ' ' . $this->symbol;
    }
}
