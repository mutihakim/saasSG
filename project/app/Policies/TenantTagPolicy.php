<?php

namespace App\Policies;

use App\Models\Master\TenantTag;
use App\Models\Identity\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TenantTagPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('master.tags.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('master.tags.create');
    }

    public function update(User $user, ?TenantTag $tag = null): bool
    {
        return $user->hasPermissionTo('master.tags.update');
    }

    public function delete(User $user, ?TenantTag $tag = null): bool
    {
        return $user->hasPermissionTo('master.tags.delete');
    }
}
