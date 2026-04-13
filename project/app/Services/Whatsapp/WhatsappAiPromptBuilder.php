<?php

namespace App\Services\Whatsapp;

use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;
use Illuminate\Support\Collection;

/**
 * Builds AI prompts for WhatsApp finance extraction.
 * Extracted from WhatsappAiExtractionService to reduce God class.
 */
class WhatsappAiPromptBuilder
{
    /**
     * Build the appropriate prompt based on command type.
     */
    public function buildPrompt(
        Tenant $tenant,
        ?TenantMember $member,
        string $command,
        ?string $text,
        Collection $categoryReferences
    ): string {
        return $command === 'bulk'
            ? $this->buildBulkShoppingPrompt($tenant, $member, $text, $categoryReferences)
            : $this->buildSingleTransactionPrompt($tenant, $member, $text, $categoryReferences);
    }

    /**
     * Build prompt for single transaction extraction.
     */
    public function buildSingleTransactionPrompt(
        Tenant $tenant,
        ?TenantMember $member,
        ?string $text,
        Collection $categoryReferences
    ): string {
        $categoryReferenceJson = json_encode($categoryReferences->values()->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $currentDate = now()->toDateString();
        $currentDay = now()->format('l');

        return <<<PROMPT
You are extracting a single finance transaction from natural language text.
Return ONLY valid JSON with no markdown formatting.

Current Date: {$currentDate} ({$currentDay})
Locale: {$tenant->locale}
Currency: {$tenant->currency_code}
Member: {$member?->full_name}

Text to extract:
{$text}

Available categories:
{$categoryReferenceJson}

Return JSON with these keys:
confidence_score, type, amount, currency_code, transaction_date, merchant, notes, category_id, category_hint, account_hint, budget_hint, tags, needs_review_flags, description

Rules:
- type must be "pemasukan" or "pengeluaran"
- amount must be the final total money value
- if both quantity and total price appear, use the total price as amount
- never use quantity as amount
- transaction_date must be in YYYY-MM-DD format. Default to current date if not mentioned.
- description should be concise, without quantity or total price
- choose category_id only if one category is clearly the best match
- prefer food/drink purchases to food-related categories, not transport or fuel
- set needs_review_flags if anything is ambiguous
PROMPT;
    }

    /**
     * Build prompt for bulk/multi-item extraction.
     */
    public function buildBulkShoppingPrompt(
        Tenant $tenant,
        ?TenantMember $member,
        ?string $text,
        Collection $categoryReferences
    ): string {
        $categoryReferenceJson = json_encode($categoryReferences->values()->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $currentDate = now()->toDateString();
        $currentDay = now()->format('l');

        return <<<PROMPT
You are extracting multiple shopping items from a receipt or shopping list.
Return ONLY valid JSON with no markdown formatting.

Current Date: {$currentDate} ({$currentDay})
Locale: {$tenant->locale}
Currency: {$tenant->currency_code}
Member: {$member?->full_name}

Text to extract:
{$text}

Available categories:
{$categoryReferenceJson}

Return JSON with this exact structure:
{
  "confidence_score": 0.9,
  "merchant": "store name or null",
  "transaction_date": "YYYY-MM-DD or null",
  "subtotal": total_sum,
  "total": total_sum,
  "notes": "",
  "items": [
    {"description": "item name", "amount": number, "currency_code": "{$tenant->currency_code}", "category_id": number_or_null, "category_hint": "category name or null", "notes": ""}
  ],
  "needs_review_flags": []
}

Rules:
- Extract EVERY item from the text as a separate entry in the items array
- amount is the price for that single item
- If a line contains just a name and a number, the number is the amount
- transaction_date must be in YYYY-MM-DD format. Default to current date if not mentioned.
- Choose category_id only if it clearly matches one of the available categories above
- Set needs_review_flags if anything is ambiguous
PROMPT;
    }
}
