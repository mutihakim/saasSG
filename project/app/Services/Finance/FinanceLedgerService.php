<?php

namespace App\Services\Finance;

use App\Models\FinanceTransaction;
use App\Models\FinancePocket;
use App\Models\TenantBankAccount;
use App\Models\TenantBudget;
use App\Models\TenantBudgetLine;

class FinanceLedgerService
{
    public function syncAfterCreate(FinanceTransaction $transaction): void
    {
        $this->applyAccountEffect($transaction, 1);
        $this->applyPocketEffect($transaction, 1);
        $this->applyBudgetEffect($transaction, 1);
    }

    public function syncAfterDelete(FinanceTransaction $transaction): void
    {
        $this->applyBudgetEffect($transaction, -1);
        $this->applyPocketEffect($transaction, -1);
        $this->applyAccountEffect($transaction, -1);
    }

    public function syncAfterUpdate(FinanceTransaction $before, FinanceTransaction $after): void
    {
        $this->syncAfterDelete($before);
        $this->syncAfterCreate($after);
    }

    private function applyAccountEffect(FinanceTransaction $transaction, int $multiplier): void
    {
        if (! $transaction->bank_account_id) {
            return;
        }

        /** @var TenantBankAccount|null $account */
        $account = TenantBankAccount::query()
            ->lockForUpdate()
            ->find($transaction->bank_account_id);

        if (! $account) {
            return;
        }

        $delta = $this->accountDelta($transaction) * $multiplier;

        $account->forceFill([
            'current_balance' => round(((float) $account->current_balance) + $delta, 2),
        ])->save();
    }

    private function applyBudgetEffect(FinanceTransaction $transaction, int $multiplier): void
    {
        if (! $transaction->budget_id) {
            TenantBudgetLine::query()
                ->where('finance_transaction_id', $transaction->id)
                ->delete();
            return;
        }

        /** @var TenantBudget|null $budget */
        $budget = TenantBudget::query()
            ->lockForUpdate()
            ->find($transaction->budget_id);

        if (! $budget) {
            return;
        }

        $amount = round((float) $transaction->amount_base * $multiplier, 2);

        $budget->forceFill([
            'spent_amount' => round(((float) $budget->spent_amount) + $amount, 2),
        ]);
        $budget->remaining_amount = round((float) $budget->allocated_amount - (float) $budget->spent_amount, 2);
        $budget->save();

        if ($multiplier > 0) {
            TenantBudgetLine::query()
                ->where('finance_transaction_id', $transaction->id)
                ->delete();

            TenantBudgetLine::create([
                'tenant_id' => $transaction->tenant_id,
                'budget_id' => $budget->id,
                'finance_transaction_id' => $transaction->id,
                'member_id' => $transaction->owner_member_id,
                'entry_type' => 'expense',
                'amount' => $transaction->amount_base,
                'balance_after' => $budget->remaining_amount,
                'notes' => $transaction->description,
            ]);
        } else {
            TenantBudgetLine::query()
                ->where('finance_transaction_id', $transaction->id)
                ->delete();
        }
    }

    private function applyPocketEffect(FinanceTransaction $transaction, int $multiplier): void
    {
        if (! $transaction->pocket_id) {
            return;
        }

        /** @var FinancePocket|null $pocket */
        $pocket = FinancePocket::query()
            ->lockForUpdate()
            ->find($transaction->pocket_id);

        if (! $pocket) {
            return;
        }

        $delta = $this->accountDelta($transaction) * $multiplier;

        $pocket->forceFill([
            'current_balance' => round(((float) $pocket->current_balance) + $delta, 2),
        ])->save();
    }

    private function accountDelta(FinanceTransaction $transaction): float
    {
        $amount = (float) $transaction->amount;
        $type = $transaction->type?->value ?? $transaction->type;

        if ($type === 'pemasukan') {
            return $amount;
        }

        if ($type === 'pengeluaran') {
            return -$amount;
        }

        if ($type === 'transfer') {
            return $transaction->transfer_direction === 'in' ? $amount : -$amount;
        }

        return 0.0;
    }
}
