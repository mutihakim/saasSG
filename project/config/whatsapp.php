<?php

return [
    'enabled' => env('WHATSAPP_MODULE_ENABLED', true),
    'service_enabled' => env('WHATSAPP_SERVICE_ENABLED', false),
    'dispatch_async' => env('WHATSAPP_DISPATCH_ASYNC', true),
    'service_url' => env('WHATSAPP_SERVICE_URL', 'http://127.0.0.1:3010'),
    'service_timeout' => (int) env('WHATSAPP_SERVICE_TIMEOUT', 5),
    'internal_token' => env('WHATSAPP_INTERNAL_TOKEN', ''),
    'auth_dir' => env('WA_AUTH_DIR', storage_path('app/whatsapp-auth')),
    'connecting_timeout_ms' => (int) env('WHATSAPP_CONNECTING_TIMEOUT_MS', 60000),
    'connecting_stale_grace_ms' => (int) env('WHATSAPP_CONNECTING_STALE_GRACE_MS', 15000),
    'auto_command' => [
        'enabled' => env('WHATSAPP_AUTO_COMMAND_ENABLED', true),
        'prefixes' => ['/', '!'],
        'commands' => [
            'ping' => [
                'description' => [
                    'en' => 'Check if bot is alive.',
                    'id' => 'Cek apakah bot aktif.',
                ],
                'response' => [
                    'en' => 'Pong! WhatsApp bot is active.',
                    'id' => 'Pong! Bot WhatsApp aktif.',
                ],
            ],
            'help' => [
                'description' => [
                    'en' => 'Show command list.',
                    'id' => 'Tampilkan daftar command.',
                ],
            ],
        ],
    ],
    'finance' => [
        'enabled' => env('WHATSAPP_FINANCE_ENABLED', true),
        'wait_window_seconds' => (int) env('WHATSAPP_FINANCE_WAIT_WINDOW_SECONDS', 120),
        'intent_ttl_minutes' => (int) env('WHATSAPP_FINANCE_INTENT_TTL_MINUTES', 60),
        'ai_driver' => env('WHATSAPP_FINANCE_AI_DRIVER', 'openrouter'),
        'openrouter_api_key' => env('OPENROUTER_API_KEY'),
        'openrouter_model' => env('WHATSAPP_FINANCE_OPENROUTER_MODEL', 'qwen/qwen3.6-plus:free'),
        'openrouter_base_url' => env('WHATSAPP_FINANCE_OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
        'openrouter_timeout_seconds' => (int) env('WHATSAPP_FINANCE_OPENROUTER_TIMEOUT_SECONDS', 60),
        'openrouter_max_tokens' => (int) env('WHATSAPP_FINANCE_OPENROUTER_MAX_TOKENS', 1200),
        'gemini_api_key' => env('GEMINI_API_KEY'),
        'gemini_model' => env('WHATSAPP_FINANCE_GEMINI_MODEL', 'gemini-2.5-flash'),
        'groq_api_key' => env('GROQ_API_KEY'),
        'groq_model_single' => env('WHATSAPP_FINANCE_GROQ_MODEL_SINGLE', 'llama-3.1-8b-instant'),
        'groq_model_bulk' => env('WHATSAPP_FINANCE_GROQ_MODEL_BULK', 'llama-3.1-8b-instant'),
        'groq_vision_model' => env('WHATSAPP_FINANCE_GROQ_VISION_MODEL', 'meta-llama/llama-4-scout-17b-16e-instruct'),
        'groq_base_url' => env('WHATSAPP_FINANCE_GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
        'groq_timeout_seconds' => (int) env('WHATSAPP_FINANCE_GROQ_TIMEOUT_SECONDS', 30),
        'groq_max_tokens' => (int) env('WHATSAPP_FINANCE_GROQ_MAX_TOKENS', 1200),
        'app_url_template' => env('WHATSAPP_FINANCE_APP_URL_TEMPLATE', 'https://{tenant}.sanjo.my.id/finance'),
    ],
];
