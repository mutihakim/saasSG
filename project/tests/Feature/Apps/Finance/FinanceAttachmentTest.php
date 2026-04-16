<?php

namespace Tests\Feature\Apps\Finance;

use App\Jobs\ProcessFinanceAttachmentImage;
use App\Models\Finance\FinanceTransaction;
use App\Models\Master\TenantCurrency;
use App\Models\Tenant\Tenant;
use App\Models\Misc\TenantAttachment;
use App\Models\Identity\User;
use App\Models\Tenant\TenantMember;
use App\Models\Master\TenantBankAccount;
use App\Services\Finance\FinanceAttachmentService;
use App\Services\Finance\Wallet\FinanceWalletService;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class FinanceAttachmentTest extends TestCase
{
    protected $tenant;
    protected $owner;
    protected $ownerMembership;
    protected $account;
    protected $mainPocket;

    protected function setUp(): void
    {
        parent::setUp();

        \Illuminate\Support\Facades\Gate::before(fn () => true);

        $this->owner = User::factory()->create();
        $this->tenant = Tenant::factory()->create([
            'slug'          => 'attach-test',
            'owner_user_id' => $this->owner->id,
            'plan_code'     => 'pro',
            'currency_code' => 'IDR',
        ]);

        $this->ownerMembership = TenantMember::create([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'full_name'      => 'Owner Name',
            'role_code'      => 'owner',
            'profile_status' => 'active',
        ]);

        TenantCurrency::create([
            'tenant_id'     => $this->tenant->id,
            'code'          => 'IDR',
            'name'          => 'Indonesian Rupiah',
            'symbol'        => 'Rp',
            'symbol_position' => 'before',
            'decimal_places'  => 0,
            'exchange_rate'   => 1.0,
            'is_active'     => true,
            'sort_order'    => 1,
        ]);

        $this->account = TenantBankAccount::create([
            'tenant_id' => $this->tenant->id,
            'owner_member_id' => $this->ownerMembership->id,
            'name' => 'Test Cash',
            'scope' => 'private',
            'type' => 'cash',
            'currency_code' => 'IDR',
            'opening_balance' => 1000000,
            'current_balance' => 1000000,
            'is_active' => true,
            'row_version' => 1,
        ]);

        $this->account->memberAccess()->syncWithoutDetaching([
            $this->ownerMembership->id => ['can_view' => true, 'can_use' => true, 'can_manage' => true],
        ]);

        $this->mainPocket = app(FinanceWalletService::class)->ensureMainPocket($this->account);

        foreach (['finance.view', 'finance.create', 'finance.update', 'finance.delete'] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);
        $this->owner->givePermissionTo(['finance.view', 'finance.create', 'finance.update', 'finance.delete']);
    }

    public function test_can_preview_attachment_with_morph_alias(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $path = sprintf('tenants/%d/finance/attachments/transactions/%s/receipt.webp', $this->tenant->id, $transaction->id);
        Storage::put($path, 'image-bytes');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'receipt.webp',
            'file_path' => $path,
            'mime_type' => 'image/webp',
            'file_size' => strlen('image-bytes'),
            'sort_order' => 1,
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->get("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments/{$attachment->id}/preview");

        $response->assertOk();
        $response->assertStreamed();
        $response->assertHeader('Content-Type', 'image/webp');
        $response->assertStreamedContent('image-bytes');
    }

    public function test_can_preview_attachment_with_legacy_storage_path(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $legacyPath = sprintf('finance/attachments/transactions/%s/legacy.jpg', $transaction->id);
        Storage::put($legacyPath, 'legacy-image');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'legacy.jpg',
            'file_path' => $legacyPath,
            'mime_type' => 'image/jpeg',
            'file_size' => strlen('legacy-image'),
            'sort_order' => 1,
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->get("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments/{$attachment->id}/preview");

        $response->assertOk();
        $response->assertStreamed();
        $response->assertHeader('Content-Type', 'image/jpeg');
        $response->assertStreamedContent('legacy-image');
    }

    public function test_can_preview_attachment_with_stale_path_when_basename_matches_final_path(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $path = sprintf('tenants/%d/finance/attachments/transactions/%s/receipt.webp', $this->tenant->id, $transaction->id);
        Storage::put($path, 'final-image');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'receipt.webp',
            'file_path' => 'stale/path/receipt.webp',
            'mime_type' => 'image/webp',
            'file_size' => strlen('final-image'),
            'sort_order' => 1,
            'row_version' => 1,
            'status' => 'ready',
            'processed_at' => now(),
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->get("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments/{$attachment->id}/preview");

        $response->assertOk();
        $response->assertStreamed();
        $response->assertStreamedContent('final-image');
    }

    public function test_preview_attachment_returns_conflict_while_processing(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $path = sprintf('tenants/%d/finance/attachments/transactions/%s/staging/source.jpg', $this->tenant->id, $transaction->id);
        Storage::put($path, 'raw-image');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'receipt.jpg',
            'file_path' => $path,
            'mime_type' => 'image/jpeg',
            'file_size' => strlen('raw-image'),
            'sort_order' => 1,
            'row_version' => 1,
            'status' => 'processing',
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments/{$attachment->id}/preview");

        $response->assertStatus(409);
    }

    public function test_upload_image_attachment_creates_processing_record_and_dispatches_job(): void
    {
        Queue::fake();
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $file = UploadedFile::fake()->image('receipt.jpg', 1600, 1200);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->post("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments", [
                'attachments' => [$file],
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.attachments.0.status', 'processing');
        $response->assertJsonPath('data.attachments.0.preview_url', null);
        $response->assertJsonPath('data.background_processing_warning', true);

        $attachment = TenantAttachment::query()->latest('id')->first();

        $this->assertNotNull($attachment);
        $this->assertSame('processing', $attachment->status);
        $this->assertStringContainsString('/staging/', (string) $attachment->file_path);
        $this->assertTrue(Storage::exists((string) $attachment->file_path));

        Queue::assertPushed(ProcessFinanceAttachmentImage::class, function (ProcessFinanceAttachmentImage $job) use ($attachment) {
            return $job->attachmentId === (int) $attachment->id
                && $job->connection === 'redis'
                && $job->queue === 'finance-media';
        });
    }

    public function test_upload_attachment_returns_operational_error_when_async_schema_is_missing(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        Schema::table('tenant_attachments', function ($table) {
            $table->dropIndex('tenant_attachments_tenant_id_status_index');
            $table->dropColumn(['status', 'processing_error', 'processed_at']);
        });

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $file = UploadedFile::fake()->image('receipt.jpg', 1600, 1200);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->post("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments", [
                'attachments' => [$file],
            ]);

        $response->assertStatus(503);
        $response->assertJsonPath('ok', false);
        $response->assertJsonPath('message', 'Attachment async schema is not ready. Run the latest tenant_attachments migration first.');
        $this->assertSame([], Storage::allFiles(sprintf('tenants/%d/finance/attachments/transactions/%s', $this->tenant->id, $transaction->id)));
    }

    public function test_process_finance_attachment_image_job_finalizes_image(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $file = UploadedFile::fake()->image('receipt.jpg', 1600, 1200);
        $stagingPath = sprintf('tenants/%d/finance/attachments/transactions/%s/staging/source.jpg', $this->tenant->id, $transaction->id);
        Storage::put($stagingPath, file_get_contents($file->getRealPath()));

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'receipt.jpg',
            'file_path' => $stagingPath,
            'mime_type' => 'image/jpeg',
            'file_size' => (int) $file->getSize(),
            'sort_order' => 1,
            'row_version' => 1,
            'status' => 'processing',
        ]);

        $job = new ProcessFinanceAttachmentImage((int) $attachment->id);
        $job->handle(app(FinanceAttachmentService::class));

        $attachment->refresh();

        $this->assertSame('ready', $attachment->status);
        $this->assertSame('image/webp', $attachment->mime_type);
        $this->assertStringEndsWith('.webp', (string) $attachment->file_name);
        $this->assertStringNotContainsString('/staging/', (string) $attachment->file_path);
        $this->assertNotNull($attachment->processed_at);
        $this->assertTrue(Storage::exists((string) $attachment->file_path));
        $this->assertFalse(Storage::exists($stagingPath));
    }

    public function test_process_finance_attachment_image_job_marks_failed_when_image_is_invalid(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $stagingPath = sprintf('tenants/%d/finance/attachments/transactions/%s/staging/broken.jpg', $this->tenant->id, $transaction->id);
        Storage::put($stagingPath, 'not-a-real-image');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $transaction->id,
            'file_name' => 'broken.jpg',
            'file_path' => $stagingPath,
            'mime_type' => 'image/jpeg',
            'file_size' => strlen('not-a-real-image'),
            'sort_order' => 1,
            'row_version' => 1,
            'status' => 'processing',
        ]);

        $job = new ProcessFinanceAttachmentImage((int) $attachment->id);
        $job->handle(app(FinanceAttachmentService::class));

        $attachment->refresh();

        $this->assertSame('failed', $attachment->status);
        $this->assertNotNull($attachment->processing_error);
        $this->assertTrue(Storage::exists($stagingPath));
    }

    public function test_same_original_file_name_across_transactions_keeps_unique_storage_paths(): void
    {
        Queue::fake();
        Storage::fake(config('filesystems.default', 'local'));

        $firstTransaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $secondTransaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $firstFile = UploadedFile::fake()->image('rk3326s vs t100.png', 1600, 1200);
        $secondFile = UploadedFile::fake()->image('rk3326s vs t100.png', 1600, 1200);

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->post("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$firstTransaction->id}/attachments", [
                'attachments' => [$firstFile],
            ])
            ->assertCreated();

        $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->post("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$secondTransaction->id}/attachments", [
                'attachments' => [$secondFile],
            ])
            ->assertCreated();

        $attachments = TenantAttachment::query()->orderBy('id')->get();

        $this->assertCount(2, $attachments);
        $this->assertSame('rk3326s vs t100.png', $attachments[0]->file_name);
        $this->assertSame('rk3326s vs t100.png', $attachments[1]->file_name);
        $this->assertNotSame($attachments[0]->file_path, $attachments[1]->file_path);
        $this->assertStringContainsString((string) $firstTransaction->id, (string) $attachments[0]->file_path);
        $this->assertStringContainsString((string) $secondTransaction->id, (string) $attachments[1]->file_path);
    }

    public function test_preview_attachment_returns_not_found_for_attachment_from_other_transaction(): void
    {
        Storage::fake(config('filesystems.default', 'local'));

        $transaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $otherTransaction = FinanceTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->ownerMembership->id,
            'owner_member_id' => $this->ownerMembership->id,
            'currency_id' => TenantCurrency::where('tenant_id', $this->tenant->id)->first()->id,
            'bank_account_id' => $this->account->id,
        ]);

        $path = sprintf('tenants/%d/finance/attachments/transactions/%s/other.webp', $this->tenant->id, $otherTransaction->id);
        Storage::put($path, 'other-image');

        $attachment = TenantAttachment::create([
            'tenant_id' => $this->tenant->id,
            'attachable_type' => 'finance_transaction',
            'attachable_id' => (string) $otherTransaction->id,
            'file_name' => 'other.webp',
            'file_path' => $path,
            'mime_type' => 'image/webp',
            'file_size' => strlen('other-image'),
            'sort_order' => 1,
            'row_version' => 1,
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions/{$transaction->id}/attachments/{$attachment->id}/preview");

        $response->assertNotFound();
    }
}
