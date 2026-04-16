<?php

namespace App\Models\Games;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
