<?php

namespace Database\Seeders\Support\Master;

class TagBlueprint
{
    public static function defaultTags(): array
    {
        return [
            ['name' => 'Harian', 'color' => '#0AB39C'],
            ['name' => 'Bulanan', 'color' => '#405189'],
            ['name' => 'Tahunan', 'color' => '#F7B84B'],
            ['name' => 'Personal', 'color' => '#6559CC'],
            ['name' => 'Keluarga', 'color' => '#299CDB'],
            ['name' => 'Anak', 'color' => '#FF6C8A'],
            ['name' => 'Bisnis', 'color' => '#F06548'],
            ['name' => 'Darurat', 'color' => '#6C757D'],
            ['name' => 'Transfer', 'color' => '#0DCAF0'],
        ];
    }
}
