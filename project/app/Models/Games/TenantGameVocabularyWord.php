<?php

namespace App\Models\Games;

use App\Models\Tenant\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantGameVocabularyWord extends Model
{
    use HasFactory;

    protected $table = 'tenant_game_vocabulary_words';

    protected $fillable = [
        'tenant_id',
        'bahasa_indonesia',
        'bahasa_inggris',
        'fonetik',
        'bahasa_arab',
        'fonetik_arab',
        'kategori',
        'hari',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'hari' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
