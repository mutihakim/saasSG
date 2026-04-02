<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class TenantAttachment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'attachable_type', 'attachable_id',
        'file_name', 'file_path', 'mime_type', 'file_size',
        'label', 'sort_order', 'row_version',
    ];

    protected function casts(): array
    {
        return [
            'file_size'   => 'integer',
            'sort_order'  => 'integer',
            'row_version' => 'integer',
        ];
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where($this->getTable() . '.tenant_id', $tenantId);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function attachable(): MorphTo
    {
        return $this->morphTo();
    }
}
