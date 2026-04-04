<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TenantMember extends Model
{
    use HasFactory;
    use SoftDeletes;

    public const ROLES = [
        'owner',
        'admin',
        'operator',
        'member',
        'viewer',
        'tenant_owner',
        'tenant_admin',
        'tenant_operator',
        'tenant_member',
        'tenant_viewer',
    ];

    protected $fillable = [
        'tenant_id',
        'user_id',
        'full_name',
        'role_code',
        'profile_status',
        'onboarding_status',
        'whatsapp_jid',
        'row_version',
    ];

    protected $casts = [
        'row_version' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ownedBankAccounts(): HasMany
    {
        return $this->hasMany(TenantBankAccount::class, 'owner_member_id');
    }

    public function accessibleBankAccounts(): BelongsToMany
    {
        return $this->belongsToMany(TenantBankAccount::class, 'tenant_bank_account_member_access', 'member_id', 'tenant_bank_account_id')
            ->withPivot(['can_view', 'can_use', 'can_manage'])
            ->withTimestamps();
    }

    public function ownedBudgets(): HasMany
    {
        return $this->hasMany(TenantBudget::class, 'owner_member_id');
    }

    public function accessibleBudgets(): BelongsToMany
    {
        return $this->belongsToMany(TenantBudget::class, 'tenant_budget_member_access', 'member_id', 'tenant_budget_id')
            ->withPivot(['can_view', 'can_use', 'can_manage'])
            ->withTimestamps();
    }

    public function financeTransactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class, 'owner_member_id');
    }

    public function isPrivilegedFinanceActor(): bool
    {
        return in_array($this->role_code, ['owner', 'admin', 'tenant_owner', 'tenant_admin'], true);
    }
}
