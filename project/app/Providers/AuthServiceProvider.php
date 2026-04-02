<?php

namespace App\Providers;

use App\Models\FinanceTransaction;
use App\Models\TenantCategory;
use App\Models\TenantMember;
use App\Models\TenantTag;
use App\Models\TenantCurrency;
use App\Models\TenantUom;
use App\Policies\FinanceTransactionPolicy;
use App\Policies\TenantCategoryPolicy;
use App\Policies\TenantMemberPolicy;
use App\Policies\TenantRolePolicy;
use App\Policies\TenantTagPolicy;
use App\Policies\TenantCurrencyPolicy;
use App\Policies\TenantUomPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Spatie\Permission\Models\Role;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        TenantMember::class      => TenantMemberPolicy::class,
        Role::class              => TenantRolePolicy::class,
        FinanceTransaction::class => FinanceTransactionPolicy::class,
        TenantCategory::class    => TenantCategoryPolicy::class,
        TenantTag::class         => TenantTagPolicy::class,
        TenantCurrency::class    => TenantCurrencyPolicy::class,
        TenantUom::class         => TenantUomPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
