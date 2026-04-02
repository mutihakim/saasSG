<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterUom extends Model
{
    public $timestamps = false;

    protected $table = 'master_uom';

    protected $fillable = [
        'code', 'name', 'abbreviation', 'dimension_type',
        'base_unit_code', 'base_factor', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active'   => 'boolean',
            'base_factor' => 'float',
            'sort_order'  => 'integer',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('dimension_type')->orderBy('sort_order');
    }

    public function scopeByDimension(Builder $query, string $type): Builder
    {
        return $query->where('dimension_type', $type);
    }

    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(MasterUom::class, 'base_unit_code', 'code');
    }

    public function derivedUnits(): HasMany
    {
        return $this->hasMany(MasterUom::class, 'base_unit_code', 'code');
    }
}
