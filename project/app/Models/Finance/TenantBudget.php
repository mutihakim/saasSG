<?php

namespace App\Models\Finance;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TenantBudget extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'owner_member_id',
        'wallet_id',
        'name',
        'code',
        'budget_key',
        'scope',
        'period_month',
        'allocated_amount',
        'spent_amount',
        'remaining_amount',
        'notes',
        'is_active',
        'row_version',
    ];

    protected function casts(): array
    {
        return [
            'allocated_amount' => 'decimal:2',
            'spent_amount' => 'decimal:2',
            'remaining_amount' => 'decimal:2',
            'is_active' => 'boolean',
            'row_version' => 'integer',
        ];
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForPeriod(Builder $query, string $periodMonth): Builder
    {
        return $query->where('period_month', $periodMonth);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function ownerMember(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'owner_member_id');
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(FinanceWallet::class, 'wallet_id');
    }

    public function pocket(): BelongsTo
    {
        return $this->wallet();
    }

    public function memberAccess(): BelongsToMany
    {
        return $this->belongsToMany(TenantMember::class, 'tenant_budget_member_access', 'tenant_budget_id', 'member_id')
            ->withPivot(['can_view', 'can_use', 'can_manage'])
            ->withTimestamps();
    }

    public function lines(): HasMany
    {
        return $this->hasMany(TenantBudgetLine::class, 'budget_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class, 'budget_id');
    }
}
