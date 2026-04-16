# 05 - UI Walkthrough

## Tujuan

Dokumen ini memetakan halaman UI ke route dan backend contract untuk mempercepat debug/extension.

## Tenant Area

| UI Page | Inertia Page | Web Route | Guard Kunci |
|---|---|---|---|
| Dashboard | `Tenant/Dashboard` | `https://{tenant}.appsah.my.id/dashboard` | `tenant.feature:dashboard,view` |
| Members | `Tenant/Members/Index` | `https://{tenant}.appsah.my.id/members` | `tenant.feature:team.members,view` |
| Roles | `Tenant/Roles/Index` | `https://{tenant}.appsah.my.id/roles` | `tenant.feature:team.roles,view` |
| Invitations | `Tenant/Invitations/Index` | `https://{tenant}.appsah.my.id/invitations` | `tenant.feature:team.invitations,view` |
| WhatsApp Settings | `Tenant/WhatsApp/Settings` | `https://{tenant}.appsah.my.id/whatsapp/settings` | `tenant.feature:whatsapp.settings,view` |
| WhatsApp Chats | `Tenant/WhatsApp/Chats` | `https://{tenant}.appsah.my.id/whatsapp/chats` | `tenant.feature:whatsapp.chats,view` |
| Settings landing | redirect | `https://{tenant}.appsah.my.id/settings` | `tenant.initialize`, `tenant.access`, `permission.team` |
| Organization Profile | `Tenant/Settings/Profile` | `https://{tenant}.appsah.my.id/settings/profile` | `tenant.initialize`, `tenant.access`, `permission.team`, controller permission check |
| Branding | `Tenant/Settings/Branding` | `https://{tenant}.appsah.my.id/settings/branding` | `tenant.initialize`, `tenant.access`, `permission.team`, controller permission check |
| Localization | `Tenant/Settings/Localization` | `https://{tenant}.appsah.my.id/settings/localization` | `tenant.initialize`, `tenant.access`, `permission.team`, controller permission check |
| Billing | `Tenant/Settings/Billing` | `https://{tenant}.appsah.my.id/settings/billing` | `tenant.initialize`, `tenant.access`, `permission.team`, controller permission check |
| Upgrade Required | `Tenant/UpgradeRequired` | `https://{tenant}.appsah.my.id/upgrade-required` | redirect dari `tenant.feature` |

## Member Hub Area

| UI Page | Inertia Page | Web Route | Guard Kunci |
|---|---|---|---|
| Finance PWA | `Tenant/Finance/Page` | `https://{tenant}.appsah.my.id/finance` | `tenant.feature:finance,view` |
| Wallet PWA | `Tenant/Wallet/Page` | `https://{tenant}.appsah.my.id/wallet` | `tenant.feature:wallet,view` |
| Games Hub | `Tenant/Frontend/Member/Games` | `https://{tenant}.appsah.my.id/games` | member shell route |
| Math Game | `Tenant/Games/MathGamePage` | `https://{tenant}.appsah.my.id/games/math` | member shell route + Math Game API |
| Vocabulary Game | `Tenant/Games/VocabularyPage` | `https://{tenant}.appsah.my.id/games/vocabulary` | member shell route + Vocabulary Game API |
| Vocabulary Mastered | `Tenant/Games/VocabularyMasteredPage` | `https://{tenant}.appsah.my.id/games/vocabulary/mastered` | member shell route |
| Vocabulary History | `Tenant/Games/VocabularyHistoryPage` | `https://{tenant}.appsah.my.id/games/vocabulary/history` | member shell route |
| Vocabulary Settings | `Tenant/Games/VocabularySettingsPage` | `https://{tenant}.appsah.my.id/games/vocabulary/settings` | member shell route |
| Curriculum Game | `Tenant/Games/CurriculumPage` | `https://{tenant}.appsah.my.id/games/curriculum` | member shell route + Curriculum Game API |
| Curriculum History | `Tenant/Games/CurriculumHistoryPage` | `https://{tenant}.appsah.my.id/games/curriculum/history` | member shell route |

Wallet UX contract:

1. `/wallet` dipakai sebagai shell mobile-first untuk `Beranda`, `Akun & Wallet`, `Wishes`, dan `Goals`.
2. Halaman wallet memakai sticky topbar, FAB, dan sticky bottom navbar yang mengikuti pola Finance PWA.
3. Tiap account selalu memiliki satu Main Wallet sistem; wallet tambahan mengikuti quota subscription.

Games UX contract:

1. Math dan Vocabulary memakai topbar/layout member game yang sama, termasuk exit-guard saat sesi aktif.
2. Feedback benar/salah dan countdown pre-session berasal dari shared component yang sama agar perilaku lintas game konsisten.
3. Vocabulary flow dipisah menjadi `setup`, `learn`, `practice`, dan `summary`; perpindahan screen tidak lagi ditahan oleh satu file page monolitik.
4. Submenu Vocabulary `Mastered`, `History`, dan `Settings` harus membuka halaman data nyata member, bukan placeholder "segera hadir".
5. Popup feedback game harus auto-hide sekitar 1.2 detik dan wajib hilang saat prompt berikutnya muncul agar tidak menutupi soal baru, termasuk pada mode landscape.
6. Vocabulary `Practice` memakai timer per soal sesuai settings per bahasa dan dapat membalik arah terjemahan (`Indonesia -> Bahasa Pilihan` atau `Bahasa Pilihan -> Indonesia`).
7. Vocabulary `Memory Test` memakai counter sesi sebesar jumlah effective words pada hari aktif dan tidak boleh selesai otomatis hanya karena seluruh kata sudah berstatus mastered sebelum sesi dimulai.
8. Vocabulary `History` harus dapat menampilkan sesi `memory_test` sebagai mode terpisah dari `practice`.
9. Vocabulary `Settings` memakai satu content container besar dengan grouped chips/cards dan sticky floating save action yang konsisten dengan halaman setup Vocabulary.
10. Curriculum Game mengikuti pattern Vocabulary untuk `setup -> countdown -> practice -> summary`, tetapi tetap hanya `practice-only` tanpa `learn/mastered/memory_test`.
11. Curriculum `Setup` memakai container, chip selection, dan floating start action yang satu keluarga visual dengan Vocabulary.
12. Curriculum `Practice` wajib menampilkan timer progress, question counter, streak, feedback benar/salah/timeout, dan auto-advance untuk jawaban benar.

## Admin Area

| UI Page | Inertia Page | Route | Guard |
|---|---|---|---|
| Admin Dashboard | `Admin/Dashboard` | `/admin/dashboard` | `superadmin.only` |
| Tenant Directory | `Admin/Tenants` | `/admin/tenants` | `superadmin.only` |
| Tenant Subscriptions | `Admin/TenantSubscriptions` | `/admin/tenants/subscriptions` | `superadmin.only` |

## Master Data UX Contract

1. Surface `/admin/master/categories`, `/admin/master/tags`, `/admin/master/currencies`, dan `/admin/master/uom` memakai list tenant-side di dalam shared shell admin tenant.
2. List master data menggunakan server-side batch pagination dengan lazy loading otomatis saat user mencapai area bawah tabel; tidak ada UI nomor halaman maupun page size selector.
3. Baris header pertama dipakai untuk label + affordance sort; klik header mengubah sort `asc -> desc -> reset default`.
4. Baris header kedua dipakai untuk filter per kolom sesuai tipe data:
   - text input untuk kolom teks
   - dropdown checklist untuk enum/multi-select seperti module, type, status
   - range min/max untuk angka seperti usage count atau base factor
5. Category modal harus tetap bisa memuat parent root sesuai modul walau tabel utama baru memuat sebagian batch.
6. UOM modal harus tetap bisa memuat kandidat `base unit` sesuai dimensi walau tabel utama baru memuat sebagian batch.

## Auth/Profile Area

| UI Page | Route | Catatan |
|---|---|---|
| Login/Register | `/login`, `/register` | bootstrap auth |
| Profile | `/profile` | account overview untuk user yang login |
| Profile Settings | `/profile/settings` | user-level settings |
| Profile Security | `/profile/security` | MFA enable/verify/disable |

## Forbidden UX Contract

Workspace pages yang ditolak karena authorization harus tetap terasa sebagai bagian dari produk yang sama.

Aturannya:

1. Route tenant yang ditolak permission harus menampilkan full-page forbidden state di dalam shell workspace.
2. Hindari fallback ke modal generik atau alert datar untuk unauthorized state.
3. Tenant settings mengikuti kontrak yang sama dengan WhatsApp settings, roles, dan route tenant lain yang sudah memakai cover state.
4. Tenant settings hanya muncul sebagai satu item sidebar `Settings`; subsection `Profile/Branding/Localization/Billing` dijaga sebagai tabs di area konten.

## WhatsApp Chats UX Contract

1. Initial load hanya menampilkan 15 pesan terbaru per chat.
2. Tombol `Load more` muncul sebagai banner center di atas percakapan jika backend mengembalikan `has_more=true`.
3. Klik `Load more` memuat 15 pesan sebelumnya menggunakan cursor `before_id` tanpa melompatkan viewport scroll.
4. Jika API mengembalikan `401`, UI harus menghentikan chain request lanjutan dan redirect ke login dengan return URL (`intended`).

## WhatsApp Settings UX Contract

1. Card status sesi mencakup informasi lifecycle, action connect/disconnect/remove, dan panel QR/Handshake dalam satu surface.
2. Halaman settings wajib memiliki section `Command Guide` yang menjelaskan prefix command (`/`, `!`) dan fungsi command aktif (`ping`, `help`).
3. Seluruh copy di section command wajib i18n EN/ID dan tidak boleh hardcoded.
4. Saat lifecycle `jid_conflict` atau `jid_conflict_migration`, halaman wajib menampilkan warning alert yang menjelaskan nomor bentrok dan tenant owner conflict (berbasis metadata callback).

## Screenshot Checklist

Setiap fitur minimal 3 screenshot:

1. Happy path
2. Forbidden/unauthorized
3. Quota/upgrade atau edge-state

Folder screenshot:

- `docs/assets/screenshots/rbac`
- `docs/assets/screenshots/i18n`
- `docs/assets/screenshots/subscription`
- `docs/assets/screenshots/tenant-settings`
- `docs/assets/screenshots/whatsapp`
