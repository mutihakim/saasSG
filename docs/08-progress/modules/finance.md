# Progress - Finance

Status: `In Progress`  
Last updated: `2026-04-05`  
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
- loop WhatsApp Finance sekarang ditutup kembali ke WhatsApp setelah draft sukses disubmit dari PWA
- `/bulk` sekarang mengikuti owner dari member pengirim `whatsapp_jid`, sama seperti `/tx`
- natural language `/tx` dan `/bulk` sekarang dikunci wajib lewat AI provider aktif; default saat ini OpenRouter `qwen/qwen3.6-plus:free`
- mode structured command `deskripsi#jumlah` sekarang tersedia untuk `/tx` dan `/bulk` tanpa AI
- auto-mapping kategori tenant mulai didukung secara strict lewat AI `category_id` yang divalidasi ke kategori finance tenant, khusus flow natural language
- debug payload AI untuk `/tx` dan `/bulk` sekarang disimpan ke intent agar hasil mapping bisa diaudit
- attachment transaksi finance sekarang aktif untuk upload PWA dan media hasil draft WhatsApp
- preview lampiran finance dan WhatsApp sekarang memakai streamed response agar tidak error 500 pada PWA
- bulk entry sekarang tersedia juga dari PWA, bukan hanya dari WhatsApp
- transaksi bulk sekarang diringkas sebagai grup berdasarkan `source_type/source_id`
- detail transaksi sekarang mendukung duplicate, indikator grup, dan add item ke grup
- item bulk sekarang bisa ditambah atau dihapus langsung dari grouped list
- upload gambar attachment sekarang dioptimalkan ke WebP pada backend
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
- `WhatsappFinanceIntentTest` diperluas untuk finalisasi draft dan strict category mapping
- `WhatsappFinanceIntentTest` sekarang juga menutup structured mode dan failure path AI provider untuk natural language

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
- [x] WhatsApp draft bisa mengirim konfirmasi sukses setelah submit dari PWA
- [x] `/bulk` tidak lagi blocking karena payload akun memakai ULID string yang benar
- [x] Owner `/bulk` dikunci ke member pengirim WhatsApp
- [x] AI category mapping tenant valid mulai dipakai pada draft WhatsApp
- [x] Natural language WhatsApp finance tidak lagi diam-diam fallback ke regex saat AI provider gagal
- [x] Structured `deskripsi#jumlah` tersedia untuk `/tx` dan `/bulk`
- [x] Attachment transaksi aktif di PWA dan submit draft WhatsApp
- [x] Bulk entry PWA aktif dan menyatu dengan grouping list
- [x] Duplicate transaksi dari detail preview aktif
- [x] Grouped bulk item mendukung add/delete item
- [x] Preview lampiran finance dan WhatsApp tidak lagi full-buffer raw response
- [ ] Screenshot real device dan QA visual masih perlu dirapikan
- [ ] Export/report advanced masih bisa diperdalam

## Blocker & Dependency

- Blocker sistemik saat ini tidak ada.
- Dependency terbesar tersisa ada pada QA visual lintas device:
  - safe area iPhone / Android
  - sticky behavior
  - focus restoration setelah CRUD

## Next Actions

1. Tambahkan feature test untuk attachment finance dan grouped bulk lifecycle.
2. Pecah sisa concern besar di `Finance/Index.tsx` jika modul makin bertambah.
3. Tambahkan smoke test visual/manual checklist per device profile.

## Referensi

- Feature docs: `docs/03-features/finance.md`
- Template PWA: `docs/guide/pwa-module-template.md`
- Guide utama: `docs/extension-guide.md`
- Test terkait:
  - `project/tests/Feature/FinanceTransactionApiTest.php`
  - `project/tests/Feature/TenantMemberApiTest.php`
