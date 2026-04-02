<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case TUNAI          = 'tunai';
    case TRANSFER       = 'transfer';
    case KARTU_KREDIT   = 'kartu_kredit';
    case KARTU_DEBIT    = 'kartu_debit';
    case DOMPET_DIGITAL = 'dompet_digital';
    case QRIS           = 'qris';
    case LAINNYA        = 'lainnya';

    public function label(): string
    {
        return match ($this) {
            self::TUNAI          => 'Tunai',
            self::TRANSFER       => 'Transfer Bank',
            self::KARTU_KREDIT   => 'Kartu Kredit',
            self::KARTU_DEBIT    => 'Kartu Debit',
            self::DOMPET_DIGITAL => 'Dompet Digital',
            self::QRIS           => 'QRIS',
            self::LAINNYA        => 'Lainnya',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::TUNAI          => 'ri-money-dollar-circle-line',
            self::TRANSFER       => 'ri-bank-line',
            self::KARTU_KREDIT   => 'ri-bank-card-line',
            self::KARTU_DEBIT    => 'ri-bank-card-2-line',
            self::DOMPET_DIGITAL => 'ri-wallet-3-line',
            self::QRIS           => 'ri-qr-code-line',
            self::LAINNYA        => 'ri-more-line',
        };
    }
}
