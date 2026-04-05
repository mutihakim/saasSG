<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantCategory;
use App\Models\TenantMember;
use App\Models\TenantWhatsappIntent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WhatsappFinanceIntentTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $owner;
    private User $memberUser;
    private User $otherUser;
    private TenantMember $ownerMember;
    private TenantMember $member;
    private TenantMember $otherMember;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('broadcasting.default', 'log');
        config()->set('whatsapp.enabled', true);
        config()->set('whatsapp.finance.enabled', true);
        config()->set('whatsapp.internal_token', 'internal-secret');
        config()->set('whatsapp.finance.ai_driver', 'fallback');

        $this->owner = User::factory()->create();
        $this->memberUser = User::factory()->create();
        $this->otherUser = User::factory()->create();

        $this->tenant = Tenant::factory()->create([
            'slug' => 'wa-finance',
            'owner_user_id' => $this->owner->id,
            'currency_code' => 'IDR',
            'locale' => 'id',
        ]);

        $this->ownerMember = TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->owner->id,
            'full_name' => 'Owner WA',
            'role_code' => 'owner',
            'profile_status' => 'active',
            'whatsapp_jid' => '628111111111@c.us',
        ]);

        $this->member = TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->memberUser->id,
            'full_name' => 'Member WA',
            'role_code' => 'member',
            'profile_status' => 'active',
            'whatsapp_jid' => '628222222222@c.us',
        ]);

        $this->otherMember = TenantMember::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->otherUser->id,
            'full_name' => 'Other Member',
            'role_code' => 'member',
            'profile_status' => 'active',
            'whatsapp_jid' => '628333333333@c.us',
        ]);
    }

    public function test_structured_tx_command_creates_finance_intent_without_ai(): void
    {
        $response = $this->postJson('/internal/v1/whatsapp/messages', [
            'tenant_id' => $this->tenant->id,
            'direction' => 'incoming',
            'whatsapp_message_id' => 'wamid-1',
            'sender_jid' => '628222222222@c.us',
            'recipient_jid' => '628111111111@c.us',
            'payload' => ['text' => '/tx kopi susu#25000'],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('tenant_whatsapp_intents', [
            'tenant_id' => $this->tenant->id,
            'member_id' => $this->member->id,
            'sender_jid' => '628222222222@c.us',
            'command' => 'tx',
            'intent_type' => 'single_transaction',
            'status' => 'parsed',
        ]);
        $this->assertDatabaseHas('tenant_whatsapp_messages', [
            'tenant_id' => $this->tenant->id,
            'direction' => 'outgoing',
            'recipient_jid' => '628222222222@c.us',
        ]);

        $intent = TenantWhatsappIntent::query()
            ->where('tenant_id', $this->tenant->id)
            ->where('sender_jid', '628222222222@c.us')
            ->latest('id')
            ->first();

        $this->assertNotNull($intent);
        $this->assertIsArray($intent->ai_raw_response);
        $this->assertSame('structured', data_get($intent->ai_raw_response, 'driver'));
        $this->assertSame('kopi susu', data_get($intent->extracted_payload, 'description'));
        $this->assertSame(25000, data_get($intent->extracted_payload, 'amount'));
    }

    public function test_unknown_sender_is_rejected_without_creating_intent(): void
    {
        $response = $this->postJson('/internal/v1/whatsapp/messages', [
            'tenant_id' => $this->tenant->id,
            'direction' => 'incoming',
            'whatsapp_message_id' => 'wamid-2',
            'sender_jid' => '628999999999@c.us',
            'recipient_jid' => '628111111111@c.us',
            'payload' => ['text' => '/tx kopi 25rb'],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk();
        $this->assertDatabaseMissing('tenant_whatsapp_intents', [
            'tenant_id' => $this->tenant->id,
            'sender_jid' => '628999999999@c.us',
        ]);
        $this->assertDatabaseHas('tenant_whatsapp_messages', [
            'tenant_id' => $this->tenant->id,
            'direction' => 'outgoing',
            'recipient_jid' => '628999999999@c.us',
        ]);
    }

    public function test_structured_bulk_command_stores_debug_payload_for_review(): void
    {
        $response = $this->postJson('/internal/v1/whatsapp/messages', [
            'tenant_id' => $this->tenant->id,
            'direction' => 'incoming',
            'whatsapp_message_id' => 'wamid-bulk-1',
            'sender_jid' => '628222222222@c.us',
            'recipient_jid' => '628111111111@c.us',
            'payload' => ['text' => '/bulk telur#10000, susu#20000'],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk();

        $intent = TenantWhatsappIntent::query()
            ->where('tenant_id', $this->tenant->id)
            ->where('command', 'bulk')
            ->latest('id')
            ->first();

        $this->assertNotNull($intent);
        $this->assertIsArray($intent->ai_raw_response);
        $this->assertSame('structured', data_get($intent->ai_raw_response, 'driver'));
        $this->assertIsArray(data_get($intent->ai_raw_response, 'normalization.items'));
    }

    public function test_natural_language_tx_fails_when_openrouter_is_unavailable(): void
    {
        config()->set('whatsapp.finance.ai_driver', 'openrouter');
        config()->set('whatsapp.finance.openrouter_api_key', 'fake-key');

        Http::fake([
            'https://openrouter.ai/api/v1/chat/completions' => Http::response([
                'error' => [
                    'code' => 429,
                    'message' => 'Quota exceeded.',
                ],
            ], 429),
        ]);

        $response = $this->postJson('/internal/v1/whatsapp/messages', [
            'tenant_id' => $this->tenant->id,
            'direction' => 'incoming',
            'whatsapp_message_id' => 'wamid-1b',
            'sender_jid' => '628222222222@c.us',
            'recipient_jid' => '628111111111@c.us',
            'payload' => ['text' => '/tx nasi goreng 3 porsi total harga 42000'],
        ], [
            'X-Internal-Token' => 'internal-secret',
        ]);

        $response->assertOk();

        $intent = TenantWhatsappIntent::query()
            ->where('tenant_id', $this->tenant->id)
            ->where('sender_jid', '628222222222@c.us')
            ->latest('id')
            ->first();

        $this->assertNotNull($intent);
        $this->assertSame('failed', $intent->status);
        $this->assertNotNull($intent->error_payload);
        $this->assertSame('ai_request_failed', data_get($intent->error_payload, 'reason'));
        $this->assertSame('openrouter', data_get($intent->error_payload, 'driver'));
        $this->assertNull($intent->extracted_payload);

        $latestOutgoing = \App\Models\TenantWhatsappMessage::query()
            ->where('tenant_id', $this->tenant->id)
            ->where('direction', 'outgoing')
            ->where('recipient_jid', '628222222222@c.us')
            ->latest('id')
            ->first();

        $this->assertNotNull($latestOutgoing);
        $this->assertStringNotContainsString('/finance?source=wa', (string) data_get($latestOutgoing->payload, 'text', ''));
    }

    public function test_member_can_open_own_whatsapp_finance_intent_but_other_member_cannot(): void
    {
        $intent = TenantWhatsappIntent::query()->create([
            'tenant_id' => $this->tenant->id,
            'member_id' => $this->member->id,
            'sender_jid' => $this->member->whatsapp_jid,
            'token' => 'intent-token-1',
            'command' => 'tx',
            'intent_type' => 'single_transaction',
            'status' => 'parsed',
            'raw_input' => ['text' => '/tx makan 10rb'],
            'extracted_payload' => ['amount' => 10000, 'type' => 'pengeluaran'],
            'expires_at' => now()->addHour(),
        ]);

        Sanctum::actingAs($this->memberUser);

        $allowed = $this->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/whatsapp-intents/{$intent->token}");

        $allowed->assertOk()
            ->assertJsonPath('data.intent.id', $intent->id);

        $this->assertNotNull($intent->fresh()->app_opened_at);

        Sanctum::actingAs($this->otherUser);
        $forbidden = $this->withHeader('X-Tenant', $this->tenant->slug)
            ->getJson("/api/v1/tenants/{$this->tenant->slug}/finance/whatsapp-intents/{$intent->token}");

        $forbidden->assertForbidden();
    }

    public function test_mark_submitted_sends_single_confirmation_once(): void
    {
        $intent = TenantWhatsappIntent::query()->create([
            'tenant_id' => $this->tenant->id,
            'member_id' => $this->member->id,
            'sender_jid' => $this->member->whatsapp_jid,
            'token' => 'intent-submit-single',
            'command' => 'tx',
            'intent_type' => 'single_transaction',
            'status' => 'parsed',
            'raw_input' => ['text' => '/tx makan 10rb'],
            'extracted_payload' => ['amount' => 10000, 'type' => 'pengeluaran'],
            'expires_at' => now()->addHour(),
        ]);

        Sanctum::actingAs($this->owner);

        $response = $this->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/whatsapp-intents/{$intent->token}/submitted", [
                'linked_resource_type' => 'finance_transaction',
                'linked_resource_id' => 123,
                'submitted_count' => 1,
            ]);

        $response->assertOk();

        $intent->refresh();
        $this->assertSame('submitted', $intent->status);
        $this->assertSame('finance_transaction', $intent->linked_resource_type);
        $this->assertSame(123, $intent->linked_resource_id);

        $this->assertDatabaseHas('tenant_whatsapp_messages', [
            'tenant_id' => $this->tenant->id,
            'direction' => 'outgoing',
            'recipient_jid' => $this->member->whatsapp_jid,
        ]);

        $messageCountAfterFirstSubmit = \App\Models\TenantWhatsappMessage::query()
            ->where('tenant_id', $this->tenant->id)
            ->where('direction', 'outgoing')
            ->where('recipient_jid', $this->member->whatsapp_jid)
            ->count();

        $secondResponse = $this->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/whatsapp-intents/{$intent->token}/submitted", [
                'linked_resource_type' => 'finance_transaction',
                'linked_resource_id' => 123,
                'submitted_count' => 1,
            ]);

        $secondResponse->assertOk();

        $messageCountAfterSecondSubmit = \App\Models\TenantWhatsappMessage::query()
            ->where('tenant_id', $this->tenant->id)
            ->where('direction', 'outgoing')
            ->where('recipient_jid', $this->member->whatsapp_jid)
            ->count();

        $this->assertSame($messageCountAfterFirstSubmit, $messageCountAfterSecondSubmit);
    }

    public function test_mark_submitted_sends_bulk_confirmation_with_count(): void
    {
        $intent = TenantWhatsappIntent::query()->create([
            'tenant_id' => $this->tenant->id,
            'member_id' => $this->member->id,
            'sender_jid' => $this->member->whatsapp_jid,
            'token' => 'intent-submit-bulk',
            'command' => 'bulk',
            'intent_type' => 'bulk_shopping',
            'status' => 'parsed',
            'raw_input' => ['text' => '/bulk belanja mingguan'],
            'extracted_payload' => ['total' => 35000],
            'expires_at' => now()->addHour(),
        ]);

        Sanctum::actingAs($this->owner);

        $response = $this->withHeader('X-Tenant', $this->tenant->slug)
            ->postJson("/api/v1/tenants/{$this->tenant->slug}/finance/whatsapp-intents/{$intent->token}/submitted", [
                'linked_resource_type' => 'finance_transaction_batch',
                'linked_resource_id' => 321,
                'submitted_count' => 3,
            ]);

        $response->assertOk();

        $message = \App\Models\TenantWhatsappMessage::query()
            ->where('tenant_id', $this->tenant->id)
            ->where('direction', 'outgoing')
            ->where('recipient_jid', $this->member->whatsapp_jid)
            ->latest('id')
            ->first();

        $this->assertNotNull($message);
        $this->assertStringContainsString('3 transaksi', (string) data_get($message->payload, 'text', ''));
    }

    public function test_ai_category_mapping_accepts_only_valid_tenant_finance_category_ids(): void
    {
        $expenseCategory = TenantCategory::query()->create([
            'tenant_id' => $this->tenant->id,
            'module' => 'finance',
            'sub_type' => 'pengeluaran',
            'name' => 'Makanan',
            'icon' => 'ri-restaurant-line',
            'color' => 'danger',
            'is_default' => false,
            'is_active' => true,
            'sort_order' => 1,
            'row_version' => 1,
        ]);

        config()->set('whatsapp.finance.ai_driver', 'openrouter');
        config()->set('whatsapp.finance.openrouter_api_key', 'fake-key');
        config()->set('whatsapp.finance.openrouter_model', 'qwen/qwen3.6-plus:free');

        Http::fakeSequence()
            ->push([
                'choices' => [[
                    'message' => [
                        'content' => json_encode([
                            'confidence_score' => 0.92,
                            'type' => 'pengeluaran',
                            'amount' => 25000,
                            'currency_code' => 'IDR',
                            'transaction_date' => now()->toDateString(),
                            'notes' => 'kopi susu',
                            'category_id' => $expenseCategory->id,
                        ]),
                    ],
                ]],
            ])
            ->push([
                'choices' => [[
                    'message' => [
                        'content' => json_encode([
                            'confidence_score' => 0.7,
                            'type' => 'pemasukan',
                            'amount' => 12000,
                            'currency_code' => 'IDR',
                            'transaction_date' => now()->toDateString(),
                            'notes' => 'jajan',
                            'category_id' => $expenseCategory->id,
                        ]),
                    ],
                ]],
            ]);

        $service = app(\App\Services\WhatsappAiExtractionService::class);
        $result = $service->extract($this->tenant, $this->member, 'tx', 'kopi susu 25rb');

        $this->assertSame('openrouter', data_get($result, 'provider'));
        $this->assertSame('qwen/qwen3.6-plus:free', data_get($result, 'model'));
        $this->assertSame($expenseCategory->id, data_get($result, 'payload.category_id'));

        $invalidResult = $service->extract($this->tenant, $this->member, 'tx', 'jajan 12rb');

        $this->assertNull(data_get($invalidResult, 'payload.category_id'));
    }
}
