<?php

namespace App\Policies;

use App\Models\TenantCategory;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TenantCategoryPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('master.categories.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('master.categories.create');
    }

    public function update(User $user, TenantCategory $category): bool
    {
        return $user->hasPermissionTo('master.categories.update');
    }

    public function delete(User $user, TenantCategory $category): bool
    {
        return $user->hasPermissionTo('master.categories.delete');
    }
}
