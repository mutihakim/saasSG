<?php

namespace Database\Seeders\Support\Game;

use Database\Seeders\Support\Game\Blueprints\HewanDarat;
use Database\Seeders\Support\Game\Blueprints\HewanLaut;
use Database\Seeders\Support\Game\Blueprints\HewanUdara;
use Database\Seeders\Support\Game\Blueprints\Kendaraan;
use Database\Seeders\Support\Game\Blueprints\Buahbuahan;
use Database\Seeders\Support\Game\Blueprints\Sayuran;
use Database\Seeders\Support\Game\Blueprints\AnggotaTubuh;
use Database\Seeders\Support\Game\Blueprints\Keluarga;
use Database\Seeders\Support\Game\Blueprints\Pakaian;
use Database\Seeders\Support\Game\Blueprints\BendadiRumah;
use Database\Seeders\Support\Game\Blueprints\KataKerja;
use Database\Seeders\Support\Game\Blueprints\Warna;
use Database\Seeders\Support\Game\Blueprints\Bentuk;
use Database\Seeders\Support\Game\Blueprints\Alam;
use Database\Seeders\Support\Game\Blueprints\Angka;

class VocabularyBlueprint
{
    public static function defaultWords(): array
    {
        return array_merge(
            HewanDarat::defaultWords(),
            HewanLaut::defaultWords(),
            HewanUdara::defaultWords(),
            Kendaraan::defaultWords(),
            Buahbuahan::defaultWords(),
            Sayuran::defaultWords(),
            AnggotaTubuh::defaultWords(),
            Keluarga::defaultWords(),
            Pakaian::defaultWords(),
            BendadiRumah::defaultWords(),
            KataKerja::defaultWords(),
            Warna::defaultWords(),
            Bentuk::defaultWords(),
            Alam::defaultWords(),
            Angka::defaultWords(),
        );
    }
}
