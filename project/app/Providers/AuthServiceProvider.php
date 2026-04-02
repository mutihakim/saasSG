<?php

namespace App\Providers;

use App\Models\TenantMember;
use App\Models\FinanceTransaction;
use App\Models\MasterCurrency;
use App\Models\MasterUom;
use App\Policies\TenantMemberPolicy;
use App\Policies\TenantRolePolicy;
use App\Policies\FinanceTransactionPolicy;
use App\Policies\MasterCurrencyPolicy;
use App\Policies\MasterUomPolicy;
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
        TenantMember::class => TenantMemberPolicy::class,
        Role::class => TenantRolePolicy::class,
        FinanceTransaction::class => FinanceTransactionPolicy::class,
        MasterCurrency::class => MasterCurrencyPolicy::class,
        MasterUom::class => MasterUomPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
