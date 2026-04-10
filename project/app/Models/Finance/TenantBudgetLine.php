<?php

namespace App\Models\Finance;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantBudgetLine extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'tenant_id',
        'budget_id',
        'finance_transaction_id',
        'member_id',
        'entry_type',
        'amount',
        'balance_after',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance_after' => 'decimal:2',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function budget(): BelongsTo
    {
        return $this->belongsTo(TenantBudget::class, 'budget_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(FinanceTransaction::class, 'finance_transaction_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'member_id');
    }
}
