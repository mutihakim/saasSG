<?php

namespace App\Providers;

use App\Models\Finance\FinanceTransaction;
use App\Models\Tenant\TenantMember;
use App\Models\Identity\User;
use App\Observers\FinanceTransactionObserver;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        date_default_timezone_set('UTC');

        // Force HTTPS for production
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        $this->bootMorphMap();
        $this->bootObservers();
        $this->bootFinanceQueryDebugging();
    }

    private function bootMorphMap(): void
    {
        // Keep a stable morph alias while remaining backward compatible with legacy FQCN records.
        Relation::enforceMorphMap([
            // Identity & Access
            'user' => \App\Models\Identity\User::class,
            'App\Models\User' => \App\Models\Identity\User::class,
            'tenant' => \App\Models\Tenant\Tenant::class,
            'App\Models\Tenant' => \App\Models\Tenant\Tenant::class,
            'tenant_member' => \App\Models\Tenant\TenantMember::class,
            'App\Models\TenantMember' => \App\Models\Tenant\TenantMember::class,
            'social_account' => \App\Models\Identity\SocialAccount::class,
            'App\Models\SocialAccount' => \App\Models\Identity\SocialAccount::class,

            // Finance Domain
            'finance_transaction' => \App\Models\Finance\FinanceTransaction::class,
            'App\Models\FinanceTransaction' => \App\Models\Finance\FinanceTransaction::class,
            'finance_wallet' => \App\Models\Finance\FinanceWallet::class,
            'App\Models\FinanceWallet' => \App\Models\Finance\FinanceWallet::class,
            'finance_savings_goal' => \App\Models\Finance\FinanceSavingsGoal::class,
            'App\Models\FinanceSavingsGoal' => \App\Models\Finance\FinanceSavingsGoal::class,
            'finance_pocket' => \App\Models\Finance\FinancePocket::class,
            'App\Models\FinancePocket' => \App\Models\Finance\FinancePocket::class,
            'finance_month_review' => \App\Models\Finance\FinanceMonthReview::class,
            'App\Models\FinanceMonthReview' => \App\Models\Finance\FinanceMonthReview::class,
            'wallet_wish' => \App\Models\Finance\WalletWish::class,
            'App\Models\WalletWish' => \App\Models\Finance\WalletWish::class,
            'tenant_budget' => \App\Models\Finance\TenantBudget::class,
            'App\Models\TenantBudget' => \App\Models\Finance\TenantBudget::class,
            'tenant_budget_line' => \App\Models\Finance\TenantBudgetLine::class,
            'App\Models\TenantBudgetLine' => \App\Models\Finance\TenantBudgetLine::class,

            // Master Data
            'tenant_category' => \App\Models\Master\TenantCategory::class,
            'App\Models\TenantCategory' => \App\Models\Master\TenantCategory::class,
            'tenant_currency' => \App\Models\Master\TenantCurrency::class,
            'App\Models\TenantCurrency' => \App\Models\Master\TenantCurrency::class,
            'tenant_tag' => \App\Models\Master\TenantTag::class,
            'App\Models\TenantTag' => \App\Models\Master\TenantTag::class,
            'tenant_uom' => \App\Models\Master\TenantUom::class,
            'App\Models\TenantUom' => \App\Models\Master\TenantUom::class,
            'tenant_bank_account' => \App\Models\Master\TenantBankAccount::class,
            'App\Models\TenantBankAccount' => \App\Models\Master\TenantBankAccount::class,

            // Whatsapp Domain
            'tenant_whatsapp_message' => \App\Models\Whatsapp\TenantWhatsappMessage::class,
            'App\Models\TenantWhatsappMessage' => \App\Models\Whatsapp\TenantWhatsappMessage::class,
            'tenant_whatsapp_contact' => \App\Models\Whatsapp\TenantWhatsappContact::class,
            'App\Models\TenantWhatsappContact' => \App\Models\Whatsapp\TenantWhatsappContact::class,
            'tenant_whatsapp_setting' => \App\Models\Whatsapp\TenantWhatsappSetting::class,
            'App\Models\TenantWhatsappSetting' => \App\Models\Whatsapp\TenantWhatsappSetting::class,
            'tenant_whatsapp_notification' => \App\Models\Whatsapp\TenantWhatsappNotification::class,
            'App\Models\TenantWhatsappNotification' => \App\Models\Whatsapp\TenantWhatsappNotification::class,

            // Misc
            'tenant_attachment' => \App\Models\Misc\TenantAttachment::class,
            'App\Models\TenantAttachment' => \App\Models\Misc\TenantAttachment::class,
            'tenant_invitation' => \App\Models\Tenant\TenantInvitation::class,
            'App\Models\TenantInvitation' => \App\Models\Tenant\TenantInvitation::class,
            'tenant_recurring_rule' => \App\Models\Misc\TenantRecurringRule::class,
            'App\Models\TenantRecurringRule' => \App\Models\Misc\TenantRecurringRule::class,
            'activity_log' => \App\Models\Misc\ActivityLog::class,
            'App\Models\ActivityLog' => \App\Models\Misc\ActivityLog::class,
        ]);
    }

    private function bootObservers(): void
    {
        FinanceTransaction::observe(FinanceTransactionObserver::class);
    }

    private function bootFinanceQueryDebugging(): void
    {
        if (! filter_var(env('FINANCE_QUERY_DEBUG', false), FILTER_VALIDATE_BOOL)) {
            return;
        }

        DB::listen(function (QueryExecuted $query): void {
            if (! $this->isFinanceRequest()) {
                return;
            }

            $metrics = $this->app->bound('finance.query_debug.metrics')
                ? $this->app->make('finance.query_debug.metrics')
                : ['count' => 0, 'time_ms' => 0.0];

            $metrics['count']++;
            $metrics['time_ms'] += $query->time;

            $this->app->instance('finance.query_debug.metrics', $metrics);

            Log::channel(config('logging.default'))->info('finance-query', [
                'path' => request()->path(),
                'time_ms' => $query->time,
                'sql' => $query->sql,
            ]);
        });

        $this->app->terminating(function (): void {
            if (! $this->isFinanceRequest() || ! $this->app->bound('finance.query_debug.metrics')) {
                return;
            }

            Log::channel(config('logging.default'))->info('finance-query-summary', [
                'path' => request()->path(),
                'query_count' => $this->app->make('finance.query_debug.metrics')['count'] ?? 0,
                'sql_time_ms' => $this->app->make('finance.query_debug.metrics')['time_ms'] ?? 0.0,
            ]);
        });
    }

    private function isFinanceRequest(): bool
    {
        if (! $this->app->bound('request')) {
            return false;
        }

        return request()->is('api/v1/tenants/*/finance/*')
            || request()->is('finance')
            || request()->is('finance/*');
    }
}
