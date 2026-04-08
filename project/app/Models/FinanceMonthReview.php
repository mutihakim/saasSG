<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceMonthReview extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'tenant_id',
        'period_month',
        'status',
        'started_by',
        'started_at',
        'closed_by',
        'closed_at',
        'snapshot_payload',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'closed_at' => 'datetime',
            'snapshot_payload' => 'array',
        ];
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function startedBy(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'started_by');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'closed_by');
    }
}
