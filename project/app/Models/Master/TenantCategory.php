<?php

namespace App\Models\Master;

use App\Models\Tenant\Tenant;
use App\Models\Finance\FinanceTransaction;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class TenantCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'module', 'sub_type', 'parent_id',
        'name', 'description', 'icon', 'color', 'is_default', 'is_active', 'sort_order',
        'row_version',
    ];

    protected function casts(): array
    {
        return [
            'is_default'  => 'boolean',
            'is_active'   => 'boolean',
            'sort_order'  => 'integer',
            'row_version' => 'integer',
        ];
    }

    // Scopes
    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where($this->getTable() . '.tenant_id', $tenantId);
    }

    public function scopeForModule(Builder $query, string $module): Builder
    {
        return $query->where('module', $module);
    }

    public function scopeBySubType(Builder $query, string $subType): Builder
    {
        return $query->where('sub_type', $subType);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function scopeRoots(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    // Relations
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(TenantCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(TenantCategory::class, 'parent_id')->orderBy('sort_order');
    }

    public function financeTransactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class, 'category_id');
    }
}
