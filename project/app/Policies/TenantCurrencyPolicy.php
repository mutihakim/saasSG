<?php

namespace App\Policies;

use App\Models\Master\TenantCurrency;
use App\Models\Identity\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TenantCurrencyPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('master.currencies.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('master.currencies.create');
    }

    public function update(User $user, TenantCurrency $currency): bool
    {
        return $user->hasPermissionTo('master.currencies.update');
    }

    public function delete(User $user, TenantCurrency $currency): bool
    {
        return $user->hasPermissionTo('master.currencies.delete');
    }
}
