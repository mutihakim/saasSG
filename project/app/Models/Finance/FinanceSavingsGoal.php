<?php

namespace App\Models\Finance;

use App\Models\Tenant\TenantMember;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinanceSavingsGoal extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'wallet_id',
        'owner_member_id',
        'name',
        'target_amount',
        'current_amount',
        'target_date',
        'status',
        'notes',
        'row_version',
    ];

    protected function casts(): array
    {
        return [
            'target_amount' => 'decimal:2',
            'current_amount' => 'decimal:2',
            'target_date' => 'date',
            'row_version' => 'integer',
        ];
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(FinanceWallet::class, 'wallet_id');
    }

    public function pocket(): BelongsTo
    {
        return $this->wallet();
    }

    public function ownerMember(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'owner_member_id');
    }

    public function financialTransactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class, 'source_id', 'id')
            ->where('source_type', 'wallet_goal')
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at');
    }
}
