<?php

namespace App\Enums;

enum TransactionType: string
{
    case PEMASUKAN  = 'pemasukan';
    case PENGELUARAN = 'pengeluaran';

    public function label(): string
    {
        return match ($this) {
            self::PEMASUKAN  => 'Pemasukan',
            self::PENGELUARAN => 'Pengeluaran',
        };
    }

    public function badgeClass(): string
    {
        return match ($this) {
            self::PEMASUKAN  => 'badge bg-success-subtle text-success',
            self::PENGELUARAN => 'badge bg-danger-subtle text-danger',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::PEMASUKAN  => 'ri-arrow-up-circle-line',
            self::PENGELUARAN => 'ri-arrow-down-circle-line',
        };
    }
}
