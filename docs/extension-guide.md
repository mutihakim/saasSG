# 07 - Extension Guide: Panduan Menambah Modul Baru

Panduan ini adalah referensi lengkap dan wajib dibaca sebelum membuat modul baru. Ikuti seluruh langkah agar modul baru terintegrasi penuh dengan arsitektur: Subscription, RBAC, i18n, Notifikasi Toast, dan Soft-Delete.

---

## Prinsip Arsitektur: "One Module = One Everything"

Setiap modul baru WAJIB mengikuti prinsip berikut:

| Layer | Jumlah | Contoh |
|---|---|---|
| Model Eloquent | 1 per entitas | `TenantUom`, `TenantCurrency` |
| API Controller | 1 per entitas | `MasterUomApiController` |
| Policy | 1 per entitas | `TenantUomPolicy` |
| Seeder | 1 per entitas | `TenantUomSeeder` |
| Frontend Page | 1 per modul | `Pages/Tenant/MasterData/Uom/` |
| Locale key namespace | 1 per modul | `master.uom.*` |

---

## Langkah Lengkap: Membuat Modul Master Data Baru

Contoh di bawah menggunakan modul `master.warehouses` (Gudang) sebagai ilustrasi.

---

### Step 1 — Daftarkan Permission Module

**File:** `config/permission_modules.php`

```php
// Tambahkan baris baru:
'master.warehouses' => ['view', 'create', 'update', 'delete'],
```

---

### Step 2 — Daftarkan ke Subscription Entitlements

**File:** `config/subscription_entitlements.php`

Tambahkan ke setiap blok `features` pada tiap plan (`free`, `pro`, `business`, `enterprise`):

```php
'master.warehouses' => ['view', 'create', 'update', 'delete'],
```

Jika ada quota limit, tambahkan juga di blok `limits`:

```php
'master.warehouses.max' => 10, // free plan
'master.warehouses.max' => -1, // pro/business/enterprise (unlimited = -1)
```

---

### Step 3 — Buat Migration

Buat migration baru di `database/migrations/`:

```php
Schema::create('tenant_warehouses', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('tenant_id');
    $table->string('code', 20);
    $table->string('name');
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    $table->integer('row_version')->default(1);
    $table->timestamps();
    $table->softDeletes(); // WAJIB untuk Soft-Delete Aware

    // WAJIB: Partial Unique Index untuk Soft-Delete Awareness
    // Jangan pakai $table->unique() biasa karena akan memblokir re-create setelah soft-delete
});
```

**Tambahkan Partial Unique Index** (di migration terpisah atau dalam migration yang sama lewat `DB::statement`):

```php
DB::statement("
    CREATE UNIQUE INDEX tenant_warehouses_tenant_code_unique
    ON tenant_warehouses (tenant_id, code)
    WHERE deleted_at IS NULL
");
```

> [!IMPORTANT]
> Selalu gunakan **Partial Unique Index** (`WHERE deleted_at IS NULL`) untuk kolom `code`/`name` pada tabel yang mendukung soft-delete. Index biasa (`$table->unique()`) akan memblokir pembuatan data baru jika kode yang sama pernah dihapus sebelumnya.

---

### Step 4 — Buat Model Eloquent

**File:** `app/Models/TenantWarehouse.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TenantWarehouse extends Model
{
    use SoftDeletes;

    protected $table = 'tenant_warehouses';

    protected $fillable = [
        'tenant_id', 'code', 'name', 'is_active', 'sort_order', 'row_version',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Scopes wajib
    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('code');
    }
}
```

---

### Step 5 — Buat Policy

**File:** `app/Policies/TenantWarehousePolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\TenantWarehouse;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TenantWarehousePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('master.warehouses.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('master.warehouses.create');
    }

    public function update(User $user, TenantWarehouse $warehouse): bool
    {
        return $user->hasPermissionTo('master.warehouses.update');
    }

    public function delete(User $user, TenantWarehouse $warehouse): bool
    {
        return $user->hasPermissionTo('master.warehouses.delete');
    }
}
```

---

### Step 6 — Daftarkan Policy di AuthServiceProvider

**File:** `app/Providers/AuthServiceProvider.php`

```php
use App\Models\TenantWarehouse;
use App\Policies\TenantWarehousePolicy;

protected $policies = [
    // ...existing...
    TenantWarehouse::class => TenantWarehousePolicy::class,
];
```

---

### Step 7 — Buat API Controller

**File:** `app/Http/Controllers/Api/MasterWarehouseApiController.php`

Pattern wajib: satu controller, satu entitas, ikuti struktur yang sama persis dengan `MasterUomApiController` atau `MasterCurrencyApiController`.

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantWarehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MasterWarehouseApiController extends Controller
{
    public function index(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('viewAny', TenantWarehouse::class);
        $warehouses = TenantWarehouse::forTenant($tenant->id)->active()->ordered()->get();
        return response()->json(['ok' => true, 'data' => $warehouses]);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('create', TenantWarehouse::class);
        $validated = $request->validate([
            'code' => [
                'required', 'string', 'max:20',
                // Gunakan Rule::unique dengan soft-delete aware check
                Rule::unique('tenant_warehouses')->where(
                    fn($q) => $q->where('tenant_id', $tenant->id)->whereNull('deleted_at')
                ),
            ],
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $warehouse = TenantWarehouse::create([
            'tenant_id' => $tenant->id,
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
            'row_version' => 1,
        ]);

        return response()->json(['ok' => true, 'data' => $warehouse], 201);
    }

    public function update(Request $request, Tenant $tenant, TenantWarehouse $warehouse): JsonResponse
    {
        $this->authorize('update', $warehouse);
        $validated = $request->validate([
            'code' => [
                'required', 'string', 'max:20',
                Rule::unique('tenant_warehouses')->ignore($warehouse->id)->where(
                    fn($q) => $q->where('tenant_id', $tenant->id)->whereNull('deleted_at')
                ),
            ],
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'row_version' => 'required|integer',
        ]);

        if ((int)$validated['row_version'] !== $warehouse->row_version) {
            return response()->json(['ok' => false, 'error' => ['code' => 'VERSION_CONFLICT']], 409);
        }

        $warehouse->update([...$validated, 'row_version' => $warehouse->row_version + 1]);
        return response()->json(['ok' => true, 'data' => $warehouse->fresh()]);
    }

    public function destroy(Request $request, Tenant $tenant, TenantWarehouse $warehouse): JsonResponse
    {
        $this->authorize('delete', $warehouse);
        $warehouse->delete();
        return response()->json(['ok' => true, 'data' => ['deleted' => true]]);
    }
}
```

---

### Step 8 — Daftarkan Route API

**File:** `routes/api.php` — tambahkan di dalam blok route tenant master data:

```php
// Master Warehouses
Route::get('/warehouses', [MasterWarehouseApiController::class, 'index'])
    ->middleware('tenant.feature:master.warehouses,view');
Route::post('/warehouses', [MasterWarehouseApiController::class, 'store'])
    ->middleware(['superadmin.impersonation', 'tenant.feature:master.warehouses,create', 'throttle:tenant.mutation']);
Route::patch('/warehouses/{warehouse}', [MasterWarehouseApiController::class, 'update'])
    ->middleware(['superadmin.impersonation', 'tenant.feature:master.warehouses,update', 'throttle:tenant.mutation']);
Route::delete('/warehouses/{warehouse}', [MasterWarehouseApiController::class, 'destroy'])
    ->middleware(['superadmin.impersonation', 'tenant.feature:master.warehouses,delete', 'throttle:tenant.mutation']);
```

> [!IMPORTANT]
> Semua mutation route (POST/PATCH/DELETE) wajib memiliki 3 middleware:
> 1. `superadmin.impersonation`
> 2. `tenant.feature:<module>,<action>`
> 3. `throttle:tenant.mutation`

---

### Step 9 — Buat Seeder

**File:** `database/seeders/TenantWarehouseSeeder.php`

```php
<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\TenantWarehouse;
use Illuminate\Database\Seeder;

class TenantWarehouseSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'demo')->first();
        if (!$tenant) return;

        $warehouses = [
            ['code' => 'WH-MAIN', 'name' => 'Gudang Utama', 'sort_order' => 1],
            ['code' => 'WH-TRANSIT', 'name' => 'Gudang Transit', 'sort_order' => 2],
        ];

        foreach ($warehouses as $data) {
            TenantWarehouse::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => $data['code']],
                [...$data, 'tenant_id' => $tenant->id, 'is_active' => true, 'row_version' => 1]
            );
        }
    }
}
```

Daftarkan di `TenantMasterDataSeeder`:

```php
$this->call([
    // ...existing...
    TenantWarehouseSeeder::class,
]);
```

---

### Step 10 — Tambahkan Translation Keys (i18n)

> [!IMPORTANT]
> Kedua file (`en` dan `id`) WAJIB diupdate **bersamaan** dalam PR yang sama.

**Strategi namespace:** Gunakan `master.warehouses.*` untuk semua key modul ini.

Tambahkan di `resources/js/locales/en/master.json`:

```json
{
  "warehouses": {
    "title": "Warehouses",
    "description": "Manage your warehouse locations",
    "labels": {
      "code": "Code",
      "name": "Name",
      "is_active": "Active"
    },
    "actions": {
      "add": "Add Warehouse",
      "edit": "Edit Warehouse",
      "delete": "Delete Warehouse"
    },
    "toast": {
      "created": "Warehouse created successfully.",
      "updated": "Warehouse updated successfully.",
      "deleted": "Warehouse deleted."
    },
    "error": {
      "create_failed": "Failed to create warehouse.",
      "update_failed": "Failed to update warehouse.",
      "delete_failed": "Failed to delete warehouse."
    }
  }
}
```

Tambahkan juga di `resources/js/locales/id/master.json` (terjemahkan semua key):

```json
{
  "warehouses": {
    "title": "Gudang",
    "description": "Kelola lokasi gudang Anda",
    "labels": {
      "code": "Kode",
      "name": "Nama",
      "is_active": "Aktif"
    },
    "toast": {
      "created": "Gudang berhasil dibuat.",
      "updated": "Gudang berhasil diperbarui.",
      "deleted": "Gudang dihapus."
    },
    "error": {
      "create_failed": "Gagal membuat gudang.",
      "update_failed": "Gagal memperbarui gudang.",
      "delete_failed": "Gagal menghapus gudang."
    }
  }
}
```

Jika modul ini menambahkan error code baru yang perlu diterjemahkan di Frontend, tambahkan juga di `common.json` (EN & ID):

```json
"api.error.WAREHOUSE_LOCKED.title": "Warehouse is locked",
"api.error.WAREHOUSE_LOCKED.detail": "This warehouse cannot be modified while active operations are running."
```

---

### Step 11 — Buat Frontend Page (React/Inertia)

Struktur folder modul baru (`Pages/Tenant/MasterData/Warehouses/`):

```
Pages/Tenant/MasterData/Warehouses/
  Index.tsx          ← Halaman list utama
  components/
    WarehouseModal.tsx  ← Modal Create/Edit
```

**Pola Wajib di Modal (`WarehouseModal.tsx`):**

```tsx
import { useTranslation } from 'react-i18next';
import { parseApiError } from '../../../../common/apiError';
import { notify } from '../../../../common/notify';

// Di dalam catch block:
} catch (err: any) {
    const parsed = parseApiError(err, t('master.warehouses.error.create_failed'));
    notify.error({ title: parsed.title, detail: parsed.detail });
}

// Toast sukses:
notify.success(t('master.warehouses.toast.created'));
```

> [!IMPORTANT]
> **Jangan** pernah hardcode pesan error langsung seperti `notify.error('Gagal membuat gudang')`. Selalu gunakan `parseApiError` + kunci translasi. Ini yang memastikan notifikasi toast reaktif mengikuti bahasa yang aktif.

---

### Step 12 — Daftarkan Inertia Page ke Controller Web

Jika modul ini memerlukan halaman web (bukan hanya API), tambahkan di `TenantWorkspaceController` atau buat controller web tersendiri di `app/Http/Controllers/Tenant/`:

```php
public function warehouses(Request $request): Response
{
    $this->authorize('viewAny', [TenantWarehouse::class]);
    return Inertia::render('Tenant/MasterData/Warehouses/Index');
}
```

Daftarkan di `routes/web.php`:

```php
Route::get('/master/warehouses', [TenantWorkspaceController::class, 'warehouses'])
    ->middleware('tenant.feature:master.warehouses,view')
    ->name('tenant.master.warehouses');
```

---

### Step 13 — Update Navigasi Sidebar

**File:** `resources/js/common/shellNavigation.ts`

Tambahkan item navigasi baru di grup Master Data:

```ts
{
    id: 'master-warehouses',
    label: 'layout.shell.nav.items.master_warehouses', // i18n key
    link: tenantRoute.to('/master/warehouses'),
    icon: 'ri-building-2-line',
    permission: 'master.warehouses.view',
}
```

Tambahkan key navigasi ke locale EN (`layout.json`):

```json
"master_warehouses": "Warehouses"
```

Dan ID (`layout.json`):

```json
"master_warehouses": "Gudang"
```

---

### Step 14 — Checklist Akhir Sebelum PR

```
Backend:
[ ] config/permission_modules.php — module terdaftar
[ ] config/subscription_entitlements.php — semua plan terupdate
[ ] Migration + Partial Unique Index dibuat
[ ] Model dengan SoftDeletes + scopes
[ ] Policy (viewAny, create, update, delete)
[ ] AuthServiceProvider — policy terdaftar
[ ] API Controller (index, store, update, destroy)
[ ] routes/api.php — 4 route, 3 middleware per mutation
[ ] Seeder + TenantMasterDataSeeder terupdate
[ ] lang/en/validation.php — attributes ditambahkan jika perlu
[ ] lang/id/validation.php — attributes ditambahkan jika perlu

Frontend:
[ ] locales/en/master.json — keys baru
[ ] locales/id/master.json — keys baru (bersamaan!)
[ ] locales/en/common.json — api.error.*.title/detail jika ada error code baru
[ ] locales/id/common.json — api.error.*.title/detail jika ada error code baru
[ ] Pages/Tenant/.../Index.tsx dibuat
[ ] Pages/Tenant/.../components/Modal.tsx menggunakan parseApiError + notify

Dokumentasi:
[ ] docs/api-reference.md — endpoint baru dicatat
[ ] docs/03-features/subscription.md — jika ada limit baru
[ ] docs/08-progress/index.md — status modul
[ ] docs/extension-guide.md — tidak perlu diubah (generik)
```

---

## B. Menambah Bahasa Baru (i18n)

1. Tambah folder locale baru: `resources/js/locales/<lang>/`.
2. Salin semua file JSON dari `en/` dan terjemahkan.
3. Daftarkan resource di `resources/js/i18n.ts`.
4. Daftarkan opsi dropdown di `resources/js/common/languages.ts`.
5. Uji fallback saat key tidak tersedia.
6. Update `docs/03-features/i18n.md`.

---

## C. Menambah Limit Quota Baru

1. Tambah key limit di `config/subscription_entitlements.php`.
2. Implement check di controller: `app(SubscriptionEntitlements::class)->assertUnderLimit($tenant, 'master.warehouses.max')`.
3. Expose usage di `HandleInertiaRequests` bila perlu ditampilkan di UI.
4. Tambah test untuk kondisi di bawah limit dan melebihi limit.
5. Update dokumentasi subscription + testing.

---

## D. Menambah Field Tenant Settings atau Branding Baru

1. Tambah kolom tenant lewat migration.
2. Tambah field ke `app/Models/Tenant.php` `$fillable`.
3. Tambah validasi di request tenant settings yang sesuai.
4. Tambah payload di `TenantSettingsController::tenantPayload()`.
5. Jika field dipakai shell, expose juga lewat shared props di `HandleInertiaRequests`.
6. Jika field adalah branding asset, ikuti kontrak slot per tenant di `TenantBranding`.
7. Tambah test untuk permission, persistence, fallback, dan cleanup bila perlu.
8. Update `docs/03-features/tenant-settings.md`, `docs/05-ui-walkthrough.md`, dan `docs/06-testing-quality.md`.

---

## Do / Don't

**Do:**

- Gunakan middleware + policy sebagai guard utama.
- Pertahankan konsistensi naming `module.action`.
- Gunakan `parseApiError` + `notify` dari `common/` untuk SEMUA notifikasi error.
- Update docs dan test dalam PR yang sama.
- Gunakan **Partial Unique Index** (`WHERE deleted_at IS NULL`) untuk kolom unique pada tabel soft-delete.
- Selalu update key locale EN dan ID bersamaan.
- Gunakan `Rule::unique(...)->where(fn($q) => $q->whereNull('deleted_at'))` di validator, sesuai Partial Index.

**Don't:**

- Jangan menambah route tenant tanpa `tenant.initialize`, `tenant.access`, `permission.team`.
- Jangan hardcode plan check tersebar tanpa reuse `SubscriptionEntitlements`.
- Jangan hardcode string user-facing di komponen React (selalu gunakan `t()`).
- Jangan menampilkan `error.code` mentah ke end-user sebagai pesan toast utama.
- Jangan pakai `$table->unique()` biasa pada tabel soft-delete (akan merusak fitur re-create-after-delete).
- Jangan merge fitur baru tanpa update locale EN **dan** ID bersamaan.
