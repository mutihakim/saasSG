<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;

class TenantBankAccount extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'owner_member_id',
        'name',
        'scope',
        'type',
        'currency_code',
        'opening_balance',
        'current_balance',
        'notes',
        'is_active',
        'row_version',
    ];

    protected function casts(): array
    {
        return [
            'opening_balance' => 'decimal:2',
            'current_balance' => 'decimal:2',
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

    public function ownerMember(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'owner_member_id');
    }

    public function memberAccess(): BelongsToMany
    {
        return $this->belongsToMany(TenantMember::class, 'tenant_bank_account_member_access', 'tenant_bank_account_id', 'member_id')
            ->withPivot(['can_view', 'can_use', 'can_manage'])
            ->withTimestamps();
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class, 'bank_account_id');
    }

    public function pockets(): HasMany
    {
        return $this->hasMany(FinancePocket::class, 'real_account_id');
    }

    public function mainPocket(): HasOne
    {
        return $this->hasOne(FinancePocket::class, 'real_account_id')->where('is_system', true);
    }

    public function allocatedAmount(): float
    {
        $pockets = $this->relationLoaded('pockets')
            ? $this->getRelation('pockets')
            : $this->pockets()->get(['current_balance', 'is_system']);

        if (! $pockets instanceof Collection) {
            return 0.0;
        }

        return round((float) $pockets
            ->filter(fn (FinancePocket $pocket) => ! (bool) $pocket->is_system)
            ->sum(fn (FinancePocket $pocket) => (float) $pocket->current_balance), 2);
    }

    public function unallocatedAmount(): float
    {
        return round((float) $this->current_balance - $this->allocatedAmount(), 2);
    }
}
