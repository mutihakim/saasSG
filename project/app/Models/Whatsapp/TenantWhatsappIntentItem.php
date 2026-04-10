<?php

namespace App\Models\Whatsapp;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantWhatsappIntentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'intent_id',
        'sort_order',
        'description',
        'amount',
        'currency_code',
        'payload',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payload' => 'array',
    ];

    public function intent()
    {
        return $this->belongsTo(TenantWhatsappIntent::class, 'intent_id');
    }
}
