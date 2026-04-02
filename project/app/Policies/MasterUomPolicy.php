<?php

namespace App\Policies;

use App\Models\MasterUom;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MasterUomPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('master.uom.view');
    }

    public function view(User $user, MasterUom $uom): bool
    {
        return $user->hasPermissionTo('master.uom.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('master.uom.create');
    }

    public function update(User $user, MasterUom $uom): bool
    {
        return $user->hasPermissionTo('master.uom.update');
    }

    public function delete(User $user, MasterUom $uom): bool
    {
        return $user->hasPermissionTo('master.uom.delete');
    }
}
