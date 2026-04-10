<?php

namespace App\Models\Whatsapp;

use App\Models\Tenant\TenantMember;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantWhatsappIntent extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'member_id',
        'sender_jid',
        'source_message_id',
        'media_id',
        'token',
        'command',
        'intent_type',
        'input_type',
        'status',
        'ai_provider',
        'ai_model',
        'confidence_score',
        'processing_time_ms',
        'raw_input',
        'extracted_payload',
        'ai_raw_response',
        'error_payload',
        'linked_resource_type',
        'linked_resource_id',
        'app_opened_at',
        'expires_at',
    ];

    protected $casts = [
        'confidence_score' => 'decimal:4',
        'processing_time_ms' => 'integer',
        'raw_input' => 'array',
        'extracted_payload' => 'array',
        'ai_raw_response' => 'array',
        'error_payload' => 'array',
        'app_opened_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(TenantWhatsappIntentItem::class, 'intent_id')->orderBy('sort_order');
    }

    public function member()
    {
        return $this->belongsTo(TenantMember::class, 'member_id');
    }

    public function sourceMessage()
    {
        return $this->belongsTo(TenantWhatsappMessage::class, 'source_message_id');
    }

    public function media()
    {
        return $this->belongsTo(TenantWhatsappMedia::class, 'media_id');
    }
}
