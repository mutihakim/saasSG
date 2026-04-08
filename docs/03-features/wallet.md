# 03 Features - Wallet Module

## 1) Ringkasan

Wallet adalah modul posisi aset keluarga yang mengelola:

- **Real Account** sebagai tempat uang riil berada
- **Wallet** sebagai alokasi logis di bawah account
- **Wishes** sebagai daftar keinginan tanpa mengunci saldo
- **Savings Goals** sebagai target tabungan yang terhubung ke satu wallet

Wallet berjalan di route `/wallet` dan dipisahkan dari Finance. Finance tetap fokus ke pencatatan flow transaksi; perubahan di Finance pada iterasi ini hanya bottom navbar.

## 2) Subscription Logic

- Semua plan sekarang dapat membuka Wallet.
- Plan terendah tetap bisa mengelola account dan opening balance.
- Tiap account selalu punya satu **Main Wallet** sistem yang otomatis dibuat.
- Wallet tambahan non-system mengikuti limit `wallet.pockets.max`.
- Savings Goal dan Wishes memakai limit plan tersendiri.

## 3) Arsitektur Domain

| Entitas | File | Peran |
|---|---|---|
| Real Account | `project/app/Models/TenantBankAccount.php` | Sumber saldo riil |
| Wallet | `project/app/Models/FinancePocket.php` | Alokasi virtual di bawah account |
| Savings Goal | `project/app/Models/FinanceSavingsGoal.php` | Metadata target tabungan per wallet |
| Wish | `project/app/Models/WalletWish.php` | Aspirasi keluarga sebelum menjadi goal |
| Main Wallet Service | `project/app/Services/WalletPocketService.php` | Membuat dan resolve Main Wallet |

Aturan inti:

- satu account wajib punya tepat satu Main Wallet sistem
- satu account dapat punya banyak wallet tambahan
- tidak semua wallet wajib punya goal
- metadata target tidak disimpan di tabel wallet
- `wallet_id` menjadi foreign key di `finance_savings_goals`

## 4) Database & API

### Tabel utama

- `tenant_bank_accounts`
- `finance_pockets`
- `finance_pocket_member_access`
- `finance_savings_goals`
- `wallet_wishes`

### Endpoint Wallet

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/v1/tenants/{tenant}/wallet/accounts` | List account |
| `POST` | `/api/v1/tenants/{tenant}/wallet/accounts` | Create account + Main Wallet |
| `PATCH` | `/api/v1/tenants/{tenant}/wallet/accounts/{account}` | Update account |
| `DELETE` | `/api/v1/tenants/{tenant}/wallet/accounts/{account}` | Delete account |
| `GET` | `/api/v1/tenants/{tenant}/wallet/wallets` | List wallet |
| `POST` | `/api/v1/tenants/{tenant}/wallet/wallets` | Create wallet tambahan |
| `PATCH` | `/api/v1/tenants/{tenant}/wallet/wallets/{wallet}` | Update wallet |
| `DELETE` | `/api/v1/tenants/{tenant}/wallet/wallets/{wallet}` | Delete wallet |
| `GET` | `/api/v1/tenants/{tenant}/wallet/goals` | List savings goal |
| `POST` | `/api/v1/tenants/{tenant}/wallet/goals` | Create savings goal |
| `PATCH` | `/api/v1/tenants/{tenant}/wallet/goals/{goal}` | Update savings goal |
| `DELETE` | `/api/v1/tenants/{tenant}/wallet/goals/{goal}` | Delete savings goal |
| `GET` | `/api/v1/tenants/{tenant}/wallet/wishes` | List wishes |
| `POST` | `/api/v1/tenants/{tenant}/wallet/wishes` | Create wish |
| `PATCH` | `/api/v1/tenants/{tenant}/wallet/wishes/{wish}` | Update wish |
| `DELETE` | `/api/v1/tenants/{tenant}/wallet/wishes/{wish}` | Delete wish |
| `POST` | `/api/v1/tenants/{tenant}/wallet/wishes/{wish}/approve` | Approve wish |
| `POST` | `/api/v1/tenants/{tenant}/wallet/wishes/{wish}/reject` | Reject wish |
| `POST` | `/api/v1/tenants/{tenant}/wallet/wishes/{wish}/convert` | Convert wish ke goal |

## 5) UI / UX

- `/wallet` memakai shell PWA mobile-first dengan sticky topbar 4 lapis, FAB, dan sticky bottom navbar.
- Bottom navbar Wallet terdiri dari `Beranda`, `Akun & Wallet`, `Wishes`, `Goals`.
- Tab `Akun & Wallet` memakai pola akordeon: account sebagai parent, wallet sebagai child.
- Tombol tambah wallet hanya muncul di dalam account yang sedang dibuka.
- Goals menampilkan progress dan wallet pengunci.

## 6) Batasan Saat Ini

- shared wallet masih memakai assignment internal sederhana, belum UI member access penuh
- top up goal masih mengarahkan user ke Finance, belum funding flow goal yang dedicated
- backend internal masih mempertahankan nama tabel/model legacy `finance_pockets` untuk kompatibilitas migrasi
