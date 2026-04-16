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

## Kebijakan Database Baru

Untuk modul baru, ikuti aturan database berikut:

1. Migration hanya boleh mendefinisikan schema final: tabel, kolom, foreign key, constraint, dan index.
2. Jangan menaruh seed data, backfill, normalize, recalculation, atau rollout permission di migration.
3. Data default wajib ditempatkan di seeder atau service provisioning.
4. Jika data hanya dibutuhkan untuk demo/dev, buat seeder manual terpisah dan jangan panggil dari `DatabaseSeeder`.
5. Jika ada data turunan yang perlu dibangun ulang, sediakan artisan command maintenance, bukan migration.

> [!IMPORTANT]
> Repo ini memakai baseline schema dump PostgreSQL di `database/schema/pgsql-schema.sql`. Migration baru harus diperlakukan sebagai perubahan schema setelah baseline dump, bukan tempat menyimpan sejarah data rollout.

---

## Langkah Lengkap: Membuat Modul Master Data Baru

Contoh di bawah menggunakan modul `master.warehouses` (Gudang) sebagai ilustrasi.

---

## Standar Baru untuk Hub dan PWA Module

### Istilah Baku

- `Hub` = home utama member di `/hub`
- `PWA Module` = modul tenant standalone seperti `/finance`
- `PWA` = sifat teknis mobile-first, bukan nama produk utama

Untuk `Hub` atau `PWA Module` tenant yang ditujukan sebagai pengalaman aplikasi mobile penuh, JANGAN membuat satu halaman raksasa yang memegang seluruh shell, state, filter, loading, dan list sekaligus.

Gunakan dokumen ini bersama template praktis di [`docs/guide/pwa-module-template.md`](./guide/pwa-module-template.md) bila modul baru akan dibangun sebagai standalone PWA tenant.

Sebelum menulis UI baru, WAJIB cek referensi Velzon di:

- [`docs/reference/velzon-navbar-reference.md`](./reference/velzon-navbar-reference.md)
- [`docs/reference/velzon-base-ui.md`](./reference/velzon-base-ui.md)
- [`docs/reference/velzon-more-reference.md`](./reference/velzon-more-reference.md)

> [!WARNING]
> Saat memakai referensi Velzon, baca **hanya file yang diperlukan**.
> Jangan menjelajah seluruh folder `velzon/Saas` tanpa kebutuhan konkret.
> Pola yang benar:
> 1. cari menu yang relevan di docs referensi
> 2. pilih source file terdekat
> 3. buka hanya file itu dan, bila perlu, maksimal satu file pendukung lagi
>
> Ini aturan wajib untuk mencegah pemborosan konteks agent dan menjaga implementasi tetap fokus.

Gunakan pola berikut sebagai standar:

| Layer | Tanggung Jawab |
|---|---|
| `Page.tsx` | Shell route-level yang tipis. Hanya `Head`, background utama, dan mount container modul. |
| `Index.tsx` | Orchestrator modul. Menjembatani data bootstrapped, state utama, dan event lintas layar. |
| `components/pwa/*` | UI surface terpisah: top bar, filter panel, list content, skeleton, bottom nav, error state. |
| `components/*Modal.tsx` | Form create/edit/fullscreen flow yang berdiri sendiri. |
| `common/*` / service API | Helper tanggal, parsing error, route helper, dan query builder agar tidak duplikasi di layar. |

### Aturan Praktis

- `Page.tsx` target maksimum: tipis dan tidak memuat business state besar.
- `Index.tsx` boleh jadi orchestration layer, tetapi tetap harus mendorong UI besar ke komponen terpisah bila sudah melewati satu concern besar.
- Filter kompleks untuk PWA mobile sebaiknya dipindah ke surface sendiri, misalnya slide-in panel atau full-screen filter page. Jangan menumpuk chip/filter bar di header utama.
- Loading state wajib memakai skeleton untuk layar utama modul PWA, bukan spinner saja.
- Error state wajib ramah pengguna dan menyediakan aksi retry. Jangan biarkan layar blank saat API gagal.
- Floating bottom navigation wajib diimbangi `padding-bottom` konten yang eksplisit agar item paling bawah tetap terbaca di atas nav dan safe area.
- Safe area (`env(safe-area-inset-*)`) harus dipertimbangkan sejak awal untuk top bar, bottom nav, FAB, dan modal fullscreen.
- Jangan memaksa field identifier internal seperti `code` muncul di UI operasional jika tidak dibutuhkan. Lebih baik:
  - tampilkan field bisnis utama saja
  - generate identifier internal di backend saat kosong
  - pertahankan identifier lama saat edit data existing
- Untuk tombol, badge, card, list, form, modal, dan widget:
  - cari padanan Velzon dulu
  - gunakan class/variant Velzon lebih dulu
  - custom CSS hanya untuk gap yang memang tidak disediakan Velzon, terutama perilaku mobile PWA

> [!IMPORTANT]
> Untuk modul PWA baru, anggap pola `Page.tsx` + `Index.tsx` + `components/pwa/*` ini sebagai baseline. Jangan lagi memulai dari satu file page monolitik lalu memecahnya belakangan.

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

#### Polymorphic Relations ID Type

Untuk tabel polymorphic (seperti `tenant_taggables`, `tenant_attachments`):

**WAJIB gunakan `string()` untuk kolom polymorphic ID:**

```php
Schema::create('tenant_taggables', function (Blueprint $table) {
    $table->unsignedBigInteger('tenant_tag_id');
    $table->string('taggable_type', 100);
    $table->string('taggable_id', 100); // ✅ BENAR: string untuk kompatibilitas polymorphic
    $table->timestamp('created_at')->useCurrent();
    
    $table->primary(['tenant_tag_id', 'taggable_type', 'taggable_id']);
    $table->index(['taggable_type', 'taggable_id']);
});
```

**JANGAN gunakan `ulid()` atau `bigInteger()`:**

```php
$table->ulid('taggable_id');         // ❌ SALAH: tidak kompatibel dengan BIGINT models
$table->bigInteger('taggable_id');   // ❌ SALAH: tidak kompatibel dengan ULID/UUID models
```

> [!IMPORTANT]
> **Alasan:** Polymorphic relation harus bisa menangani berbagai tipe primary key dari model yang berbeda:
> - `FinanceTransaction` sekarang menggunakan **ULID string**
> - Model lama lain mungkin masih `BIGINT`
> - Model lain mungkin menggunakan `UUID`
> 
> Menggunakan `string(100)` adalah **best practice Laravel** untuk menghindari type mismatch error di database (PostgreSQL error: `operator does not exist: character varying = bigint`).

#### Workaround vs Solusi yang Benar

> [!WARNING]
> `$keyType = 'string'` adalah **workaround**, bukan best practice. Gunakan hanya untuk model BIGINT yang **sudah ada** (legacy). Untuk model baru, gunakan ULID dari awal.

**Workaround (untuk model BIGINT legacy yang sudah ada):**

Jika model menggunakan `BIGINT` primary key dan harus berpartisipasi dalam polymorphic relation dengan pivot bertipe `string`, tambahkan:

```php
class FinanceTransaction extends Model
{
    // Workaround: memaksa Laravel mengirim PK sebagai string
    // agar PostgreSQL bisa mencocokkan dengan kolom taggable_id bertipe varchar
    // Diperlukan karena kita tidak bisa mengubah tabel legacy tanpa migrasi besar.
    protected $keyType = 'string';   // ← workaround
    public $incrementing = true;     // tetap true, auto-increment tetap berjalan
}
```

**Kapan workaround ini acceptable:**
- Model sudah ada di production dan menggunakan `id()` (BIGINT auto-increment)
- Mengubah tipe PK membutuhkan migrasi besar yang berisiko
- Tidak ada model lain yang bergantung pada tipe integer-nya

**Solusi yang benar untuk Modul Baru:**

Gunakan `HasUlids` sejak awal agar primary key kompatibel secara native dengan kolom polymorphic bertipe `string`:

```php
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class NewTransaction extends Model
{
    use HasUlids; // PK = ULID (string), kompatibel langsung dengan taggable_id string
    // Tidak perlu $keyType atau workaround apapun
}
```

**Ringkasan pola yang harus diikuti:**

| Situasi | Yang Harus Dilakukan |
|---|---|
| Model baru + akan pakai polymorphic | Gunakan `HasUlids` |
| Model lama BIGINT + harus pakai polymorphic | Tambahkan `$keyType = 'string'` + dokumentasikan alasannya di kode |
| Tabel pivot polymorphic | Selalu `string(100)` untuk kolom `*_type` dan `*_id` |
| Jangan pernah | Pakai `bigInteger`, `uuidMorphs`, atau `ulid()` untuk kolom polymorphic pivot |


---

#### Row Version untuk Optimistic Concurrency Control

Untuk semua entitas yang mendukung update concurrent, WAJIB tambahkan `row_version`:

```php
Schema::create('tenant_warehouses', function (Blueprint $table) {
    // ... kolom lainnya ...
    $table->unsignedInteger('row_version')->default(1);
});
```

**Di Model:**
```php
protected $fillable = [..., 'row_version'];

protected function casts(): array
{
    return [
        'row_version' => 'integer',
    ];
}
```

**Di API Controller (update method):**
```php
public function update(Request $request, Tenant $tenant, TenantWarehouse $warehouse): JsonResponse
{
    $this->authorize('update', $warehouse);
    
    $validated = $request->validate([
        // ... field lainnya ...
        'row_version' => ['required', 'integer'],
    ]);

    // Optimistic Concurrency Control check
    if ((int) $warehouse->row_version !== (int) $data['row_version']) {
        return response()->json([
            'ok'         => false,
            'error_code' => 'VERSION_CONFLICT',
            'message'    => 'Data diubah oleh pengguna lain. Silakan muat ulang.',
        ], 409);
    }

    $warehouse->update([
        // ... field lainnya ...
        'row_version' => $warehouse->row_version + 1,
    ]);
    
    return response()->json(['ok' => true, 'data' => $warehouse->fresh()]);
}
```

**Di Frontend (Modal Component):**
```tsx
// 1. Simpan row_version di formData state
const [formData, setFormData] = useState({
  name: "",
  row_version: 1
});

// 2. Copy row_version dari data yang diedit
useEffect(() => {
  if (show && tag) {
    setFormData({
      name: tag.name,
      row_version: tag.row_version || 1  // WAJIB!
    });
  }
}, [show, tag]);

// 3. Kirim row_version saat submit
await axios({
  method: "patch",
  url: `/api/tags/${tag.id}`,
  data: formData  // row_version akan terkirim otomatis
});
```

> [!IMPORTANT]
> **Checklist Row Version:**
> - [ ] Kolom `row_version` ada di migration dengan `default(1)`
> - [ ] Model memiliki `row_version` di `$fillable` dan `casts`
> - [ ] API `index` mengirim `row_version` ke frontend
> - [ ] Frontend menyimpan `row_version` di state
> - [ ] Frontend mengirim `row_version` saat update
> - [ ] API `update` validasi `row_version` dan increment setelah update

---

#### Enum Handling di Model dan Service

Untuk kolom enum di database (seperti `type`, `payment_method`):

**Di Model - Gunakan Enum Cast:**
```php
protected function casts(): array
{
    return [
        'type' => TransactionType::class,
        'payment_method' => PaymentMethod::class,
    ];
}
```

**Di Service - Access Enum Value dengan Benar:**
```php
// BENAR: Gunakan ->value untuk akses nilai string enum
$totals = FinanceTransaction::query()
    ->groupBy('type')
    ->get()
    ->mapWithKeys(fn ($item) => [$item->type->value => $item->total]);

$totalIncome = $totals['pemasukan'] ?? 0;

// SALAH: Jangan akses enum sebagai array key langsung
$totals = $query->get()->pluck('total', 'type'); // type adalah enum, bukan string!
```

**Best Practice:**
- Selalu gunakan `mapWithKeys()` dengan `->value` saat membuat lookup array dari enum
- Hindari `pluck('value', 'enum_column')` karena akan menghasilkan enum sebagai key
- Saat query dengan enum, gunakan string value: `where('type', 'pemasukan')` atau `where('type', TransactionType::PEMASUKAN->value)`

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

        static::saving(function (self $transaction) {
            $transaction->amount_base = round(
                (float) $transaction->amount * (float) $transaction->exchange_rate,
                2
            );
        });

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

## E. Running Migration dan Seeder di Production

> [!IMPORTANT]
> Meskipun aplikasi running di production, jika masih dalam tahap development aktif, gunakan flag `--force` untuk bypass confirmation prompt.

### Migration

```bash
# Development/Production (masih development mode)
php artisan migrate --force

# JANGAN gunakan tanpa --force di production karena akan muncul prompt:
# "Are you sure you want to run this command?" (akan timeout di CI/CD)
```

### Seeder

```bash
# Seed specific seeder
php artisan db:seed --class=FinanceTransactionSeeder --force

# Seed all (termasuk TenantMasterDataSeeder)
php artisan db:seed --force
```

### Combined (Migration + Seed)

```bash
# Migration + Seed dalam satu command
php artisan migrate --seed --force

# Atau migration + specific seeder
php artisan migrate --force && php artisan db:seed --class=FinanceTransactionSeeder --force
```

> [!WARNING]
> **Data Loss Warning:** Beberapa migration mungkin melakukan `DROP TABLE` atau `truncate`. Selalu:
> 1. Backup database sebelum migration besar
> 2. Test migration di staging environment terlebih dahulu
> 3. Pastikan seeder menggunakan `firstOrCreate()` atau `updateOrCreate()` untuk menghindari duplicate

---

## F. Standar Komunikasi Frontend-Backend untuk Enum/Type

### Prinsip: Backend adalah Source of Truth

**Backend enum value = Frontend form value = Database value**

Jangan pernah melakukan mapping di business logic. Mapping hanya terjadi di UI layer untuk display label.

### ✅ Pattern yang Benar

**Backend (PHP Enum):**
```php
enum TransactionType: string
{
    case PEMASUKAN = 'pemasukan';
    case PENGELUARAN = 'pengeluaran';
}
```

**API Response:**
```json
{
  "type": "pemasukan"  // ← Same as enum value
}
```

**Frontend Form:**
```tsx
// ✅ BENAR: Form value SAMA dengan backend
const [formData, setFormData] = useState({
  type: "pemasukan"  // ← Same as backend!
});

// Radio buttons menggunakan value yang sama
<input type="radio" value="pemasukan" />
<input type="radio" value="pengeluaran" />
```

**Translation (Hanya untuk Display):**
```json
// en/tenant/finance.json
{
  "finance.types.pemasukan": "Income",
  "finance.types.pengeluaran": "Expense"
}

// id/tenant/finance.json
{
  "finance.types.pemasukan": "Pemasukan",
  "finance.types.pengeluaran": "Pengeluaran"
}
```

**UI Display:**
```tsx
// ✅ BENAR: Translation hanya untuk label display
<label>{t(`finance.types.${formData.type}`)}</label>
// EN: "Income"
// ID: "Pemasukan"
```

### ❌ Pattern yang SALAH

**JANGAN lakukan mapping di business logic:**
```tsx
// ❌ SALAH: Mapping di form state
const typeMap = {
  'pemasukan': 'income',  // Jangan lakukan ini!
  'pengeluaran': 'expense'
};

setFormData({ type: typeMap[transaction.type] });
```

**JANGAN gunakan English value di form:**
```tsx
// ❌ SALAH: Form value berbeda dari backend
const [formData, setFormData] = useState({
  type: "income"  // Backend expects "pemasukan"!
});
```

### Checklist Implementasi Enum

Backend:
- [ ] Enum PHP menggunakan value yang sama dengan database
- [ ] Enum memiliki method `label()` untuk display (optional)
- [ ] API mengirim enum value apa adanya (tidak di-map)

Frontend:
- [ ] Form state menggunakan enum value yang sama dengan backend
- [ ] Translation keys mengikuti enum value backend
- [ ] Radio/Select options menggunakan value yang sama dengan backend
- [ ] Translation hanya untuk display label, bukan untuk form values
- [ ] Tidak ada mapping layer di business logic

### Contoh Lengkap

**Backend Migration:**
```php
$table->enum('type', ['pemasukan', 'pengeluaran']);
```

**Backend PHP Enum:**
```php
enum TransactionType: string
{
    case PEMASUKAN = 'pemasukan';
    case PENGELUARAN = 'pengeluaran';
    
    public function label(): string {
        return match ($this) {
            self::PEMASUKAN => 'Pemasukan',
            self::PENGELUARAN => 'Pengeluaran',
        };
    }
}
```

**Backend Model Cast:**
```php
protected function casts(): array
{
    return [
        'type' => TransactionType::class,
    ];
}
```

**Frontend Translation Keys:**
```json
{
  "finance.types.pemasukan": "Income",
  "finance.types.pengeluaran": "Expense"
}
```

**Frontend Form:**
```tsx
const [formData, setFormData] = useState({
  type: "pemasukan"  // ← Same as backend enum value!
});

// Radio buttons
{['pemasukan', 'pengeluaran'].map((type) => (
  <Form.Check
    key={type}
    value={type}
    label={t(`finance.types.${type}`)}
    checked={formData.type === type}
    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
  />
))}
```

**Frontend API Submit:**
```tsx
// API receives: { type: "pemasukan" }
await axios.post('/api/transactions', formData);
```

### Manfaat Pattern Ini

1. **Konsistensi**: Tidak ada kebingungan tentang value mana yang digunakan
2. **Maintainability**: Menambah enum baru hanya di 1 tempat (backend)
3. **Type Safety**: TypeScript bisa infer enum values dari backend
4. **i18n Ready**: Label bisa berbeda per bahasa tanpa mengubah logic
5. **No Mapping Bugs**: Tidak ada bug akibat mapping yang tidak sinkron

---

#### Tag is_active Management

Untuk modul Tags yang mendukung aktivasi/nonaktivasi:

**Migration:**
```php
Schema::table('tenant_tags', function (Blueprint $table) {
    $table->boolean('is_active')->default(true)->after('usage_count');
    $table->index(['tenant_id', 'is_active']);
});
```

**Model:**
```php
protected $fillable = [
    'tenant_id', 'name', 'color', 'usage_count', 'is_active', 'row_version',
];

protected function casts(): array
{
    return [
        'usage_count' => 'integer',
        'is_active'   => 'boolean',
        'row_version' => 'integer',
    ];
}

public function scopeActive(Builder $query): Builder
{
    return $query->where('is_active', true);
}
```

**Frontend (Index.tsx):**
```tsx
// Badge status untuk tag aktif/nonaktif
<Badge bg={tag.is_active ? 'success' : 'secondary'}>
  {tag.is_active ? t('master.tags.status.active') : t('master.tags.status.inactive')}
</Badge>

// Toggle is_active di modal
<Form.Check
  type="switch"
  id="is-active-switch"
  label={t('master.tags.fields.is_active')}
  checked={formData.is_active}
  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
/>
```

> [!IMPORTANT]
> **Best Practice:** Tags yang sudah tidak digunakan sebaiknya di-nonaktifkan (`is_active = false`) daripada di-hard-delete. Ini menjaga history data tetap ada dan memungkinkan reaktivasi di masa depan.

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
- Gunakan `--force` flag untuk migrate/seed di production development environment.
- **Gunakan enum value backend sebagai form value frontend (Backend-First Enum Strategy).**

**Don't:**

- Jangan menambah route tenant tanpa `tenant.initialize`, `tenant.access`, `permission.team`.
- Jangan hardcode plan check tersebar tanpa reuse `SubscriptionEntitlements`.
- Jangan hardcode string user-facing di komponen React (selalu gunakan `t()`).
- Jangan menampilkan `error.code` mentah ke end-user sebagai pesan toast utama.
- Jangan pakai `$table->unique()` biasa pada tabel soft-delete (akan merusak fitur re-create-after-delete).
- Jangan merge fitur baru tanpa update locale EN **dan** ID bersamaan.
- Jangan lupa `--force` flag saat migrate/seed di production (akan timeout).
- **Jangan lakukan mapping enum di business logic (hanya di UI layer untuk display).**
- **Jangan gunakan English form values jika backend menggunakan Indonesia.**
