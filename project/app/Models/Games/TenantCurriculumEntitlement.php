<?php

namespace App\Models\Games;

use App\Models\Identity\User;
use App\Models\Tenant\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantCurriculumEntitlement extends Model
{
    protected $table = 'tenant_curriculum_entitlements';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'educational_phase',
        'grade',
        'subject',
        'is_active',
        'valid_until',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'user_id' => 'integer',
            'grade' => 'integer',
            'is_active' => 'boolean',
            'valid_until' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
