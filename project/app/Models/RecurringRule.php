<?php

namespace App\Models;

use App\Enums\RecurringFrequency;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class RecurringRule extends Model
{
    use HasUlids;

    protected $fillable = [
        'tenant_id', 'ruleable_type', 'ruleable_id',
        'frequency', 'interval', 'day_of_week', 'day_of_month',
        'month_of_year', 'start_date', 'end_date',
        'next_run_at', 'last_run_at', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'frequency'    => RecurringFrequency::class,
            'start_date'   => 'date',
            'end_date'     => 'date',
            'next_run_at'  => 'date',
            'last_run_at'  => 'date',
            'is_active'    => 'boolean',
            'interval'     => 'integer',
        ];
    }

    public function ruleable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeDueToday(Builder $query): Builder
    {
        return $query->active()
            ->where('next_run_at', '<=', now()->toDateString())
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString()));
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }
}
