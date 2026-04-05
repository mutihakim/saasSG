<?php

namespace App\Exceptions;

use RuntimeException;

class WhatsappIntentExtractionException extends RuntimeException
{
    public function __construct(
        string $message,
        private readonly string $userMessage,
        private readonly array $debugPayload = [],
    ) {
        parent::__construct($message);
    }

    public function userMessage(): string
    {
        return $this->userMessage;
    }

    public function debugPayload(): array
    {
        return $this->debugPayload;
    }
}
