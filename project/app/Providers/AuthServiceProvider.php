<?php

namespace App\Providers;

use App\Models\Finance\FinanceTransaction;
use App\Models\Master\TenantCategory;
use App\Models\Tenant\TenantMember;
use App\Models\Master\TenantTag;
use App\Models\Master\TenantCurrency;
use App\Models\Master\TenantUom;
use App\Policies\FinanceTransactionPolicy;
use App\Policies\TenantCategoryPolicy;
use App\Policies\TenantMemberPolicy;
use App\Policies\TenantRolePolicy;
use App\Policies\TenantTagPolicy;
use App\Policies\TenantCurrencyPolicy;
use App\Policies\TenantUomPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Str;
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
        // Register morph map for polymorphic relations
        // This ensures consistent naming and helps with type compatibility
        \Illuminate\Database\Eloquent\Relations\Relation::morphMap([
            'finance_transaction' => FinanceTransaction::class,
            'tenant_category' => TenantCategory::class,
            'tenant_member' => TenantMember::class,
            'tenant_tag' => TenantTag::class,
            'tenant_currency' => TenantCurrency::class,
            'tenant_uom' => TenantUom::class,
        ]);
    }
}
