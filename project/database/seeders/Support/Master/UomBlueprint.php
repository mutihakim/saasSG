<?php

namespace Database\Seeders\Support\Master;

class UomBlueprint
{
    public static function defaultUnits(): array
    {
        return [
            ['code' => 'KG', 'name' => 'Kilogram', 'abbreviation' => 'kg', 'dimension_type' => 'berat'],
            ['code' => 'PCS', 'name' => 'Piece', 'abbreviation' => 'pcs', 'dimension_type' => 'jumlah'],
            ['code' => 'BOX', 'name' => 'Box', 'abbreviation' => 'box', 'dimension_type' => 'jumlah'],
            ['code' => 'LITER', 'name' => 'Liter', 'abbreviation' => 'l', 'dimension_type' => 'volume'],
            ['code' => 'METER', 'name' => 'Meter', 'abbreviation' => 'm', 'dimension_type' => 'panjang'],
        ];
    }
}
