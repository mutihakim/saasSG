# 03 Features - Finance Module

## 1) Ringkasan

Finance sekarang bukan lagi sekadar CRUD transaksi sederhana. Modul ini sudah bergerak ke pola **account-centric**, **member-aware**, dan **Finance PWA Module** yang dibuka dari **Hub**.

Fokus implementasi saat ini:
- transaksi tenant berbasis **ULID string**
- seluruh kolom polymorphic tetap **`string(100)`**
- visibilitas transaksi berbasis role + akses akun/budget
- akun dan budget tenant dapat **private** atau **shared**
- pocket tenant dapat berdiri di atas **akun riil** sebagai dompet virtual berbasis tujuan
- baseline tenant sekarang juga membuat starter finance infrastructure:
  - `1` account private + `1` main wallet sistem untuk tiap member linked aktif
  - `1` account shared keluarga + `1` main wallet shared saat tenant bootstrap
  - baseline ditangani oleh `TenantFinanceBaselineService`, bukan oleh demo seeder
  - lifecycle hooks: tenant bootstrap, member create linked, invitation accept, normalize-roles repair
- demo sample data (budget, planning, pockets, transactions) dipisah tegas ke namespace `Database\Seeders\Tenant\Finance\Demo`
- member biasa memakai model **Private Only** untuk account dan budget
- transfer dicatat sebagai **pasangan transaksi internal**
- shell `/finance` berdiri sebagai **Finance PWA Module**
- attachment transaksi aktif untuk PWA dan draft WhatsApp
- preview lampiran transaksi final memakai `preview_url` relatif dari backend agar aman untuk domain tenant aktif
- bulk entry sekarang bisa dibuat dari WhatsApp dan PWA, lalu ditampilkan sebagai grup ringkas

## 2) Kapabilitas Utama

- Mencatat `pemasukan`, `pengeluaran`, dan `transfer`
- Menyimpan transaksi terhadap **akun riil** (`cash`, `bank`, `ewallet`, `credit_card`, `paylater`)
- Menyimpan pocket/dompet virtual yang selalu terhubung ke satu akun riil
- Menautkan transaksi ke **budget** secara opsional
- Mendukung transaksi normal berbasis `pocket`, lalu menurunkan akun riil dari pocket tersebut
- Mencatat `owner_member_id` untuk audit dan pengalaman multi-member
- Mendukung **shared access** untuk akun dan budget
- Mengizinkan member biasa CRUD account/budget **private miliknya sendiri** tanpa menyentuh struktur shared
- Menyediakan summary dan report yang filter-aware
- Menulis activity log create/update/delete untuk transaksi finance
- Mengizinkan upload lampiran transaksi dan preview langsung dari PWA
- Mendukung duplicate transaksi dari detail preview
- Mendukung grouped bulk item dengan add/delete item per grup

## 3) Arsitektur Domain

### Entitas utama

| Entitas | File | Peran |
|---|---|---|
| Transaction | `project/app/Models/FinanceTransaction.php` | Sumber data utama cashflow |
| Account | `project/app/Models/TenantBankAccount.php` | Menyimpan saldo dan akses akun |
| Budget | `project/app/Models/TenantBudget.php` | Menyimpan pagu budget periodik |
| Budget Line | `project/app/Models/TenantBudgetLine.php` | Ledger pemakaian budget |
| Pocket | `project/app/Models/FinancePocket.php` | Menyimpan dompet virtual berbasis tujuan di atas akun riil |
| Access Service | `project/app/Services/FinanceAccessService.php` | Scope akun, budget, dan transaksi per member |
| Ledger Service | `project/app/Services/FinanceLedgerService.php` | Update saldo akun dan ledger terkait |
| Summary Service | `project/app/Services/FinanceSummaryService.php` | Agregasi summary + pengecualian transfer internal |

### Identifier internal

- `TenantBudget.code` tetap ada di database sebagai identifier internal untuk audit, export, dan referensi admin
- `TenantBudget.code` **tidak lagi ditampilkan di UI Finance PWA**
- bila `code` tidak dikirim saat create/update, backend akan:
  - membuat `code` otomatis saat data baru dibuat
  - mempertahankan `code` lama bila budget existing diedit tanpa mengubah kode
- `TenantBankAccount` **tidak memiliki field `code`**
- account diidentifikasi lewat kombinasi `name`, `type`, `currency_code`, `scope`, dan `owner_member_id`
- `FinancePocket.reference_code` dipakai sebagai identifier virtual ringan untuk UI pocket

### Prinsip multi-tenant dan multi-member

- `Tenant` merepresentasikan keluarga
- `TenantMember` merepresentasikan ayah/ibu/anak/dll
- setiap transaksi wajib punya `owner_member_id`
- `Owner/Admin` default melihat seluruh transaksi tenant
- `Owner/Admin` bisa CRUD shared dan private account/budget
- member biasa memakai model **Private Only**:
  - bisa CRUD transaksi miliknya
  - bisa CRUD account private miliknya sendiri
  - bisa CRUD budget private miliknya sendiri
  - tidak bisa membuat atau mengubah item shared
- member biasa default melihat transaksi yang relevan terhadap dirinya:
  - transaksi miliknya
  - transaksi pada akun yang bisa dia lihat/pakai
  - transaksi pada budget yang bisa dia lihat
  - transfer yang melibatkan akun yang bisa dia akses

## 4) Database & ID Strategy

### Finance Transaction

- `finance_transactions.id` memakai **ULID string**
- model memakai `HasUlids`, bukan workaround legacy
- kolom integrasi baru:
  - `source_type`
  - `source_id`
  - `bank_account_id`
  - `pocket_id`
  - `budget_id`
  - `owner_member_id`
  - `budget_status`
  - `budget_delta`
  - `is_internal_transfer`
  - `transfer_pair_id`

### Polymorphic rule

Sesuai `docs/extension-guide.md`, seluruh kolom polymorphic tetap:

```php
$table->string('taggable_id', 100);
$table->string('attachable_id', 100);
$table->string('ruleable_id', 100);
$table->string('source_id', 100);
```

> [!IMPORTANT]
> Finance memakai ULID string, **bukan binary**, agar tetap konsisten dengan seluruh polymorphic contract repo.

## 5) API Surface

### Transactions

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/v1/tenants/{tenant}/finance/transactions` | List transaksi filter-aware |
| `GET` | `/api/v1/tenants/{tenant}/finance/summary` | Summary berdasarkan filter aktif |
| `POST` | `/api/v1/tenants/{tenant}/finance/transactions` | Create income/expense |
| `PATCH` | `/api/v1/tenants/{tenant}/finance/transactions/{transaction}` | Update transaksi |
| `DELETE` | `/api/v1/tenants/{tenant}/finance/transactions/{transaction}` | Delete transaksi |
| `POST` | `/api/v1/tenants/{tenant}/finance/transactions/{transaction}/attachments` | Upload lampiran transaksi |
| `GET` | `/api/v1/tenants/{tenant}/finance/transactions/{transaction}/attachments/{attachment}/preview` | Preview lampiran transaksi |
| `DELETE` | `/api/v1/tenants/{tenant}/finance/transactions/{transaction}/attachments/{attachment}` | Hapus lampiran transaksi |

### Accounts / Budgets / Reports

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/v1/tenants/{tenant}/finance/whatsapp-intents/{token}` | Load draft WhatsApp untuk review di PWA |
| `POST` | `/api/v1/tenants/{tenant}/finance/whatsapp-intents/{token}/submitted` | Finalisasi draft WhatsApp yang sudah disimpan dari PWA |
| `GET` | `/api/v1/tenants/{tenant}/finance/whatsapp-media/{media}/preview` | Preview lampiran WhatsApp untuk draft intent |
| `GET` | `/api/v1/tenants/{tenant}/finance/accounts` | List akun yang boleh diakses member |
| `GET` | `/api/v1/tenants/{tenant}/wallet/pockets` | List pocket yang boleh diakses member |
| `POST` | `/api/v1/tenants/{tenant}/wallet/pockets` | Create pocket |
| `PATCH` | `/api/v1/tenants/{tenant}/wallet/pockets/{pocket}` | Update pocket |
| `DELETE` | `/api/v1/tenants/{tenant}/wallet/pockets/{pocket}` | Delete pocket |
| `POST` | `/api/v1/tenants/{tenant}/finance/accounts` | Create account |
| `PATCH` | `/api/v1/tenants/{tenant}/finance/accounts/{account}` | Update account |
| `DELETE` | `/api/v1/tenants/{tenant}/finance/accounts/{account}` | Delete account |
| `GET` | `/api/v1/tenants/{tenant}/finance/budgets` | List budget by period |
| `POST` | `/api/v1/tenants/{tenant}/finance/budgets` | Create budget, `code` boleh kosong dan akan di-generate backend |
| `PATCH` | `/api/v1/tenants/{tenant}/finance/budgets/{budget}` | Update budget, `code` lama dipertahankan bila payload tidak mengirim kode |
| `DELETE` | `/api/v1/tenants/{tenant}/finance/budgets/{budget}` | Delete budget |
| `GET` | `/api/v1/tenants/{tenant}/finance/reports` | Report aggregate untuk tab stats/reports |

## 6) Summary & Cashflow Rule

Summary finance sekarang tidak lagi dihitung hanya dari list frontend. Summary berasal dari backend dengan filter yang sama dengan list.

Aturan penting:
- filter member spesifik: agregasi terhadap member tersebut
- filter tenant/family-wide: agregasi tenant penuh
- **transfer internal dikeluarkan dari income/expense family-wide** agar tidak double count
- transfer tetap muncul di history transaksi dan movement akun

## 7) UI / PWA Shell

### Struktur file

| Layer | File / Folder | Tanggung jawab |
|---|---|---|
| Route shell | `project/resources/js/Pages/Tenant/Finance/Page.tsx` | Surface route-level finance |
| Orchestrator | `project/resources/js/Pages/Tenant/Finance/Index.tsx` | State, fetch, modal, tab, zero-refresh |
| PWA components | `project/resources/js/Pages/Tenant/Finance/components/pwa/*` | Topbar, nav, grouped list, sheet, FAB, skeleton |
| Form modals | `project/resources/js/Pages/Tenant/Finance/components/*Modal.tsx` | Create/edit account, budget, transaction, transfer |

### Pola UX

- `/finance` berdiri sebagai **PWA Module** yang dibuka dari `Hub`
- `/wallet` berdiri sebagai **PWA Module** terpisah untuk mengelola pocket
- top bar finance ringkas dan khusus modul
- grouped transaction list per tanggal
- item bulk dengan `source_type = finance_bulk` dan `source_id` sama diringkas jadi satu row grup
- FAB sebagai aksi utama create
- detail transaksi memakai full-screen overlay
- create/edit/delete berjalan dengan **local state upsert/remove**, bukan refresh penuh list
- bottom nav finance terpisah dari bottom nav home `/hub`
- form budget disederhanakan:
  - user hanya mengisi field penting seperti `name`, `period`, `allocated_amount`, `scope`, dan `owner`
  - `code` budget menjadi concern backend, bukan field form utama
- form transaksi normal sekarang memilih `pocket`; akun riil tampil sebagai sumber dana turunan

### Attachment & Bulk UX

- modal transaksi mendukung upload multi-file
- gambar upload dioptimalkan ke `WebP` pada backend
- draft WhatsApp dapat membawa banyak media (`media_items`)
- lampiran WhatsApp yang ikut draft akan ditempel ke transaksi saat draft disubmit
- media draft WhatsApp sementara disimpan di `storage/app/tenants/{tenant_id}/whatsapp/drafts/{Y}/{m}/...`
- attachment final finance disimpan di:
  - `storage/app/tenants/{tenant_id}/finance/attachments/transactions/{transaction_id}/...` untuk transaksi single/manual
  - `storage/app/tenants/{tenant_id}/finance/attachments/groups/{source_id}/{media_id}.webp` untuk file bersama grup bulk WhatsApp
- submit draft WhatsApp sekarang mengembalikan transaksi final yang sudah ditempeli attachment, sehingga preview detail tidak bergantung pada refresh manual
- bulk attachment WhatsApp memakai satu file fisik bersama per `source_id`, lalu direferensikan oleh tiap item transaksi dalam grup
- cleanup media draft dijalankan oleh command terjadwal `whatsapp:draft-media:cleanup`
- bulk entry PWA punya modal khusus `Bulk Entry` dengan tombol `Tambah Item`
- row grup bulk di list utama mendukung:
  - expand/collapse
  - tambah item ke grup
  - hapus grup sekaligus
- detail transaksi sekarang mendukung:
  - duplicate transaksi
  - info `Bagian dari grup`
  - shortcut tambah item jika transaksi tersebut bagian dari bulk group

## 8) Seed Data

Struktur seeder finance sekarang dipisah menjadi **baseline infrastructure** dan **demo layering**:

### Baseline Infrastructure (provisioning)

Baseline accounts/wallets tidak lagi dibuat oleh seeder terpisah. 
`TenantFinanceBaselineService` menangani provisioning saat:
- tenant bootstrap (`TenantBaselineSeeder` → `TenantProvisionService::provision()`)
- tenant registration (`TenantProvisionService::provisionDefaultWorkspaceForUser()`)
- member create linked (`TenantMemberApiController@store`)
- invitation accept (`TenantLifecycleApiController@invitationsAccept`)
- role normalize/repair (`NormalizeTenantMemberRoles` command)

Hasil baseline per tenant:
- 1 shared account "Kas Keluarga" + 1 main wallet "Utama" (is_system=true)
- 1 private account "Kas {FirstName}" + 1 main wallet "Utama" per member linked aktif

### Demo Layering

Demo sample data berada di namespace `Database\Seeders\Tenant\Finance\Demo`:

- `Tenant/Finance/Demo/TenantFinanceWalletSeeder.php`
  - ensures main wallet icon/color per baseline account
  - membuat demo pockets dari `FamilyFinanceSeed::pocketBlueprints()` (gracefully skip jika account tidak match)
- `Tenant/Finance/Demo/TenantFinanceBudgetSeeder.php`
  - sample budgets dari `FamilyFinanceSeed::budgetBlueprints()` (skip jika account/pocket tidak ada)
- `Tenant/Finance/Demo/TenantFinancePlanningSeeder.php`
  - sample savings goals/wishes (enterprise only, skip jika account tidak ada)
- `Tenant/Finance/Demo/TenantFinanceDemoSeeder.php`
  - sample transaksi finance dari `FamilyFinanceSeed::demoTransactions()` (skip jika account/pocket/category tidak ada)

`FamilyFinanceSeed` (di `database/seeders/Support/`) berisi **static blueprints** untuk demo saja, bukan source of truth baseline.

`DevDemoSeeder` menjalankan urutan:
1. Platform identity & permissions
2. Tenant baseline (members, roles, master data, finance baseline accounts/wallets)
3. Demo wallets/pockets (TenantFinanceWalletSeeder)
4. Demo budgets, planning, transactions (TenantFinanceBudgetSeeder, TenantFinancePlanningSeeder, TenantFinanceDemoSeeder)
5. Other domain demos (CurriculumPilotSeeder, MandarinVocabularySeeder)

```bash
php artisan migrate:fresh --seed --force
```

## 9) Testing & Verification

### Automated

```bash
php artisan migrate:fresh --seed --force
php artisan test tests/Feature/FinanceTransactionApiTest.php
```

### Quality gates frontend / docs

```bash
cd project && npm run typecheck
cd project && npm run build
npm run docs:build
```

## 10) Known Direction

Yang sudah menjadi baseline:
- account-centric finance
- role-aware transaction visibility
- shared account / shared budget
- finance standalone PWA shell
- WhatsApp finance intent (`/tx` dan `/bulk`) membuat draft, bukan auto-post transaksi final
- draft WhatsApp sekarang bisa:
  - memakai 2 mode input yang berbeda:
    - natural language: wajib diproses AI provider yang aktif, dengan default OpenRouter `qwen/qwen3.6-plus:free`; jika AI gagal, sistem tidak membuat link review dan akan mengirim pesan error ke WhatsApp
    - structured command: bisa diparse tanpa AI dengan format `deskripsi#jumlah`
  - auto-map `category_id` tenant hanya pada mode natural language saat AI mengembalikan ID kategori finance yang valid
  - mengunci owner batch ke member pemilik `whatsapp_jid` pengirim
  - mengirim konfirmasi kembali ke WhatsApp setelah draft berhasil disubmit dari PWA
  - menyimpan debug payload AI di intent (`raw_input`, `extracted_payload`, `ai_raw_response`) untuk audit parsing

### Kontrak WhatsApp intent

- `/tx` natural language, contoh `/tx nasi goreng 3 porsi total harga 42000`, wajib lewat AI provider aktif
- `/bulk` natural language, contoh `/bulk beli telur 10000, susu 20000`, wajib lewat AI provider aktif
- `/tx` structured command, contoh `/tx nasi goreng 3 porsi#42000`, diparse lokal tanpa AI
- `/bulk` structured command, contoh `/bulk telur#10000, susu#20000`, diparse lokal tanpa AI
- mode structured tidak melakukan auto-mapping kategori; user memilih kategori sendiri saat review di PWA
- default konfigurasi saat ini memakai OpenRouter model `qwen/qwen3.6-plus:free`
- jika provider AI tidak tersedia, kuota habis, atau respons AI invalid, intent natural language ditandai gagal dan WhatsApp menerima pesan error, bukan link review

Yang masih layak dilanjutkan:
- polishing visual untuk device-specific spacing
- QA manual final untuk duplicate + grouped bulk interaction di perangkat mobile
- report/export yang lebih kaya
- pattern reuse ke modul tenant lain
