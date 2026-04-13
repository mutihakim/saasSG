<?php

namespace App\Models\Games;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantGameMathStat extends Model
{
    use HasFactory;

    protected $table = 'tenant_game_math_stats';

    protected $fillable = [
        'tenant_id',
        'member_id',
        'operator',
        'angka_pilihan',
        'angka_random',
        'jumlah_benar',
        'jumlah_salah',
        'current_streak_benar',
        'max_streak_benar',
        'last_played_at',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'member_id' => 'integer',
            'angka_pilihan' => 'integer',
            'angka_random' => 'integer',
            'jumlah_benar' => 'integer',
            'jumlah_salah' => 'integer',
            'current_streak_benar' => 'integer',
            'max_streak_benar' => 'integer',
            'last_played_at' => 'datetime',
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
}
