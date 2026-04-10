<?php

namespace App\Jobs;

use App\Services\WhatsappServiceClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use RuntimeException;

class WhatsappDispatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public array $backoff = [10, 30, 60, 120, 300];

    public function __construct(
        public readonly int $tenantId,
        public readonly string $to,
        public readonly string $message,
        public readonly ?string $notificationKey = null,
    ) {
    }

    public function handle(WhatsappServiceClient $serviceClient): void
    {
        if (! $serviceClient->isEnabled()) {
            return;
        }

        $response = $serviceClient->sendMessage(
            tenantId: $this->tenantId,
            to: $this->to,
            message: $this->message,
            notificationKey: $this->notificationKey,
        );

        if (! ($response['ok'] ?? false)) {
            $status = (int) ($response['status'] ?? 503);
            $code = (string) ($response['code'] ?? 'REQUEST_FAILED');
            throw new RuntimeException("WhatsApp dispatch failed [{$status}] {$code}");
        }
    }
}
