# Velzon Navbar Reference

Gunakan referensi ini sebelum membuat atau merombak UI PWA tenant.

Aturan baku:

- sumber referensi UI utama: `velzon/Saas`
- pilih primitive Velzon dulu sebelum membuat style baru
- gunakan tabel di bawah untuk menemukan file sumber dengan cepat

> [!WARNING]
> Referensi Velzon hanya boleh dibuka **sesuai kebutuhan saat itu**.
> Jangan membuka banyak halaman atau banyak file sekaligus.
> Gunakan tabel ini sebagai index, lalu buka hanya `1-2` file source yang paling relevan dengan surface yang sedang dikerjakan.
> Tujuannya untuk menghindari pemborosan konteks, token, dan waktu analisis.

## Halaman Referensi

| Grup | Link | Isi |
|---|---|---|
| Dashboards & Apps | [Velzon Dashboards & Apps](./velzon-dashboards-apps.md) | Menu dashboard dan app-level pages |
| Auth, Pages & Landing | [Velzon Auth, Pages & Landing](./velzon-auth-pages-landing.md) | Authentication, generic pages, landing pages |
| Base UI | [Velzon Base UI](./velzon-base-ui.md) | Buttons, badges, cards, lists, modals, offcanvas, typography, utilities |
| More | [Velzon More Reference](./velzon-more-reference.md) | Advance UI, widgets, forms, tables, charts, icons, maps |

## Rule of Thumb

| Kebutuhan UI | Lihat Dulu |
|---|---|
| Tombol aksi, ghost, soft, rounded | `Base UI > Buttons` |
| Badge status, pill, subtle, outline | `Base UI > Badges` |
| Surface card, info card, compact block | `Base UI > Cards` |
| List row, grouped list, icon list | `Base UI > Lists` |
| Modal atau fullscreen sheet basis | `Base UI > Modals`, `Base UI > Offcanvas` |
| Input, layout form, select, validation | `Forms` |
| Widget summary, stat tiles, dashboard cards | `Widgets` |
| Placeholder/loading surface | `Base UI > Placeholders` |

## PWA Rule

Untuk semua `PWA Module`:

1. cek tabel referensi Velzon
2. buka source file yang dipetakan
3. reuse class/variant Velzon yang paling dekat
4. baru tambah custom CSS untuk mobile behavior yang memang belum tersedia
