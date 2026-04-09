<?php

namespace App\Providers;

use Illuminate\Database\Events\QueryExecuted;
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

        $this->bootFinanceQueryDebugging();
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
