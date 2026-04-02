<?php

namespace App\Policies;

use App\Models\MasterCurrency;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MasterCurrencyPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('master.currencies.view');
    }

    public function view(User $user, MasterCurrency $currency): bool
    {
        return $user->hasPermissionTo('master.currencies.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('master.currencies.create');
    }

    public function update(User $user, MasterCurrency $currency): bool
    {
        return $user->hasPermissionTo('master.currencies.update');
    }

    public function delete(User $user, MasterCurrency $currency): bool
    {
        return $user->hasPermissionTo('master.currencies.delete');
    }
}
