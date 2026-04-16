<?php

namespace App\Models\Games;

use App\Models\Tenant\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GameCurriculumUnit extends Model
{
    use SoftDeletes;

    protected $table = 'curriculum_units';

    protected $fillable = [
        'tenant_id',
        'educational_phase',
        'grade',
        'subject',
        'semester',
        'chapter',
        'curriculum_type',
        'difficulty_level',
        'metadata',
        'row_version',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'grade' => 'integer',
            'semester' => 'integer',
            'metadata' => 'array',
            'row_version' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(GameCurriculumQuestion::class, 'curriculum_unit_id');
    }
}
