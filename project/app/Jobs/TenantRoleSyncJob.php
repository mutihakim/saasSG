<?php

namespace App\Jobs;

use App\Models\Identity\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Spatie\Permission\PermissionRegistrar;

class TenantRoleSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public readonly int $tenantId,
        public readonly int $userId,
        public readonly array $roles,
    ) {
    }

    public function handle(PermissionRegistrar $permissionRegistrar): void
    {
        $user = User::find($this->userId);

        if (! $user) {
            return;
        }

        $permissionRegistrar->setPermissionsTeamId($this->tenantId);
        $user->syncRoles($this->roles);
    }
}
