<?php

namespace App\Policies;

use App\Models\Master\TenantUom;
use App\Models\Identity\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TenantUomPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('master.uom.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('master.uom.create');
    }

    public function update(User $user, TenantUom $uom): bool
    {
        return $user->hasPermissionTo('master.uom.update');
    }

    public function delete(User $user, TenantUom $uom): bool
    {
        return $user->hasPermissionTo('master.uom.delete');
    }
}
