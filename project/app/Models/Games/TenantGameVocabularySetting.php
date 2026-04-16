<?php

namespace App\Models\Games;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantGameVocabularySetting extends Model
{
    use HasFactory;

    protected $table = 'tenant_game_vocabulary_settings';

    protected $fillable = [
        'tenant_id',
        'member_id',
        'language',
        'default_mode',
        'default_question_count',
        'mastered_threshold',
        'default_time_limit',
        'auto_tts',
        'translation_direction',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'member_id' => 'integer',
            'default_question_count' => 'integer',
            'mastered_threshold' => 'integer',
            'default_time_limit' => 'integer',
            'auto_tts' => 'boolean',
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
