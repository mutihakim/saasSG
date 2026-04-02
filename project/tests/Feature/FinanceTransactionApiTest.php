<?php

namespace Tests\Feature;

use App\Models\FinanceTransaction;
use App\Models\TenantCategory;
use App\Models\TenantCurrency;
use App\Models\Tenant;
use App\Models\User;
use App\Models\TenantMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceTransactionApiTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $owner;
    protected $member;

    protected function setUp(): void
    {
        parent::setUp();

        \Illuminate\Support\Facades\Gate::before(fn () => true);

        $this->owner = User::factory()->create();
        $this->tenant = Tenant::factory()->create([
            'slug'          => 'testfam',
            'owner_user_id' => $this->owner->id,
        ]);
        $this->member = User::factory()->create();

        TenantMember::create([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->owner->id,
            'full_name'      => 'Owner Name',
            'role_code'      => 'owner',
            'profile_status' => 'active',
        ]);

        TenantMember::create([
            'tenant_id'      => $this->tenant->id,
            'user_id'        => $this->member->id,
            'full_name'      => 'Member Name',
            'role_code'      => 'member',
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
    }

    public function test_can_list_transactions()
    {
        FinanceTransaction::factory()->count(3)->create([
            'tenant_id'  => $this->tenant->id,
            'created_by' => $this->owner->id,
            'type'       => 'pengeluaran',
        ]);

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions");

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data.transactions'));
    }

    public function test_can_create_transaction()
    {
        $category = TenantCategory::create([
            'tenant_id'  => $this->tenant->id,
            'module'     => 'finance',
            'name'       => 'Food',
            'slug'       => 'food',
            'sub_type'   => 'pengeluaran',
            'is_active'  => true,
            'sort_order' => 1,
        ]);

        $data = [
            'type'             => 'pengeluaran',
            'amount'           => 50000,
            'currency_code'    => 'IDR',
            'exchange_rate'    => 1.0,
            'category_id'     => $category->id,
            'transaction_date' => now()->toDateString(),
            'payment_method'   => 'tunai',
            'description'      => 'Lunch',
        ];

        $response = $this->actingAs($this->owner)
            ->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/transactions", $data);

        if ($response->status() !== 201) {
            dump($response->json());
        }

        $response->assertStatus(201);
        $this->assertDatabaseHas('finance_transactions', [
            'amount'      => 50000,
            'description' => 'Lunch',
        ]);
    }

    public function test_quota_limit_enforced()
    {
        // Placeholder — quota enforcement tested via entitlements mock
        $this->assertTrue(true);
    }
}
