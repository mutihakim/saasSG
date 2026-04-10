<?php

namespace App\Models\Master;

use App\Models\Tenant\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class TenantUom extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tenant_uom';

    protected $fillable = [
        'tenant_id', 'code', 'name', 'abbreviation', 'dimension_type',
        'base_unit_code', 'base_factor',
        'is_active', 'sort_order', 'row_version',
    ];

    protected function casts(): array
    {
        return [
            'is_active'   => 'boolean',
            'base_factor' => 'decimal:6',
            'sort_order'  => 'integer',
            'row_version' => 'integer',
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
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
