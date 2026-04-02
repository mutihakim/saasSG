<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class MasterCurrency extends Model
{
    public $timestamps = false;
    protected $primaryKey = 'code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'code', 'name', 'symbol', 'symbol_position',
        'decimal_places', 'thousands_sep', 'decimal_sep',
        'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active'      => 'boolean',
            'decimal_places' => 'integer',
            'sort_order'     => 'integer',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('code');
    }

    /**
     * Format an amount according to this currency's display rules.
     * e.g. formatAmount(15000000) → "Rp 15.000.000"
     */
    public function formatAmount(float|int $amount): string
    {
        $formatted = number_format(
            $amount,
            $this->decimal_places,
            $this->decimal_sep,
            $this->thousands_sep
        );

        return $this->symbol_position === 'before'
            ? "{$this->symbol} {$formatted}"
            : "{$formatted} {$this->symbol}";
    }
}
