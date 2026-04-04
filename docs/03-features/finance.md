# 03 Features - Finance Module

## 1) Ringkasan

Finance sekarang bukan lagi sekadar CRUD transaksi sederhana. Modul ini sudah bergerak ke pola **account-centric**, **member-aware**, dan **Finance PWA Module** yang dibuka dari **Hub**.

Fokus implementasi saat ini:
- transaksi tenant berbasis **ULID string**
- seluruh kolom polymorphic tetap **`string(100)`**
- visibilitas transaksi berbasis role + akses akun/budget
- akun dan budget tenant dapat **private** atau **shared**
- member biasa memakai model **Private Only** untuk account dan budget
- transfer dicatat sebagai **pasangan transaksi internal**
- shell `/finance` berdiri sebagai **Finance PWA Module**

## 2) Kapabilitas Utama

- Mencatat `pemasukan`, `pengeluaran`, dan `transfer`
- Menyimpan transaksi terhadap **akun riil** (`cash`, `bank`, `ewallet`, `credit_card`, `paylater`)
- Menautkan transaksi ke **budget** secara opsional
- Mencatat `owner_member_id` untuk audit dan pengalaman multi-member
- Mendukung **shared access** untuk akun dan budget
- Mengizinkan member biasa CRUD account/budget **private miliknya sendiri** tanpa menyentuh struktur shared
- Menyediakan summary dan report yang filter-aware
- Menulis activity log create/update/delete untuk transaksi finance

## 3) Arsitektur Domain

### Entitas utama

| Entitas | File | Peran |
|---|---|---|
| Transaction | `project/app/Models/FinanceTransaction.php` | Sumber data utama cashflow |
| Account | `project/app/Models/TenantBankAccount.php` | Menyimpan saldo dan akses akun |
| Budget | `project/app/Models/TenantBudget.php` | Menyimpan pagu budget periodik |
| Budget Line | `project/app/Models/TenantBudgetLine.php` | Ledger pemakaian budget |
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

### Accounts / Budgets / Reports

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/v1/tenants/{tenant}/finance/accounts` | List akun yang boleh diakses member |
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
- top bar finance ringkas dan khusus modul
- grouped transaction list per tanggal
- FAB sebagai aksi utama create
- detail transaksi memakai full-screen overlay
- create/edit/delete berjalan dengan **local state upsert/remove**, bukan refresh penuh list
- bottom nav finance terpisah dari bottom nav home `/hub`
- form budget disederhanakan:
  - user hanya mengisi field penting seperti `name`, `period`, `allocated_amount`, `scope`, dan `owner`
  - `code` budget menjadi concern backend, bukan field form utama

## 8) Seed Data

Seeder tenant finance saat ini:

- `project/database/seeders/TenantBankAccountSeeder.php`
  - akun private per member
  - akun shared tenant
- `project/database/seeders/TenantBudgetSeeder.php`
  - budget shared dan sample budget personal
- `project/database/seeders/FinanceTransactionSeeder.php`
  - sample transaksi finance yang memakai account dan budget

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

Yang masih layak dilanjutkan:
- polishing visual untuk device-specific spacing
- report/export yang lebih kaya
- pattern reuse ke modul tenant lain
