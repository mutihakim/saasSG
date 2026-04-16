<?php

namespace Database\Seeders\Support\Master;

class CurrencyBlueprint
{
    public static function defaultCurrencies(): array
    {
        return [
            [
                'code' => 'IDR',
                'name' => 'Rupiah',
                'symbol' => 'Rp',
                'symbol_position' => 'before',
                'decimal_places' => 0,
                'thousands_sep' => '.',
                'decimal_sep' => ',',
                'sort_order' => 1,
            ],
            [
                'code' => 'USD',
                'name' => 'US Dollar',
                'symbol' => '$',
                'symbol_position' => 'before',
                'decimal_places' => 2,
                'thousands_sep' => ',',
                'decimal_sep' => '.',
                'sort_order' => 2,
            ],
        ];
    }
}
