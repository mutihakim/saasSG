# Progress - Wallet

Status: `In Progress`  
Last updated: `2026-04-06`  
Owner: `Finance Team`

## Tujuan Modul

Menjadikan Wallet sebagai modul akun, wallet, wish, dan goal yang:

- berdiri terpisah dari surface finance utama
- tetap memakai akun riil finance sebagai source of truth saldo fisik
- membantu user mengelompokkan dana berdasarkan tujuan
- memberi jalur bertahap dari wish -> goal tanpa mencampur metadata target ke tabel wallet

## Progress Terkini

- modul `wallet` sudah didaftarkan ke permission catalog dan subscription entitlements
- route `/wallet` sudah memakai feature gate `wallet`
- Wallet sekarang menampung CRUD account, wallet, wishes, dan savings goal
- semua plan sekarang bisa membuka Wallet
- free plan tetap dibatasi ke Main Wallet default per account
- setiap account baru otomatis membuat Main Pocket
- tabel `wallet_wishes` sudah aktif
- kolom target di wallet sudah dihapus; target pindah penuh ke `finance_savings_goals`
- shell Wallet baru sudah memakai sticky topbar, FAB, dan sticky bottom navbar
- Finance bottom navbar sudah diubah menjadi `transactions`, `budget`, `stats`, `report`

## Milestone Checklist

- [x] Permission module `wallet` aktif
- [x] Subscription entitlement `wallet` aktif
- [x] Main Pocket system per account tersedia
- [x] CRUD account di Wallet aktif
- [x] CRUD wallet di Wallet aktif
- [x] CRUD wishes dasar aktif
- [x] Approve / reject / convert wish ke goal aktif
- [x] CRUD savings goal dasar aktif
- [x] PRD shell Wallet mobile-first aktif
- [ ] Shared member selector penuh di UI
- [ ] Goal funding flow terpisah
- [ ] Gantt/analytics lanjutan pada dashboard Wallet

## Blocker & Dependency

- Tidak ada blocker sistemik untuk rollout shell dan CRUD dasar.
- Dependency lanjutan:
  - member access shared wallet yang lebih kaya
  - wallet-to-wallet move money
  - funding flow khusus savings goal
  - visual dashboard yang lebih kaya

## Next Actions

1. Tambahkan UI member access untuk wallet shared.
2. Tambahkan dedicated funding flow untuk goal.
3. Perluas dashboard Wallet dengan chart distribusi aset dan timeline goals.

## Referensi

- Feature docs: `docs/03-features/wallet.md`
- Finance relation: `docs/03-features/finance.md`
