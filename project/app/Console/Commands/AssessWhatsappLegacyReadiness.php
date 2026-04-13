<?php

namespace App\Console\Commands;

use App\Models\Tenant\Tenant;
use App\Models\Whatsapp\TenantWhatsappMessage;
use App\Models\Whatsapp\TenantWhatsappSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class AssessWhatsappLegacyReadiness extends Command
{
    protected $signature = 'whatsapp:legacy:readiness
        {--tenant= : Tenant slug or numeric id to scope the audit}
        {--days=7 : Lookback window in days for message activity}
        {--json : Emit JSON output for automation}';

    protected $description = 'Assess whether the current WhatsApp setup is ready to retire the legacy per-project service.';

    public function handle(): int
    {
        $tenant = $this->resolveTenant();
        if ($this->option('tenant') && ! $tenant) {
            $this->error('Tenant not found.');

            return self::FAILURE;
        }

        $scopeLabel = $tenant
            ? sprintf('tenant %s (#%d)', $tenant->slug, $tenant->id)
            : 'all tenants';
        $lookbackDays = max(1, (int) $this->option('days'));
        $activitySince = now()->subDays($lookbackDays);
        $staleConnectingBefore = now()->subMilliseconds(
            (int) config('whatsapp.connecting_timeout_ms', 60000)
            + (int) config('whatsapp.connecting_stale_grace_ms', 15000)
        );

        $settingsQuery = TenantWhatsappSetting::query();
        $messagesQuery = TenantWhatsappMessage::query();

        if ($tenant) {
            $settingsQuery->where('tenant_id', $tenant->id);
            $messagesQuery->where('tenant_id', $tenant->id);
        }

        $settings = $settingsQuery->get([
            'tenant_id',
            'connection_status',
            'connected_jid',
            'auto_connect',
            'meta',
            'updated_at',
        ]);

        $serviceUrl = (string) config('whatsapp.service_url', '');
        $targetType = $this->detectServiceTarget($serviceUrl);

        $countsByStatus = [
            'connected' => $settings->where('connection_status', 'connected')->count(),
            'connecting' => $settings->where('connection_status', 'connecting')->count(),
            'disconnected' => $settings->where('connection_status', 'disconnected')->count(),
            'auto_connect_enabled' => $settings->where('auto_connect', true)->count(),
        ];

        $staleConnecting = $settings
            ->filter(fn (TenantWhatsappSetting $setting): bool => $setting->connection_status === 'connecting'
                && $setting->updated_at instanceof Carbon
                && $setting->updated_at->lte($staleConnectingBefore))
            ->values();

        $jidConflicts = $settings
            ->filter(function (TenantWhatsappSetting $setting): bool {
                $meta = is_array($setting->meta) ? $setting->meta : [];

                return ($meta['disconnect_reason'] ?? null) === 'jid_conflict'
                    || ! empty($meta['conflict_connected_jid'] ?? null)
                    || ! empty($meta['conflict_owner_tenant_id'] ?? null);
            })
            ->values();

        $recentInbound = (clone $messagesQuery)
            ->where('direction', 'incoming')
            ->where('created_at', '>=', $activitySince)
            ->count();

        $recentOutbound = (clone $messagesQuery)
            ->where('direction', 'outgoing')
            ->where('created_at', '>=', $activitySince)
            ->count();

        $checks = [
            'service_enabled' => (bool) config('whatsapp.service_enabled', false),
            'service_target_is_broker' => $targetType === 'broker',
            'no_stale_connecting_sessions' => $staleConnecting->isEmpty(),
            'no_jid_conflicts' => $jidConflicts->isEmpty(),
        ];

        $ready = ! in_array(false, $checks, true);

        $payload = [
            'scope' => $scopeLabel,
            'ready' => $ready,
            'checks' => $checks,
            'service' => [
                'module_enabled' => (bool) config('whatsapp.enabled', true),
                'service_enabled' => (bool) config('whatsapp.service_enabled', false),
                'service_url' => $serviceUrl,
                'target_type' => $targetType,
            ],
            'summary' => [
                'tenant_settings' => $settings->count(),
                'connected' => $countsByStatus['connected'],
                'connecting' => $countsByStatus['connecting'],
                'disconnected' => $countsByStatus['disconnected'],
                'auto_connect_enabled' => $countsByStatus['auto_connect_enabled'],
                'stale_connecting' => $staleConnecting->count(),
                'jid_conflicts' => $jidConflicts->count(),
                'recent_incoming_messages' => $recentInbound,
                'recent_outgoing_messages' => $recentOutbound,
                'activity_since' => $activitySince->toIso8601String(),
            ],
            'notes' => [
                'Manual validation still required for PM2/Nginx/queue/Reverb health before disabling the legacy service.',
                'This command only audits Laravel config and database state available to the app.',
            ],
        ];

        if ($this->option('json')) {
            $this->line(json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return $ready ? self::SUCCESS : self::FAILURE;
        }

        $this->line(sprintf('scope: %s', $scopeLabel));
        $this->line(sprintf('service_url: %s', $serviceUrl !== '' ? $serviceUrl : '(empty)'));
        $this->line(sprintf('service_target: %s', $targetType));
        $this->line(sprintf('service_enabled: %s', $checks['service_enabled'] ? 'yes' : 'no'));
        $this->line(sprintf('tenant_settings: %d', $settings->count()));
        $this->line(sprintf('connected: %d | connecting: %d | disconnected: %d', $countsByStatus['connected'], $countsByStatus['connecting'], $countsByStatus['disconnected']));
        $this->line(sprintf('auto_connect_enabled: %d', $countsByStatus['auto_connect_enabled']));
        $this->line(sprintf('recent_activity_%dd: incoming=%d outgoing=%d', $lookbackDays, $recentInbound, $recentOutbound));
        $this->line(sprintf('stale_connecting_sessions: %d', $staleConnecting->count()));
        $this->line(sprintf('jid_conflicts: %d', $jidConflicts->count()));

        if ($staleConnecting->isNotEmpty()) {
            $this->warn('Stale connecting tenants: ' . $staleConnecting->pluck('tenant_id')->implode(', '));
        }

        if ($jidConflicts->isNotEmpty()) {
            $this->warn('Conflict tenants: ' . $jidConflicts->pluck('tenant_id')->implode(', '));
        }

        $this->newLine();
        $this->line('checks:');
        foreach ($checks as $name => $passed) {
            $this->line(sprintf('- %s: %s', $name, $passed ? 'PASS' : 'FAIL'));
        }

        $this->newLine();
        $this->line(sprintf('readiness: %s', $ready ? 'PASS' : 'FAIL'));
        $this->line('manual follow-up: PM2 broker, Nginx /app proxy, queue worker, and Reverb runtime still need external validation.');

        return $ready ? self::SUCCESS : self::FAILURE;
    }

    private function resolveTenant(): ?Tenant
    {
        $tenantInput = trim((string) $this->option('tenant'));
        if ($tenantInput === '') {
            return null;
        }

        return Tenant::query()
            ->where(function ($query) use ($tenantInput) {
                if (ctype_digit($tenantInput)) {
                    $query->where('id', (int) $tenantInput);
                }

                $query->orWhere('slug', $tenantInput);
            })
            ->first();
    }

    private function detectServiceTarget(string $serviceUrl): string
    {
        $normalized = Str::lower(trim($serviceUrl));
        if ($normalized === '') {
            return 'unknown';
        }

        if (str_contains($normalized, ':3030') || str_contains($normalized, 'whatsapp-broker') || str_contains($normalized, '/broker')) {
            return 'broker';
        }

        if (str_contains($normalized, ':3010') || str_contains($normalized, 'services/whatsapp')) {
            return 'legacy';
        }

        return 'unknown';
    }
}
