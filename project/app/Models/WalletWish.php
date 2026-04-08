<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class WalletWish extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'owner_member_id',
        'goal_id',
        'title',
        'description',
        'estimated_amount',
        'priority',
        'status',
        'image_url',
        'approved_at',
        'approved_by_member_id',
        'notes',
        'row_version',
    ];

    protected function casts(): array
    {
        return [
            'estimated_amount' => 'decimal:2',
            'approved_at' => 'datetime',
            'row_version' => 'integer',
        ];
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function ownerMember(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'owner_member_id');
    }

    public function approvedByMember(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'approved_by_member_id');
    }

    public function goal(): BelongsTo
    {
        return $this->belongsTo(FinanceSavingsGoal::class, 'goal_id');
    }
}
