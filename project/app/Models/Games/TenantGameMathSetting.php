<?php

namespace App\Models\Games;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantGameMathSetting extends Model
{
    use HasFactory;

    protected $table = 'tenant_game_math_settings';

    protected $fillable = [
        'tenant_id',
        'member_id',
        'operator',
        'default_mode',
        'default_question_count',
        'default_time_limit',
        'mastered_threshold',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'member_id' => 'integer',
            'default_question_count' => 'integer',
            'default_time_limit' => 'integer',
            'mastered_threshold' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'member_id');
    }
}
