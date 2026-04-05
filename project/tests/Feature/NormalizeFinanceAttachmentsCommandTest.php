<?php

namespace Tests\Feature;

use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantAttachment;
use App\Models\TenantBankAccount;
use App\Models\TenantCurrency;
use App\Models\TenantMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NormalizeFinanceAttachmentsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_normalizes_legacy_finance_attachment_and_optimizes_large_image(): void
    {
        Storage::fake(config('filesystems.default', 'local'));
        \Illuminate\Support\Facades\Gate::before(fn () => true);

        $owner = User::factory()->create();
        $tenant = Tenant::factory()->create([
            'slug' => 'normalize-finance',
            'owner_user_id' => $owner->id,
        ]);

        $ownerMembership = TenantMember::create([
            'tenant_id' => $tenant->id,
            'user_id' => $owner->id,
            'full_name' => 'Owner Name',
            'role_code' => 'owner',
            'profile_status' => 'active',
        ]);

        $currency = TenantCurrency::create([
            'tenant_id' => $tenant->id,
            'code' => 'IDR',
            'name' => 'Indonesian Rupiah',
            'symbol' => 'Rp',
            'symbol_position' => 'before',
            'decimal_places' => 0,
            'exchange_rate' => 1.0,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $account = TenantBankAccount::create([
            'tenant_id' => $tenant->id,
            'owner_member_id' => $ownerMembership->id,
            'name' => 'Test Cash',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 1000000,
            'current_balance' => 1000000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $tenant->id,
            'created_by' => $ownerMembership->id,
            'owner_member_id' => $ownerMembership->id,
            'currency_id' => $currency->id,
            'bank_account_id' => $account->id,
        ]);

        $legacyPath = sprintf('finance/attachments/transactions/%s/legacy-image.jpg', $transaction->id);
        Storage::put($legacyPath, $this->makeJpegBytes());

        $attachment = TenantAttachment::create([
            'tenant_id' => $tenant->id,
            'attachable_type' => FinanceTransaction::class,
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'legacy-image.jpg',
            'file_path' => $legacyPath,
            'mime_type' => 'image/jpeg',
            'file_size' => 250000,
            'sort_order' => 1,
            'row_version' => 1,
        ]);

        Artisan::call('finance:attachments:normalize');

        $attachment->refresh();

        $this->assertSame('finance_transaction', $attachment->attachable_type);
        $this->assertSame('image/webp', $attachment->mime_type);
        $this->assertStringEndsWith('.webp', (string) $attachment->file_name);
        $this->assertStringStartsWith(
            sprintf('tenants/%d/finance/attachments/transactions/%s/', $tenant->id, $transaction->id),
            (string) $attachment->file_path
        );
        $this->assertLessThanOrEqual(100 * 1024, (int) $attachment->file_size);
        Storage::assertMissing($legacyPath);
        Storage::assertExists((string) $attachment->file_path);
    }

    private function makeJpegBytes(): string
    {
        $image = imagecreatetruecolor(64, 64);
        $background = imagecolorallocate($image, 240, 240, 240);
        imagefill($image, 0, 0, $background);

        ob_start();
        imagejpeg($image, null, 85);
        $bytes = (string) ob_get_clean();
        imagedestroy($image);

        return $bytes;
    }
}
