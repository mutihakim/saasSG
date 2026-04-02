<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MasterUomSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            // Berat
            ['code' => 'kg',   'name' => 'Kilogram',      'abbreviation' => 'kg',  'dimension_type' => 'berat',   'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 1],
            ['code' => 'gram', 'name' => 'Gram',          'abbreviation' => 'gr',  'dimension_type' => 'berat',   'base_unit_code' => 'kg',  'base_factor' => 0.001,     'sort_order' => 2],
            ['code' => 'mg',   'name' => 'Miligram',      'abbreviation' => 'mg',  'dimension_type' => 'berat',   'base_unit_code' => 'kg',  'base_factor' => 0.000001,  'sort_order' => 3],
            ['code' => 'ons',  'name' => 'Ons',           'abbreviation' => 'ons', 'dimension_type' => 'berat',   'base_unit_code' => 'kg',  'base_factor' => 0.1,       'sort_order' => 4],

            // Volume
            ['code' => 'liter','name' => 'Liter',         'abbreviation' => 'L',   'dimension_type' => 'volume',  'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 10],
            ['code' => 'ml',   'name' => 'Mililiter',     'abbreviation' => 'mL',  'dimension_type' => 'volume',  'base_unit_code' => 'liter','base_factor' => 0.001,    'sort_order' => 11],
            ['code' => 'sdm',  'name' => 'Sendok Makan',  'abbreviation' => 'sdm', 'dimension_type' => 'volume',  'base_unit_code' => 'liter','base_factor' => 0.015,    'sort_order' => 12],
            ['code' => 'sdt',  'name' => 'Sendok Teh',    'abbreviation' => 'sdt', 'dimension_type' => 'volume',  'base_unit_code' => 'liter','base_factor' => 0.005,    'sort_order' => 13],
            ['code' => 'gelas','name' => 'Gelas',         'abbreviation' => 'gls', 'dimension_type' => 'volume',  'base_unit_code' => 'liter','base_factor' => 0.24,     'sort_order' => 14],
            ['code' => 'cangkir','name' => 'Cangkir',     'abbreviation' => 'cgk', 'dimension_type' => 'volume',  'base_unit_code' => 'liter','base_factor' => 0.237,    'sort_order' => 15],

            // Jumlah/Satuan
            ['code' => 'pcs',  'name' => 'Pieces',        'abbreviation' => 'pcs', 'dimension_type' => 'jumlah',  'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 20],
            ['code' => 'unit', 'name' => 'Unit',          'abbreviation' => 'unit','dimension_type' => 'jumlah',  'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 21],
            ['code' => 'buah', 'name' => 'Buah',          'abbreviation' => 'bh',  'dimension_type' => 'jumlah',  'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 22],
            ['code' => 'botol','name' => 'Botol',         'abbreviation' => 'btl', 'dimension_type' => 'jumlah',  'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 23],
            ['code' => 'bungkus','name' => 'Bungkus',     'abbreviation' => 'bks', 'dimension_type' => 'jumlah',  'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 24],
            ['code' => 'sachet','name' => 'Sachet',       'abbreviation' => 'sch', 'dimension_type' => 'jumlah',  'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 25],
            ['code' => 'kaleng','name' => 'Kaleng',       'abbreviation' => 'klg', 'dimension_type' => 'jumlah',  'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 26],
            ['code' => 'box',  'name' => 'Box / Kardus',  'abbreviation' => 'box', 'dimension_type' => 'jumlah',  'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 27],
            ['code' => 'lusin','name' => 'Lusin',         'abbreviation' => 'lsn', 'dimension_type' => 'jumlah',  'base_unit_code' => 'pcs', 'base_factor' => 12,        'sort_order' => 28],
            ['code' => 'kodi', 'name' => 'Kodi',          'abbreviation' => 'kdi', 'dimension_type' => 'jumlah',  'base_unit_code' => 'pcs', 'base_factor' => 20,        'sort_order' => 29],
            ['code' => 'lembar','name' => 'Lembar',       'abbreviation' => 'lbr', 'dimension_type' => 'jumlah',  'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 30],
            ['code' => 'porsi','name' => 'Porsi',         'abbreviation' => 'prs', 'dimension_type' => 'jumlah',  'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 31],

            // Panjang
            ['code' => 'cm',   'name' => 'Sentimeter',    'abbreviation' => 'cm',  'dimension_type' => 'panjang', 'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 40],
            ['code' => 'meter','name' => 'Meter',         'abbreviation' => 'm',   'dimension_type' => 'panjang', 'base_unit_code' => null,  'base_factor' => null,      'sort_order' => 41],
        ];

        foreach ($units as $unit) {
            DB::table('master_uom')->upsert(
                array_merge($unit, ['id' => Str::ulid(), 'is_active' => true]),
                ['code'],
                ['name', 'abbreviation', 'dimension_type', 'base_unit_code', 'base_factor', 'sort_order', 'is_active']
            );
        }
    }
}
