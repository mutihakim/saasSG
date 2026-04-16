# 08 - Progress Dashboard

Last updated: `2026-04-15 19:30`

Progress dashboard ini dipakai untuk memantau execution health lintas modul. Detail teknis tetap ada di `03-features/*`.

## Snapshot Status

| Modul | Status | Progress | Owner | Last Updated | Detail |
|---|---|---:|---|---|---|
| RBAC | Done | 100% | Platform Team | 2026-04-02 | Policy per-entitas (`TenantUomPolicy`, `TenantCurrencyPolicy`, dll) sudah modular. [RBAC Progress](./modules/rbac.md) |
| i18n | Done | 100% | Frontend Team | 2026-04-03 | Locale end-to-end selesai: `X-Locale` header → `SetRequestLocale` → `EnsureTenantAccess` respects header → `lang/en+id/validation.php` → `parseApiError` frontend reactive. Finance & Master Data i18n diperluas. [i18n Progress](./modules/i18n.md) |
| Subscription | Done | 95% | Platform Team | 2026-04-02 | Guard + quota tersedia di semua modul Master Data. Tersisa E2E test upgrade flow. [Subscription Progress](./modules/subscription.md) |
| Master Data CRUD | Done | 100% | Platform Team | 2026-04-15 | UoM, Currency, Tag, Category: full CRUD + Policy + Soft-Delete Aware Unique Index + i18n + Toast standardized. List surface kini memakai lazy loading otomatis dengan sort/filter per kolom dan tanpa pagination klasik. |
| Finance | In Progress | 99% | Finance Team | 2026-04-15 | Finance V2 aktif: ULID string, accounts, budgets, shared access, attachment, grouped bulk entry, Wallet/Pocket PWA v1, WhatsApp draft loop, dan baseline provisioning tenant/member yang kini berjalan lintas lifecycle. [Finance Progress](./modules/finance.md) |
| Wallet | In Progress | 75% | Finance Team | 2026-04-06 | Wallet/Pocket v1 aktif: pocket tenant, wallet PWA `/wallet`, CRUD pocket, dan integrasi transaksi normal berbasis pocket. [Wallet Progress](./modules/wallet.md) |
| Games | In Progress | 96% | Frontend Team | 2026-04-14 | Math, Vocabulary, dan Curriculum kini aktif di member area; Curriculum v1 sudah membawa schema global+tenant, entitlement, OCC, import CSV, seeded pilot content, dan history, sementara sisa utama tinggal E2E, screenshot docs, dan selector profil belajar. [Games Progress](./modules/games.md) |
| Tenant Settings | Done | 90% | Platform Team | 2026-03-30 | Tenant profile, billing, localization, dan branding upload per tenant sudah aktif; tersisa verifikasi browser/E2E visual. |
| WhatsApp | Done | 100% | Integration Team | 2026-04-08 | Realtime tetap stabil dengan Reverb internal-only di belakang proxy Nginx `/app`. [WhatsApp Progress](./modules/whatsapp.md) |
| Routing & Websocket | Done | 100% | Platform Team | 2026-04-08 | Ingress publik dipersempit ke Nginx (`80/443`), Reverb bind lokal `127.0.0.1`, dan docs dipublish sebagai static site Nginx. |

## Top Global Blocker

- *Belum ada blocker sistemik yang menghalangi rilis ke staging. Workflow database kini sudah dipangkas ke baseline schema dump + baseline seeder minimum.*

## Perubahan Arsitektural Besar (2026-04-15)

1. **Database Bootstrap Reset**: history migration repo dibersihkan sehingga baseline install baru bertumpu pada `database/schema/pgsql-schema.sql` dan migration schema-only setelahnya.
2. **No Data in Migrations**: permission rollout, morph normalize, counter recalculation, dan backfill tidak lagi disimpan di migration.
3. **Strict Baseline Seeder**: `DatabaseSeeder` kini hanya memanggil baseline platform minimum; sample/demo data dipindah ke jalur manual `DevDemoSeeder`.
4. **Tenant Default Master Data Provisioning**: tenant baru sekarang mengisi currency, UOM, finance categories, dan finance tags lewat service provisioning, bukan mengandalkan seeder global.
5. **Finance Baseline Provisioning**: tenant baru, member linked baru, invitation accept, dan normalize-role repair sekarang bisa memastikan account/wallet baseline finance tanpa bergantung pada demo seeder.
6. **Finance Seeder Restructuring**: baseline finance dipisah tegas dari demo layer. `TenantFinanceAccountSeeder` dan `TenantFinanceWalletSeeder` dihapus karena fungsinya diambil alih `TenantFinanceBaselineService`. Demo seeders (Budget, Planning, Wallet/Pockets, Transactions) dipindah ke namespace `Database\Seeders\Tenant\Finance\Demo`. `FamilyFinanceSeed` kini didokumentasikan sebagai demo-only blueprints.

## Perubahan Arsitektural Besar (2026-04-03)

1. **Finance ULID Modernization**: `finance_transactions.id` sekarang memakai ULID string dan kontrak polymorphic tetap `string(100)`.
2. **Finance Accounts & Budgets**: Tenant kini punya entitas akun (`TenantBankAccount`) dan budget (`TenantBudget`) dengan mode private/shared.
3. **Member-Aware Finance Access**: Akses akun, budget, dan transaksi sekarang discope melalui `FinanceAccessService` sesuai role dan hubungan member.
4. **Transfer-Safe Summary**: Summary family-wide mengecualikan transfer internal dari income/expense agar tidak double count.
5. **Finance PWA Module**: `/finance` tidak lagi dibangun sebagai halaman admin klasik, tetapi sebagai PWA Module yang dibuka dari Hub dan bisa menjadi pola modul lain.
6. **Seed Data Finance V2**: Seeder akun, budget, dan sample transaction tenant sudah tersedia untuk `migrate:fresh --seed --force`.
7. **Docs PWA Template**: Template reusable untuk modul tenant PWA ditambahkan agar pola finance bisa dipakai ulang.
8. **Finance Attachment & Grouped Bulk**: Attachment transaksi, duplicate flow, bulk entry PWA, dan grouped bulk action sekarang aktif pada shell `/finance`.
9. **Wallet / Pocket Layer**: `/wallet` sekarang menjadi Wallet PWA baru untuk pocket virtual yang menempel ke akun riil finance, dan transaksi normal mulai mendukung `pocket_id`.

## Perubahan Arsitektural Besar (2026-04-02)

1. **Modularisasi Controller**: `TenantWorkspaceController` dipecah menjadi controller terpisah per entitas Master Data (`MasterUomApiController`, `MasterCurrencyApiController`, `MasterTagApiController`, `MasterCategoryApiController`).
2. **Policy Per-Entitas**: Menghapus policy monolitik, setiap entitas punya policy modular dengan permission `master.<entity>.view|create|update|delete`.
3. **Soft-Delete Aware Unique Index**: Implementasi Partial Unique Index PostgreSQL (`WHERE deleted_at IS NULL`) untuk semua tabel Master Data — mencegah konflik saat re-create setelah soft-delete.
4. **i18n Full Stack Selesai**: Pesan validasi backend sekarang sepenuhnya reaktif mengikuti pilihan bahasa user (EN/ID) via `X-Locale` header + `SetRequestLocale` global middleware + perbaikan `EnsureTenantAccess` untuk tidak menimpa piilhan user.
5. **Standardized Error Notification**: `parseApiError` di Frontend sekarang translate error code via i18next, sehingga toast notifikasi reaktif bersamaan dengan perubahan bahasa di Topbar.

## Konvensi Update (Per PR/Merge)

1. PR yang mengubah modul wajib update file modul terkait di `08-progress/modules/*`.
2. `08-progress/index.md` diupdate jika ada perubahan status high-level atau blocker global.
3. Gunakan timestamp format `YYYY-MM-DD`.
4. Maksimal 3 item di `Next Actions` untuk menjaga fokus.

## Quick Links

- [RBAC Progress](./modules/rbac.md)
- [i18n Progress](./modules/i18n.md)
- [Subscription Progress](./modules/subscription.md)
- [Finance Progress](./modules/finance.md)
- [Wallet Progress](./modules/wallet.md)
- [Games Progress](./modules/games.md)
- [WhatsApp Progress](./modules/whatsapp.md)
- [Changelog 2026-03](./changelog/2026-03.md)
