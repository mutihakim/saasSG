<?php

namespace App\Models\Games;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantGameTahfizStat extends Model
{
    use HasFactory;

    protected $table = 'tenant_game_tahfiz_progress';

    protected $fillable = [
        'tenant_id',
        'member_id',
        'surah_number',
        'ayat_awal',
        'ayat_akhir',
        'status',
        'tanggal_catat',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'member_id' => 'integer',
            'surah_number' => 'integer',
            'ayat_awal' => 'integer',
            'ayat_akhir' => 'integer',
            'tanggal_catat' => 'date',
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

    public function surah(): BelongsTo
    {
        return $this->belongsTo(GameTahfizSurah::class, 'surah_number', 'id');
    }
}
