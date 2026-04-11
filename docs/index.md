# Family SaaS Documentation

Selamat datang di dokumentasi teknis **Family SaaS**. Dokumentasi ini sekarang terpusat di root repositori untuk memudahkan pengelolaan.

## 📔 Panduan Pengembang (Guides)

Berikut adalah modul-modul utama yang tersedia:

- [🌍 Internationalization (i18n)](./guide/i18n.md)
- [🔐 RBAC & Permissions](./guide/rbac.md)
- [💳 Subscription](./guide/subscription.md)
- [💬 WhatsApp Integration](./guide/whatsapp.md)
- [💸 Finance Module](./03-features/finance.md)
- [👛 Wallet Module](./03-features/wallet.md)
- [🎮 Games Module](./03-features/games.md)
- [🎨 Velzon Navbar Reference](./reference/velzon-navbar-reference.md)
- [📈 Progress Dashboard](./08-progress/index.md)

## 🚀 Cara Menjalankan Lokal

Untuk menjalankan situs dokumentasi ini di mesin lokal:

```bash
# Install dependencies (jika belum)
npm install

# Run development server / preview internal-only
npm run docs:dev

# Build for production
npm run docs:build
```

Source docs berada di root repo `../docs`, dan output static production berada di `../docs/.vitepress/dist` untuk diserve langsung oleh Nginx.

---
*© 2026 mutihakim*
