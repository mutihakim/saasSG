<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SharedAttachment extends Model
{
    use HasUlids;

    public $timestamps = false;

    protected $fillable = [
        'tenant_id', 'attachable_type', 'attachable_id', 'uploaded_by',
        'file_type', 'file_path', 'file_name', 'file_size',
        'mime_type', 'caption', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'file_size'  => 'integer',
            'sort_order' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function attachable(): MorphTo
    {
        return $this->morphTo();
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(TenantMember::class, 'uploaded_by');
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeImages(Builder $query): Builder
    {
        return $query->where('file_type', 'gambar');
    }
}
