<?php

namespace App\Models\Games;

use App\Models\Tenant\TenantMember;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantGameTahfizMurojaah extends Model
{
    protected $table = 'tenant_game_tahfiz_murojaah';

    protected $fillable = [
        'tenant_id',
        'member_id',
        'surah_number',
        'ayat',
        'tajwid_status',
        'hafalan_status',
        'catatan',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'member_id');
    }

    public function surah(): BelongsTo
    {
        return $this->belongsTo(GameTahfizSurah::class, 'surah_number', 'id');
    }
}
