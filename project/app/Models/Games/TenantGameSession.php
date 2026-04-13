<?php

namespace App\Models\Games;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantGameSession extends Model
{
    use HasFactory, HasUlids;

    protected $table = 'tenant_game_sessions';

    protected $fillable = [
        'tenant_id',
        'member_id',
        'game_slug',
        'metadata',
        'question_count',
        'correct_count',
        'wrong_count',
        'best_streak',
        'score_percent',
        'duration_seconds',
        'summary',
        'started_at',
        'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'member_id' => 'integer',
            'question_count' => 'integer',
            'correct_count' => 'integer',
            'wrong_count' => 'integer',
            'best_streak' => 'integer',
            'score_percent' => 'decimal:2',
            'duration_seconds' => 'integer',
            'metadata' => 'array',
            'summary' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
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
