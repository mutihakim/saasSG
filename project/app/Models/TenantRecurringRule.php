<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class TenantRecurringRule extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'ruleable_type', 'ruleable_id',
        'frequency', 'interval', 'by_day', 'day_of_month',
        'start_date', 'end_date', 'total_occurrences',
        'next_run_at', 'is_active', 'row_version',
    ];

    protected function casts(): array
    {
        return [
            'interval'          => 'integer',
            'by_day'            => 'array',
            'day_of_month'      => 'integer',
            'start_date'        => 'date',
            'end_date'          => 'date',
            'total_occurrences' => 'integer',
            'next_run_at'       => 'datetime',
            'is_active'         => 'boolean',
            'row_version'       => 'integer',
        ];
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where($this->getTable() . '.tenant_id', $tenantId);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function ruleable(): MorphTo
    {
        return $this->morphTo();
    }
}
