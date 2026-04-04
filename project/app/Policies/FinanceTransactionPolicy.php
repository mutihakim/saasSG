<?php

namespace App\Policies;

use App\Models\FinanceTransaction;
use App\Models\TenantMember;
use App\Models\User;
use App\Services\FinanceAccessService;
use Illuminate\Auth\Access\HandlesAuthorization;

class FinanceTransactionPolicy
{
    use HandlesAuthorization;

    private function getMember(User $user): ?TenantMember
    {
        return app('currentTenantMember') ?? null;
    }

    private function access(): FinanceAccessService
    {
        return app(FinanceAccessService::class);
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('finance.view');
    }

    public function view(User $user, FinanceTransaction $transaction): bool
    {
        $member = $this->getMember($user);

        return $user->hasPermissionTo('finance.view')
            && $this->access()->visibleTransactionsQuery($transaction->tenant, $member)->whereKey($transaction->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('finance.create');
    }

    public function update(User $user, FinanceTransaction $transaction): bool
    {
        $member = $this->getMember($user);
        if (! $member) {
            return false;
        }

        if ($this->access()->isPrivileged($member)) {
            return true;
        }

        if ((string) $transaction->owner_member_id === (string) $member->id || (string) $transaction->created_by === (string) $member->id) {
            return true;
        }

        if ($transaction->bank_account_id && $transaction->bankAccount) {
            return $this->access()->canManageAccount($transaction->bankAccount, $member);
        }

        return $user->hasPermissionTo('finance.update');
    }

    public function delete(User $user, FinanceTransaction $transaction): bool
    {
        $member = $this->getMember($user);
        if (! $member) {
            return false;
        }

        if ($this->access()->isPrivileged($member)) {
            return true;
        }

        if ((string) $transaction->owner_member_id === (string) $member->id || (string) $transaction->created_by === (string) $member->id) {
            return true;
        }

        if ($transaction->bank_account_id && $transaction->bankAccount) {
            return $this->access()->canManageAccount($transaction->bankAccount, $member);
        }

        return $user->hasPermissionTo('finance.delete');
    }

    public function restore(User $user, FinanceTransaction $transaction): bool
    {
        return $user->hasPermissionTo('finance.delete');
    }

    public function forceDelete(User $user, FinanceTransaction $transaction): bool
    {
        return false; // Only superadmin via artisan
    }
}
