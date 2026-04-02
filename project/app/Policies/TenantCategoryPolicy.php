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
        return $user->hasPermissionTo('finance.view') || 
               $user->hasPermissionTo('grocery.view') || 
               $user->hasPermissionTo('task.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('finance.create') || 
               $user->hasPermissionTo('grocery.create') || 
               $user->hasPermissionTo('task.create');
    }

    public function update(User $user, TenantCategory $category): bool
    {
        return $user->hasPermissionTo($category->module . '.update');
    }

    public function delete(User $user, TenantCategory $category): bool
    {
        return $user->hasPermissionTo($category->module . '.delete');
    }
}
