<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinanceTransaction;
use App\Models\Tenant;
use App\Models\TenantAttachment;
use App\Models\TenantWhatsappIntent;
use App\Models\TenantWhatsappMedia;
use App\Models\TenantMember;
use App\Services\FinanceAccessService;
use App\Services\WhatsappFinanceIntentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceWhatsappIntentApiController extends Controller
{
    public function __construct(
        private readonly FinanceAccessService $access,
        private readonly WhatsappFinanceIntentService $intentService,
    ) {
    }

    public function show(Request $request, Tenant $tenant, string $token)
    {
        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');
        $intent = TenantWhatsappIntent::query()
            ->with(['items', 'member:id,full_name', 'media:id,storage_path,mime_type,size_bytes'])
            ->where('tenant_id', $tenant->id)
            ->where('token', $token)
            ->first();

        if (!$intent || ($intent->expires_at && $intent->expires_at->isPast())) {
            return response()->json(['ok' => false, 'message' => 'WhatsApp draft tidak ditemukan atau sudah kedaluwarsa.'], 404);
        }

        if ($intent->status === 'submitted') {
            return response()->json(['ok' => false, 'message' => 'Draft WhatsApp ini sudah berhasil disubmit dan tidak dapat dibuka lagi.'], 404);
        }

        if (!$this->intentService->canOpenIntent($intent, $member, $this->access)) {
            return response()->json(['ok' => false, 'message' => 'Anda tidak memiliki akses ke draft WhatsApp ini.'], 403);
        }

        if (!$intent->app_opened_at) {
            $intent->forceFill(['app_opened_at' => now(), 'status' => 'app_opened'])->save();
        }

        $mediaItems = $this->resolveIntentMediaItems($tenant, $intent);

        return response()->json([
            'ok' => true,
            'data' => [
                'intent' => array_merge($intent->toArray(), [
                    'media_items' => $mediaItems,
                ]),
            ],
        ]);
    }

    public function mediaPreview(Request $request, Tenant $tenant, TenantWhatsappMedia $media): StreamedResponse|\Illuminate\Http\JsonResponse
    {
        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');
        if (!$member || !$this->access->canCreatePrivateStructures($member)) {
            return response()->json(['ok' => false, 'message' => 'Unauthorized.'], 403);
        }

        if ((int) $media->tenant_id !== (int) $tenant->id) {
            return response()->json(['ok' => false, 'message' => 'Not found.'], 404);
        }

        if (!Storage::exists($media->storage_path)) {
            return response()->json(['ok' => false, 'message' => 'Media file not found.'], 404);
        }

        $stream = Storage::readStream($media->storage_path);
        if ($stream === false) {
            return response()->json(['ok' => false, 'message' => 'Media file not found.'], 404);
        }

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $media->mime_type,
            'Content-Length' => (string) max((int) $media->size_bytes, 0),
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    public function markSubmitted(Request $request, Tenant $tenant, string $token)
    {
        /** @var TenantMember|null $member */
        $member = $request->attributes->get('currentTenantMember');
        $intent = TenantWhatsappIntent::query()
            ->where('tenant_id', $tenant->id)
            ->where('token', $token)
            ->first();

        if (!$intent || ($intent->expires_at && $intent->expires_at->isPast())) {
            return response()->json(['ok' => false, 'message' => 'WhatsApp draft tidak ditemukan atau sudah kedaluwarsa.'], 404);
        }

        if (!$this->intentService->canOpenIntent($intent, $member, $this->access)) {
            return response()->json(['ok' => false, 'message' => 'Anda tidak memiliki akses ke draft WhatsApp ini.'], 403);
        }

        $payload = $request->validate([
            'linked_resource_type' => ['nullable', 'string', 'max:40'],
            'linked_resource_id' => ['nullable', 'integer'],
            'submitted_count' => ['nullable', 'integer', 'min:1', 'max:500'],
            'transaction_ids' => ['nullable', 'array', 'min:1', 'max:500'],
            'transaction_ids.*' => ['string', 'max:26'],
        ]);

        if (!empty($payload['transaction_ids'])) {
            $this->attachIntentMediaToTransactions($tenant, $intent, $payload['transaction_ids']);
        }

        $this->intentService->finalizeSubmittedIntent(
            tenant: $tenant,
            intent: $intent,
            linkedResourceType: $payload['linked_resource_type'] ?? null,
            linkedResourceId: $payload['linked_resource_id'] ?? null,
            submittedCount: $payload['submitted_count'] ?? null,
            transactionIds: $payload['transaction_ids'] ?? null,
        );

        return response()->json(['ok' => true]);
    }

    private function resolveIntentMediaItems(Tenant $tenant, TenantWhatsappIntent $intent): array
    {
        $mediaIds = collect([
            $intent->media_id,
            ...$this->intentService->resolveAdditionalMediaIds($intent),
        ])
            ->filter(fn ($id) => filled($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($mediaIds->isEmpty()) {
            return [];
        }

        $mediaItems = TenantWhatsappMedia::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $mediaIds->all())
            ->get()
            ->keyBy('id');

        return $mediaIds
            ->map(function (int $mediaId) use ($mediaItems, $tenant) {
                /** @var TenantWhatsappMedia|null $media */
                $media = $mediaItems->get($mediaId);
                if (!$media) {
                    return null;
                }

                return [
                    'id' => $media->id,
                    'mime_type' => $media->mime_type,
                    'size_bytes' => $media->size_bytes,
                    'preview_url' => route('api.finance.whatsapp-media.preview', [
                        'tenant' => $tenant,
                        'media' => $media,
                    ], false),
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function attachIntentMediaToTransactions(Tenant $tenant, TenantWhatsappIntent $intent, array $transactionIds): void
    {
        $mediaIds = collect([
            $intent->media_id,
            ...$this->intentService->resolveAdditionalMediaIds($intent),
        ])
            ->filter(fn ($id) => filled($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($mediaIds->isEmpty()) {
            return;
        }

        $transactions = FinanceTransaction::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', collect($transactionIds)->map(fn ($id) => (string) $id)->all())
            ->with('attachments:id,tenant_id,attachable_id,attachable_type,file_name,label,sort_order')
            ->get();

        if ($transactions->isEmpty()) {
            return;
        }

        $mediaItems = TenantWhatsappMedia::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $mediaIds->all())
            ->get();

        foreach ($transactions as $transaction) {
            $nextSortOrder = (int) $transaction->attachments->max('sort_order');

            foreach ($mediaItems as $media) {
                if (!Storage::exists($media->storage_path)) {
                    continue;
                }

                $existing = $transaction->attachments->first(function (TenantAttachment $attachment) use ($media) {
                    return (string) $attachment->label === sprintf('whatsapp-media:%d', $media->id);
                });

                if ($existing) {
                    continue;
                }

                $storedAttachment = $this->storeMediaAsAttachment($transaction, $media);

                $transaction->attachments()->create([
                    'tenant_id' => $tenant->id,
                    'file_name' => $storedAttachment['file_name'],
                    'file_path' => $storedAttachment['path'],
                    'mime_type' => $storedAttachment['mime_type'],
                    'file_size' => $storedAttachment['file_size'],
                    'label' => sprintf('whatsapp-media:%d', $media->id),
                    'sort_order' => ++$nextSortOrder,
                    'row_version' => 1,
                ]);
            }
        }
    }

    private function storeMediaAsAttachment(FinanceTransaction $transaction, TenantWhatsappMedia $media): array
    {
        $contents = Storage::get($media->storage_path);

        if (in_array((string) $media->mime_type, ['image/jpeg', 'image/png', 'image/webp'], true)) {
            $image = @imagecreatefromstring($contents);
            if ($image) {
                $this->prepareImageResource($image);
                $optimized = $this->encodeWebpUnderLimit($image, 100 * 1024);
                imagedestroy($image);

                $path = sprintf(
                    'finance/attachments/transactions/%s/%s.webp',
                    $transaction->id,
                    Str::uuid()->toString()
                );
                Storage::put($path, $optimized);

                return [
                    'path' => $path,
                    'file_name' => sprintf('whatsapp-%d.webp', $media->id),
                    'mime_type' => 'image/webp',
                    'file_size' => strlen($optimized),
                ];
            }
        }

        $extension = pathinfo((string) $media->storage_path, PATHINFO_EXTENSION);
        if ($extension === '') {
            $extension = Str::lower((string) Str::afterLast($media->mime_type, '/')) ?: 'bin';
        }

        $path = sprintf(
            'finance/attachments/transactions/%s/%s.%s',
            $transaction->id,
            Str::uuid()->toString(),
            $extension
        );
        Storage::put($path, $contents);

        return [
            'path' => $path,
            'file_name' => sprintf('whatsapp-%d.%s', $media->id, $extension),
            'mime_type' => $media->mime_type,
            'file_size' => strlen($contents),
        ];
    }

    private function encodeWebpUnderLimit(\GdImage $image, int $maxBytes): string
    {
        $current = $image;
        $ownsCurrent = false;
        $bestBytes = null;
        $qualities = [82, 76, 70, 64, 58, 52, 46, 40, 34];

        for ($iteration = 0; $iteration < 6; $iteration++) {
            foreach ($qualities as $quality) {
                $encoded = $this->encodeImageToWebp($current, $quality);
                if ($encoded === null) {
                    continue;
                }

                if ($bestBytes === null || strlen($encoded) < strlen($bestBytes)) {
                    $bestBytes = $encoded;
                }

                if (strlen($encoded) <= $maxBytes) {
                    if ($ownsCurrent && $current !== $image) {
                        imagedestroy($current);
                    }

                    return $encoded;
                }
            }

            $width = imagesx($current);
            $height = imagesy($current);
            if ($width <= 480 && $height <= 480) {
                break;
            }

            $scaled = imagescale(
                $current,
                max(320, (int) floor($width * 0.85)),
                max(320, (int) floor($height * 0.85)),
                IMG_BILINEAR_FIXED
            );

            if ($scaled === false) {
                break;
            }

            $this->prepareImageResource($scaled);
            if ($ownsCurrent && $current !== $image) {
                imagedestroy($current);
            }

            $current = $scaled;
            $ownsCurrent = true;
        }

        if ($ownsCurrent && $current !== $image) {
            imagedestroy($current);
        }

        return $bestBytes ?? throw new \RuntimeException('Failed to optimize WhatsApp image attachment.');
    }

    private function encodeImageToWebp(\GdImage $image, int $quality): ?string
    {
        ob_start();
        $success = imagewebp($image, null, $quality);
        $contents = ob_get_clean();

        if (!$success || !is_string($contents) || $contents === '') {
            return null;
        }

        return $contents;
    }

    private function prepareImageResource(\GdImage $image): void
    {
        if (function_exists('imagepalettetotruecolor')) {
            @imagepalettetotruecolor($image);
        }

        imagealphablending($image, false);
        imagesavealpha($image, true);
    }
}
