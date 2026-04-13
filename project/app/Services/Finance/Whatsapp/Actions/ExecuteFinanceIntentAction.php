<?php

namespace App\Services\Finance\Whatsapp\Actions;

use App\Exceptions\WhatsappIntentExtractionException;
use App\Models\Whatsapp\TenantWhatsappIntent;
use App\Services\Finance\Whatsapp\Managers\WhatsappReplyManager;
use App\Services\WhatsappAiExtractionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExecuteFinanceIntentAction
{
    public function __construct(
        private readonly WhatsappAiExtractionService $extractor,
        private readonly WhatsappReplyManager $replyManager,
    ) {}

    public function handle(TenantWhatsappIntent $intent): void
    {
        $tenant = $intent->tenant;
        $member = $intent->member;
        if (! $tenant || ! $member) {
            Log::error('whatsapp.finance.intent.execution_failed_missing_relations', [
                'intent_id' => $intent->id,
                'tenant_id' => $intent->tenant_id,
                'member_id' => $intent->member_id,
            ]);
            $intent->forceFill(['status' => 'failed'])->save();

            return;
        }

        $rawInput = is_array($intent->raw_input) ? $intent->raw_input : [];
        $text = (string) ($rawInput['text'] ?? '');
        $media = $intent->media;

        try {
            $result = $this->extractor->extract($tenant, $member, $intent->command, $text, $media);
        } catch (WhatsappIntentExtractionException $exception) {
            $intent->forceFill([
                'status' => 'failed',
                'error_payload' => $exception->debugPayload(),
            ])->save();

            Log::warning('whatsapp.finance.intent.failed', [
                'tenant_id' => $tenant->id,
                'intent_id' => $intent->id,
                'command' => $intent->command,
                'sender_jid' => $intent->sender_jid,
                'error_payload' => $exception->debugPayload(),
            ]);

            $this->replyManager->sendReply($tenant, $intent->sender_jid, $exception->userMessage());

            return;
        }

        DB::transaction(function () use ($intent, $result) {
            $intent->fill([
                'status' => 'parsed',
                'ai_provider' => $result['provider'] ?? null,
                'ai_model' => $result['model'] ?? null,
                'confidence_score' => $result['confidence_score'] ?? null,
                'processing_time_ms' => $result['processing_time_ms'] ?? null,
                'extracted_payload' => $result['payload'] ?? null,
                'ai_raw_response' => $result['raw_response'] ?? null,
                'error_payload' => null,
            ])->save();

            $intent->items()->delete();

            if ($intent->command === 'bulk') {
                foreach (($result['items'] ?? []) as $item) {
                    $intent->items()->create([
                        'sort_order' => (int) ($item['sort_order'] ?? 0),
                        'description' => $item['description'] ?? null,
                        'amount' => $item['amount'] ?? null,
                        'currency_code' => $item['currency_code'] ?? null,
                        'payload' => $item['payload'] ?? null,
                    ]);
                }
            }
        });

        Log::info('whatsapp.finance.intent.parsed', [
            'tenant_id' => $tenant->id,
            'intent_id' => $intent->id,
            'command' => $intent->command,
            'sender_jid' => $intent->sender_jid,
            'confidence_score' => $intent->confidence_score,
        ]);

        $reviewUrl = $this->replyManager->buildReviewUrl($tenant, $intent);
        $summary = $intent->command === 'bulk'
            ? 'Draft belanja berhasil dibuat.'
            : 'Draft transaksi berhasil dibuat.';

        $this->replyManager->sendReply($tenant, $intent->sender_jid, $summary."\nReview di aplikasi: {$reviewUrl}");
    }
}
