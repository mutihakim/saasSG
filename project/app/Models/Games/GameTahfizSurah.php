<?php

namespace App\Models\Games;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameTahfizSurah extends Model
{
    protected $table = 'quran_surahs';

    protected $fillable = [
        'id', // Since it's not auto-incrementing in our schema
        'nama',
        'nama_latin',
        'jumlah_ayat',
        'tempat_turun',
        'arti',
        'deskripsi',
        'audio_full',
    ];

    public $incrementing = false;
    protected $keyType = 'integer';

    public function ayahs(): HasMany
    {
        return $this->hasMany(GameTahfizAyah::class, 'surah_id', 'id');
    }
}
