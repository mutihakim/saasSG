# Progress - Finance

Status: `In Progress`  
Last updated: `2026-04-03`  
Owner: `Finance Team`

## Tujuan Modul

Menjadikan Finance sebagai modul cashflow tenant yang:
- account-centric
- member-aware
- siap untuk integrasi lintas modul
- punya **PWA Module** yang bisa menjadi pola untuk modul berikutnya

## Progress Terkini

- `finance_transactions.id` sudah dipindah ke **ULID string**
- polymorphic contract finance sudah konsisten ke **`string(100)`**
- akun tenant (`TenantBankAccount`) dan budget tenant (`TenantBudget`) sudah tersedia
- transfer internal sudah dipasangkan melalui `transfer_pair_id`
- summary finance sudah filter-aware dan mengecualikan internal transfer dari income/expense family-wide
- visibilitas member sekarang dibatasi lewat `FinanceAccessService`
- shell `/finance` sudah dipisahkan menjadi **Finance PWA Module**
- rule account/budget bergerak ke model **Private Only** untuk member
- `budget code` dipindah menjadi identifier backend-only dan tidak lagi tampil di UI budget
- `account` tetap tanpa field `code`
- struktur frontend sudah mulai mengikuti pola:
  - `Page.tsx`
  - `Index.tsx`
  - `components/pwa/*`

## Evaluasi Perubahan Worktree

Area perubahan utama yang terlihat dari worktree saat ini:

### Backend

- controller finance bertambah dan dipecah:
  - `FinanceTransactionApiController`
  - `FinanceAccountApiController`
  - `FinanceBudgetApiController`
  - `FinanceReportApiController`
- service finance bertambah:
  - `FinanceAccessService`
  - `FinanceLedgerService`
  - `FinanceSummaryService`
- model finance bertambah:
  - `TenantBankAccount`
  - `TenantBudget`
  - `TenantBudgetLine`
- migration base finance dan polymorphic relation dirombak

### Frontend

- `Hub` dan `/finance` bergerak ke pengalaman PWA/mobile-first
- finance sekarang punya komponen PWA reusable:
  - topbar
  - bottom nav
  - FAB
  - grouped list
  - detail sheet
  - filter panel
  - skeleton
- create/edit/delete transaksi memakai update state lokal agar list tidak reload penuh
- form budget dipangkas agar lebih praktis:
  - field `code` dihapus dari modal
  - backend generate `code` otomatis bila kosong
  - edit data lama tetap aman tanpa breaking change

### Seed & Test

- seed account per tenant dan budget per tenant sudah ditambahkan
- `FinanceTransactionApiTest` sudah menutup alur utama finance

## Milestone Checklist

- [x] ULID string untuk `finance_transactions`
- [x] Polymorphic ID `string(100)` untuk finance-related pivot
- [x] Accounts + Budgets tenant tersedia
- [x] Shared access untuk account dan budget tersedia
- [x] Summary family-wide tidak double count transfer internal
- [x] Finance shell berdiri sebagai PWA Module
- [x] Seed data finance v2 tersedia
- [x] Finance docs fitur diperbarui
- [x] Template PWA module reusable ditulis
- [x] Budget code dipindah ke backend-only workflow
- [ ] Screenshot real device dan QA visual masih perlu dirapikan
- [ ] Export/report advanced masih bisa diperdalam

## Blocker & Dependency

- Blocker sistemik saat ini tidak ada.
- Dependency terbesar tersisa ada pada QA visual lintas device:
  - safe area iPhone / Android
  - sticky behavior
  - focus restoration setelah CRUD

## Next Actions

1. Pecah sisa concern besar di `Finance/Index.tsx` jika modul makin bertambah.
2. Jadikan shell PWA finance sebagai referensi aktif untuk modul tenant lain.
3. Tambahkan smoke test visual/manual checklist per device profile.

## Referensi

- Feature docs: `docs/03-features/finance.md`
- Template PWA: `docs/guide/pwa-module-template.md`
- Guide utama: `docs/extension-guide.md`
- Test terkait:
  - `project/tests/Feature/FinanceTransactionApiTest.php`
  - `project/tests/Feature/TenantMemberApiTest.php`
