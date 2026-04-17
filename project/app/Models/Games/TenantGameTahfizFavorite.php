<?php

namespace App\Models\Games;

use App\Models\Tenant\Tenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantGameTahfizFavorite extends Model
{
    use HasFactory;

    protected $table = 'tenant_game_tahfiz_favorites';

    protected $fillable = [
        'tenant_id',
        'surah_id',
        'ayah_start',
        'ayah_end',
        'category',
        'note',
    ];

    protected $casts = [
        'tenant_id' => 'integer',
        'surah_id' => 'integer',
        'ayah_start' => 'integer',
        'ayah_end' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function surah(): BelongsTo
    {
        return $this->belongsTo(GameTahfizSurah::class, 'surah_id');
    }
}
