<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class SharedTag extends Model
{
    use HasUlids;

    protected $fillable = ['tenant_id', 'name', 'color', 'usage_count'];

    protected function casts(): array
    {
        return [
            'usage_count' => 'integer',
        ];
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where('name', 'like', "%{$term}%");
    }

    public function scopePopular(Builder $query): Builder
    {
        return $query->orderByDesc('usage_count');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function financeTransactions(): MorphToMany
    {
        return $this->morphedByMany(
            FinanceTransaction::class,
            'taggable',
            'shared_taggables',
            'tag_id',
            'taggable_id'
        );
    }
}
