<?php

namespace App\Models\Master;

use App\Models\Tenant\Tenant;
use App\Models\Finance\FinanceTransaction;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class TenantTag extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'name', 'color', 'usage_count', 'is_active', 'row_version',
    ];

    protected function casts(): array
    {
        return [
            'usage_count' => 'integer',
            'is_active'   => 'boolean',
            'row_version' => 'integer',
        ];
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where($this->getTable() . '.tenant_id', $tenantId);
    }

    public function scopePopular(Builder $query): Builder
    {
        return $query->orderBy('usage_count', 'desc')->orderBy('name');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function financeTransactions(): MorphToMany
    {
        return $this->morphedByMany(FinanceTransaction::class, 'taggable', 'tenant_taggables', 'tenant_tag_id', 'taggable_id');
    }
}
