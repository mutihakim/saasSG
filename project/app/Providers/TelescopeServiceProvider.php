<?php

namespace App\Providers;

use App\Models\Identity\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\TelescopeApplicationServiceProvider;

class TelescopeServiceProvider extends TelescopeApplicationServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Telescope::night();

        $this->hideSensitiveRequestDetails();

        $isLocal = $this->app->environment('local');
        $recordAll = (bool) env('TELESCOPE_RECORD_ALL', false);

        Telescope::filter(function (IncomingEntry $entry) use ($isLocal, $recordAll) {
            if ($recordAll) {
                return true;
            }

            return $isLocal ||
                   $entry->isReportableException() ||
                   $entry->isFailedRequest() ||
                   $entry->isFailedJob() ||
                   $entry->isScheduledTask() ||
                   $entry->hasMonitoredTag();
        });

        Telescope::tag(function (IncomingEntry $entry) {
            $uri = (string) ($entry->content['uri'] ?? '');
            $command = (string) ($entry->content['command'] ?? '');

            if (Str::contains($uri, ['/finance', '/api/v1/tenants/']) && Str::contains($uri, '/finance')) {
                return ['finance'];
            }

            if (Str::contains($command, ['finance'])) {
                return ['finance'];
            }

            return [];
        });
    }

    /**
     * Prevent sensitive request details from being logged by Telescope.
     */
    protected function hideSensitiveRequestDetails(): void
    {
        if ($this->app->environment('local')) {
            return;
        }

        Telescope::hideRequestParameters(['_token']);

        Telescope::hideRequestHeaders([
            'cookie',
            'x-csrf-token',
            'x-xsrf-token',
        ]);
    }

    /**
     * Register the Telescope gate.
     *
     * This gate determines who can access Telescope in non-local environments.
     */
    protected function gate(): void
    {
        $allowedEmails = collect(explode(',', (string) env('TELESCOPE_ALLOWED_EMAILS', '')))
            ->map(fn ($email) => Str::lower(trim($email)))
            ->filter()
            ->values()
            ->all();

        Gate::define('viewTelescope', function (User $user) use ($allowedEmails) {
            if ((bool) $user->is_superadmin) {
                return true;
            }

            return in_array(Str::lower((string) $user->email), $allowedEmails, true);
        });
    }
}
