<?php

namespace App\Services;

use App\Models\Misc\ActivityLog;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ActivityLogService
{
    public function log(
        Request $request,
        Tenant $tenant,
        string $action,
        string $targetType,
        string|int $targetId,
        ?array $before = null,
        ?array $after = null,
        array $metadata = [],
        ?int $beforeVersion = null,
        ?int $afterVersion = null,
        ?TenantMember $actorMember = null,
    ): ActivityLog {
        $changes = array_filter([
            'before' => $before,
            'after' => $after,
        ], static fn ($value) => $value !== null);

        return ActivityLog::create([
            'tenant_id' => $tenant->id,
            'actor_user_id' => $request->user()?->id,
            'actor_member_id' => $actorMember?->id,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => (string) $targetId,
            'changes' => $changes !== [] ? $changes : null,
            'metadata' => array_merge([
                'channel' => $request->expectsJson() ? 'api' : 'web',
            ], $metadata),
            'request_id' => (string) $request->header('X-Request-Id', $request->fingerprint()),
            'occurred_at' => now()->utc(),
            'result_status' => 'success',
            'before_version' => $beforeVersion,
            'after_version' => $afterVersion,
            'source_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    public function snapshot(Model|array|null $subject, ?array $only = null): ?array
    {
        if ($subject === null) {
            return null;
        }

        $payload = $subject instanceof Model
            ? $subject->attributesToArray()
            : $subject;

        if ($only === null) {
            return $payload;
        }

        $snapshot = [];

        foreach ($only as $key) {
            if (array_key_exists($key, $payload)) {
                $snapshot[$key] = $payload[$key];
            }
        }

        return $snapshot;
    }
}
