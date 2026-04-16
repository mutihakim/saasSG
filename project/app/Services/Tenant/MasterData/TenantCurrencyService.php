<?php

namespace App\Services\Tenant\MasterData;

use App\Models\Master\TenantCurrency;
use App\Models\Tenant\Tenant;
use Database\Seeders\Support\Master\CurrencyBlueprint;

class TenantCurrencyService
{
    public function ensureCurrencies(Tenant $tenant): void
    {
        foreach (CurrencyBlueprint::defaultCurrencies() as $currency) {
            TenantCurrency::query()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'code' => $currency['code'],
                ],
                [
                    'name' => $currency['name'],
                    'symbol' => $currency['symbol'],
                    'symbol_position' => $currency['symbol_position'],
                    'decimal_places' => $currency['decimal_places'],
                    'thousands_sep' => $currency['thousands_sep'],
                    'decimal_sep' => $currency['decimal_sep'],
                    'is_active' => true,
                    'sort_order' => $currency['sort_order'],
                    'row_version' => 1,
                ]
            );
        }
    }
}
