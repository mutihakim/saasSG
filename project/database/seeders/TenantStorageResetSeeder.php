<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class TenantStorageResetSeeder extends Seeder
{
    public function run(): void
    {
        Storage::disk('local')->deleteDirectory('tenants');
        Storage::disk('local')->deleteDirectory('finance');
        Storage::disk('local')->deleteDirectory('whatsapp-auth');
        Storage::disk('public')->deleteDirectory('tenants');

        $serviceWhatsappRoot = base_path('../services/whatsapp');

        foreach ([
            $serviceWhatsappRoot . '/wa-auth',
            $serviceWhatsappRoot . '/.wwebjs_cache',
        ] as $path) {
            if (File::isDirectory($path)) {
                File::deleteDirectory($path);
            }
        }
    }
}
