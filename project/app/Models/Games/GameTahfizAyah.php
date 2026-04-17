<?php

namespace App\Models\Games;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameTahfizAyah extends Model
{
    protected $table = 'quran_ayahs';

    protected $fillable = [
        'surah_id',
        'nomor_ayat',
        'teks_arab',
        'teks_latin',
        'teks_indonesia',
        'audio',
    ];

    public function surah(): BelongsTo
    {
        return $this->belongsTo(GameTahfizSurah::class, 'surah_id', 'id');
    }

    public function tenantFavorites(): HasMany
    {
        return $this->hasMany(TenantGameTahfizFavorite::class, 'ayah_id');
    }
}
