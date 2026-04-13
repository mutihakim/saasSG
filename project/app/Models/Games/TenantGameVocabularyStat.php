<?php

namespace App\Models\Games;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantGameVocabularyStat extends Model
{
    use HasFactory;

    protected $table = 'tenant_game_vocabulary_progress';

    protected $fillable = [
        'tenant_id',
        'member_id',
        'word_id',
        'language',
        'jumlah_benar',
        'jumlah_salah',
        'correct_streak',
        'max_streak',
        'is_mastered',
        'last_practiced_at',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'member_id' => 'integer',
            'word_id' => 'integer',
            'jumlah_benar' => 'integer',
            'jumlah_salah' => 'integer',
            'correct_streak' => 'integer',
            'max_streak' => 'integer',
            'is_mastered' => 'boolean',
            'last_practiced_at' => 'datetime',
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

    public function word(): BelongsTo
    {
        return $this->belongsTo(TenantGameVocabularyWord::class, 'word_id');
    }
}
