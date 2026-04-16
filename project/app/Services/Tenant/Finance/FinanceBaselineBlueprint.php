<?php

namespace App\Services\Tenant\Finance;

use App\Models\Tenant\TenantMember;
use Illuminate\Support\Str;

class FinanceBaselineBlueprint
{
    public const PRIVATE_ACCOUNT_SCOPE = 'private';
    public const SHARED_ACCOUNT_SCOPE = 'shared';
    public const DEFAULT_ACCOUNT_TYPE = 'cash';
    public const PRIVATE_ACCOUNT_NOTES = '[system-baseline-private]';
    public const SHARED_ACCOUNT_NOTES = '[system-baseline-shared]';

    public function privateAccountName(TenantMember $member): string
    {
        $firstName = Str::of((string) $member->full_name)
            ->trim()
            ->before(' ')
            ->value();

        return trim('Kas ' . ($firstName !== '' ? $firstName : 'Member'));
    }

    public function sharedAccountName(): string
    {
        return 'Kas Keluarga';
    }
}
