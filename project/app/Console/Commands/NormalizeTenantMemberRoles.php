<?php

namespace App\Console\Commands;

use App\Models\Tenant\Tenant;
use App\Services\TenantRoleSyncService;
use Illuminate\Console\Command;

class NormalizeTenantMemberRoles extends Command
{
    protected $signature = 'tenant:members:normalize-roles
        {tenant : Tenant slug or numeric id}
        {--dry-run : Show the tenant and member counts without writing role assignments}';

    protected $description = 'Normalize effective tenant user roles from tenant_members.role_code.';

    public function handle(TenantRoleSyncService $roleSyncService): int
    {
        $tenantInput = (string) $this->argument('tenant');

        $tenant = Tenant::query()
            ->where(function ($query) use ($tenantInput) {
                if (ctype_digit($tenantInput)) {
                    $query->where('id', (int) $tenantInput);
                }

                $query->orWhere('slug', $tenantInput);
            })
            ->first();

        if (! $tenant) {
            $this->error('Tenant not found.');

            return self::FAILURE;
        }

        $memberCount = $tenant->members()
            ->whereNull('deleted_at')
            ->whereNotNull('user_id')
            ->count();

        $this->line(sprintf('tenant: %s (#%d)', $tenant->slug, $tenant->id));
        $this->line(sprintf('linked members: %d', $memberCount));

        if ((bool) $this->option('dry-run')) {
            $this->comment('Dry run only. No role assignments were changed.');

            return self::SUCCESS;
        }

        $stats = $roleSyncService->normalizeTenantRoles($tenant);

        foreach ($stats as $label => $value) {
            $this->line(sprintf('%s: %d', str_replace('_', ' ', $label), $value));
        }

        return self::SUCCESS;
    }
}
