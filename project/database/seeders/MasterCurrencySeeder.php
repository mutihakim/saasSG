<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterCurrencySeeder extends Seeder
{
    public function run(): void
    {
        $currencies = [
            ['code' => 'IDR', 'name' => 'Rupiah Indonesia',       'symbol' => 'Rp',   'symbol_position' => 'before', 'decimal_places' => 0, 'thousands_sep' => '.', 'decimal_sep' => ',', 'is_active' => true, 'sort_order' => 1],
            ['code' => 'USD', 'name' => 'Dolar Amerika Serikat',  'symbol' => 'US$',  'symbol_position' => 'before', 'decimal_places' => 2, 'thousands_sep' => ',', 'decimal_sep' => '.', 'is_active' => true, 'sort_order' => 2],
            ['code' => 'EUR', 'name' => 'Euro',                   'symbol' => '€',    'symbol_position' => 'before', 'decimal_places' => 2, 'thousands_sep' => '.', 'decimal_sep' => ',', 'is_active' => true, 'sort_order' => 3],
            ['code' => 'SGD', 'name' => 'Dolar Singapura',        'symbol' => 'S$',   'symbol_position' => 'before', 'decimal_places' => 2, 'thousands_sep' => ',', 'decimal_sep' => '.', 'is_active' => true, 'sort_order' => 4],
            ['code' => 'MYR', 'name' => 'Ringgit Malaysia',       'symbol' => 'RM',   'symbol_position' => 'before', 'decimal_places' => 2, 'thousands_sep' => ',', 'decimal_sep' => '.', 'is_active' => true, 'sort_order' => 5],
            ['code' => 'AUD', 'name' => 'Dolar Australia',        'symbol' => 'A$',   'symbol_position' => 'before', 'decimal_places' => 2, 'thousands_sep' => ',', 'decimal_sep' => '.', 'is_active' => true, 'sort_order' => 6],
            ['code' => 'GBP', 'name' => 'Poundsterling Inggris',  'symbol' => '£',    'symbol_position' => 'before', 'decimal_places' => 2, 'thousands_sep' => ',', 'decimal_sep' => '.', 'is_active' => true, 'sort_order' => 7],
            ['code' => 'JPY', 'name' => 'Yen Jepang',             'symbol' => '¥',    'symbol_position' => 'before', 'decimal_places' => 0, 'thousands_sep' => ',', 'decimal_sep' => '.', 'is_active' => true, 'sort_order' => 8],
            ['code' => 'SAR', 'name' => 'Riyal Arab Saudi',       'symbol' => 'SAR',  'symbol_position' => 'before', 'decimal_places' => 2, 'thousands_sep' => ',', 'decimal_sep' => '.', 'is_active' => true, 'sort_order' => 9],
            ['code' => 'CNY', 'name' => 'Yuan Tiongkok',          'symbol' => '¥',    'symbol_position' => 'before', 'decimal_places' => 2, 'thousands_sep' => ',', 'decimal_sep' => '.', 'is_active' => true, 'sort_order' => 10],
        ];

        DB::table('master_currencies')->upsert($currencies, ['code'], [
            'name', 'symbol', 'symbol_position', 'decimal_places',
            'thousands_sep', 'decimal_sep', 'is_active', 'sort_order',
        ]);
    }
}
