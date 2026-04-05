# PWA Module Template

Panduan ini adalah template reusable untuk membuat **PWA Module tenant** seperti `/finance` yang dibuka dari **Hub** di `/hub`.

Gunakan ini ketika modul baru:
- perlu terasa seperti aplikasi mobile penuh
- punya topbar, bottom nav, FAB, atau fullscreen flow sendiri
- tidak cocok lagi ditaruh di layout admin/member klasik

## 0) Istilah Baku

- `Hub`: home utama member di `/hub`
- `PWA Module`: modul tenant standalone seperti `/finance`
- `PWA`: sifat teknis mobile-first untuk shell, safe area, fullscreen flow, dan bottom nav

## 1) Struktur Minimum

```text
resources/js/Pages/Tenant/<Module>/
├── Page.tsx
├── Index.tsx
└── components/
    ├── <Feature>Modal.tsx
    └── pwa/
        ├── <Module>Topbar.tsx
        ├── <Module>BottomNav.tsx
        ├── <Module>ComposerFab.tsx
        ├── <Module>FilterPanel.tsx
        ├── <Module>Skeletons.tsx
        ├── <Module>ErrorState.tsx
        └── types.ts
```

## 1.1) Referensi UI Wajib

Sebelum membuat surface baru, cek referensi Velzon berikut:

- [`docs/reference/velzon-navbar-reference.md`](../reference/velzon-navbar-reference.md)
- [`docs/reference/velzon-base-ui.md`](../reference/velzon-base-ui.md)
- [`docs/reference/velzon-more-reference.md`](../reference/velzon-more-reference.md)

> [!WARNING]
> Referensi Velzon adalah **lookup index**, bukan bahan untuk dibaca habis.
> Buka hanya file yang memang relevan dengan komponen yang sedang dibuat.
> Jangan menghabiskan konteks agent dengan membaca banyak page contoh yang tidak dibutuhkan.
>
> Standar kerja:
> - cari kategori yang tepat di docs referensi
> - pilih `1-2` file source paling dekat
> - implementasikan dari sana
> - hentikan eksplorasi jika kebutuhan UI sudah jelas

Aturan baku:

- button/action: lihat `Base UI > Buttons`
- badge/status: lihat `Base UI > Badges`
- list/grouped rows: lihat `Base UI > Lists`
- card/surface: lihat `Base UI > Cards`
- form fields/layout: lihat `Forms`
- modal/offcanvas basis: lihat `Base UI > Modals` dan `Base UI > Offcanvas`
- widgets/summary tiles: lihat `Widgets`

## 2) Tanggung Jawab Per Layer

### `Page.tsx`

Gunakan untuk:
- `Head`
- background route-level
- safe area shell
- container lebar maksimum

Jangan gunakan untuk:
- fetch orchestration besar
- modal state kompleks
- business rule list / filter

### `Index.tsx`

Gunakan untuk:
- state utama modul
- fetch / reload callback
- tab state
- modal open/close state
- selected item state
- local upsert/remove setelah create/edit/delete

Jangan gunakan untuk:
- markup besar topbar/list/card/detail
- CSS berat yang seharusnya hidup di `components/pwa/*`

### `components/pwa/*`

Gunakan untuk surface UI reusable:
- sticky topbar
- bottom nav
- FAB
- grouped list / grid
- filter panel
- skeleton
- error state
- detail fullscreen sheet

## 3) Layout Rules

### Safe Area

Selalu hitung:
- `env(safe-area-inset-top)`
- `env(safe-area-inset-bottom)`

Terapkan pada:
- topbar
- bottom nav
- FAB
- fullscreen overlay

### Sticky / Fixed

Standar yang dianjurkan:
- gunakan `sticky` bila ingin elemen tetap memakan ruang normal di layout
- gunakan `fixed` hanya jika memang perlu shell chrome penuh
- jika memakai `fixed`, kompensasikan dengan `padding-top` konten

### Bottom Nav

Jika bottom nav mengambang:
- konten utama wajib punya `padding-bottom` eksplisit
- hitung tinggi nav + safe area + ruang FAB bila perlu
- item paling bawah harus tetap terbaca utuh

## 4) Interaction Rules

### Zero Refresh CRUD

Untuk modul PWA, create/edit/delete tidak boleh default ke full list reload bila bisa dihindari.

Pola yang dianjurkan:
- create: `upsert` item baru ke state lokal
- edit: replace item di state lokal
- delete: remove item dari state lokal
- side summary / badges boleh direfresh terpisah

Tujuan:
- posisi scroll tetap
- item yang sedang dibuka tetap terjaga
- user tidak kehilangan konteks

### Focus Restoration

Jika item dibuka dari list:
- simpan `selectedId`
- setelah save/delete, scroll kembali ke item yang relevan
- bila item dihapus, pindahkan fokus ke item terdekat

### Detail Flow

Standar yang dianjurkan:
- tap list item -> view-first fullscreen sheet
- edit bukan route baru; edit hidup dari state lokal
- delete harus punya confirm dialog dengan `z-index` di atas overlay detail

### Long Form

Untuk form panjang:
- gunakan **accordion** atau progressive disclosure
- jangan pakai banyak tab horizontal untuk mobile bila tidak benar-benar perlu

## 5) Visual Rules

- background halaman: abu terang / surface lembut
- card utama: putih solid, radius besar, shadow tipis
- hindari terlalu banyak border tipis per item
- grouped list lebih baik daripada card kecil berulang
- FAB jadi aksi utama, bukan icon kecil tersembunyi di header

## 5.1) Field Strategy

Untuk form PWA tenant:
- tampilkan hanya field yang benar-benar dibutuhkan user operasional
- identifier internal seperti `code` sebaiknya **tidak dipaksa muncul di UI** bila tidak membantu input harian
- jika sistem tetap butuh identifier:
  - generate di backend saat kosong
  - pertahankan data lama saat edit
  - jangan jadikan user mengisi metadata teknis tanpa alasan kuat

Contoh di Finance:
- `TenantBudget.code` tetap ada untuk referensi internal, tetapi tidak tampil di form budget
- `TenantBankAccount` tidak memakai field `code`

## 6) Filter Strategy

Pisahkan dua jenis filter:

### Quick local filters

Contoh:
- `All`
- `Income`
- `Expense`

Karakter:
- ringan
- cepat
- hanya memengaruhi tampilan lokal list

### Global filters

Contoh:
- member
- account
- category
- custom date range

Karakter:
- hidup di filter panel tersendiri
- menggerakkan summary, list, dan report sekaligus

## 7) Error & Loading

### Loading

Untuk screen utama:
- gunakan skeleton
- hindari spinner tunggal untuk area besar

### Error

Selalu sediakan:
- pesan error manusiawi
- tombol retry
- state kosong yang berbeda dari state error

## 8) Referensi Implementasi Saat Ini

Finance adalah baseline implementasi pertama:

- route shell:
  - `project/resources/js/Pages/Tenant/Finance/Page.tsx`
- orchestrator:
  - `project/resources/js/Pages/Tenant/Finance/Index.tsx`
- pwa components:
  - `project/resources/js/Pages/Tenant/Finance/components/pwa/*`

## 9) Checklist Saat Membuat Modul PWA Baru

- [ ] `Page.tsx` tipis
- [ ] `Index.tsx` hanya orchestration
- [ ] topbar mobile-native
- [ ] bottom nav aman terhadap safe area
- [ ] FAB tidak menimpa nav
- [ ] loading memakai skeleton
- [ ] error state ada retry
- [ ] CRUD tidak memaksa full refresh
- [ ] fokus item tetap terjaga setelah aksi
- [ ] docs fitur + progress modul ikut diperbarui
