<?php

namespace App\Models\Games;

use App\Models\Tenant\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class GameCurriculumQuestion extends Model
{
    use SoftDeletes;

    protected $table = 'curriculum_questions';

    protected $fillable = [
        'tenant_id',
        'curriculum_unit_id',
        'question_key',
        'question_text',
        'options',
        'correct_answer',
        'question_type',
        'points',
        'difficulty_order',
        'metadata',
        'row_version',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'curriculum_unit_id' => 'integer',
            'options' => 'array',
            'points' => 'integer',
            'difficulty_order' => 'integer',
            'metadata' => 'array',
            'row_version' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(GameCurriculumUnit::class, 'curriculum_unit_id');
    }
}
