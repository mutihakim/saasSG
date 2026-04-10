<?php

namespace App\Models\Finance;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use App\Models\Master\TenantBankAccount;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinanceWallet extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'real_account_id',
        'owner_member_id',
        'name',
        'background_color',
        'slug',
        'type',
        'purpose_type',
        'is_system',
        'scope',
        'currency_code',
        'reference_code',
        'icon_key',
        'default_budget_id',
        'default_budget_key',
        'budget_lock_enabled',
        'current_balance',
        'notes',
        'is_active',
        'row_version',
    ];

    protected function casts(): array
    {
        return [
            'current_balance' => 'decimal:2',
            'is_system' => 'boolean',
            'budget_lock_enabled' => 'boolean',
            'is_active' => 'boolean',
            'row_version' => 'integer',
        ];
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function realAccount(): BelongsTo
    {
        return $this->belongsTo(TenantBankAccount::class, 'real_account_id');
    }

    public function ownerMember(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'owner_member_id');
    }

    public function defaultBudget(): BelongsTo
    {
        return $this->belongsTo(TenantBudget::class, 'default_budget_id');
    }

    public function memberAccess(): BelongsToMany
    {
        return $this->belongsToMany(TenantMember::class, 'finance_wallet_member_access', 'finance_wallet_id', 'member_id')
            ->withPivot(['can_view', 'can_use', 'can_manage'])
            ->withTimestamps();
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class, 'wallet_id');
    }

    public function savingsGoals(): HasMany
    {
        return $this->hasMany(FinanceSavingsGoal::class, 'wallet_id');
    }
}
