<?php

namespace App\Enums;

enum RecurringFrequency: string
{
    case HARIAN   = 'harian';
    case MINGGUAN = 'mingguan';
    case BULANAN  = 'bulanan';
    case TAHUNAN  = 'tahunan';

    public function label(): string
    {
        return match ($this) {
            self::HARIAN   => 'Setiap Hari',
            self::MINGGUAN => 'Setiap Minggu',
            self::BULANAN  => 'Setiap Bulan',
            self::TAHUNAN  => 'Setiap Tahun',
        };
    }
}
