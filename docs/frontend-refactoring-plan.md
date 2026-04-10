# Frontend Refactoring Master Plan

**Status:** Completed (Enterprise Baseline Locked)
**Version:** 3.0
**Date:** April 10, 2026
**Scope:** `project/resources/js`, `project/resources/scss`, FE tooling (`tsconfig`, `vite`, `eslint`, `cleanliness-check`)

---

## Executive Summary

Refactor frontend sudah dinaikkan dari mode transisi menjadi baseline enterprise yang konsisten untuk layer utama:

1. **Legacy root folder sudah dinormalisasi**
   - `resources/js/Components` -> `resources/js/components`
   - `resources/js/Layouts` -> `resources/js/layouts`
   - `resources/js/Pages` -> `resources/js/pages`

2. **Legacy utility layer dihapus total**
   - `resources/js/common` sudah dihapus.
   - Semua import utility/core sekarang melalui `core/*`.

3. **Alias legacy dihapus, alias enterprise dikunci**
   - Dihapus: `@components`, `@layouts`, `@pages`, `@common`.
   - Dipakai: `@/components/*`, `@/layouts/*`, `@/pages/*`, `@/core/*`, dst.

4. **Resolver runtime + boundary lint diselaraskan**
   - Inertia resolver di `app.tsx` pindah ke `./pages/**/*.tsx`.
   - Boundary lint `features` vs `pages` menggunakan path lowercase.

5. **Gate verifikasi lulus**
   - `npm run typecheck` -> pass
   - `npm run lint` -> pass (clean)
   - `npm run check:clean` -> pass
   - `npm run build` -> pass

---

## Audit Findings (Final)

### A. Single Source of Truth

| Area | Sebelumnya | Sekarang | Status |
|---|---|---|---|
| Shared util layer | `common/` + `core/` coexist | hanya `core/` aktif, `common/` dihapus | PASS |
| UI shared layer | `Components/*` legacy casing | `components/*` | PASS |
| Page entry layer | `Pages/*` legacy casing | `pages/*` | PASS |
| Layout layer | `Layouts/*` legacy casing | `layouts/*` | PASS |

### B. Naming Consistency

| Rule | Result |
|---|---|
| Root layer folder lowercase | PASS (`components`, `layouts`, `pages`, `core`, `features`) |
| Alias naming konsisten (`@/...`) | PASS |
| Legacy alias camel-prefix (`@components`, dll) | REMOVED |

### C. Boundary Governance

| Rule | Result |
|---|---|
| `features/*` tidak import `pages/*` | enforced via eslint zone + restricted imports |
| `pages/*` sebagai route entry | retained |
| Shared UI via `components/ui/*`, `components/layouts/*`, `components/pwa/*` | retained dan konsisten path lowercase |

---

## Final Architecture Contract

```text
resources/js/
├── app.tsx
├── assets/
├── bootstrap.ts
├── compat/
├── components/
│   ├── ui/
│   ├── layouts/
│   ├── pwa/
│   └── constants/
├── core/
│   ├── config/
│   ├── constants/
│   ├── hooks/
│   ├── lib/
│   └── types/
├── features/
│   ├── invitations/
│   ├── master-data/
│   ├── members/
│   ├── roles/
│   ├── settings/
│   ├── whatsapp/
│   ├── finance/
│   └── games/
├── i18n.ts
├── layouts/
├── locales/
├── pages/
└── types/
```

### Important Decision

Folder internal `pages/*` seperti `Admin`, `Auth`, `Tenant` tetap PascalCase karena kontrak Inertia server-side memakai segment tersebut (`Tenant/Dashboard`, dst). Ini **intentional**, bukan ambiguity arsitektur.

---

## Final Alias Standard

### tsconfig

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["resources/js/*"],
      "@/core/*": ["resources/js/core/*"],
      "@/assets/*": ["resources/js/assets/*"],
      "@/components/*": ["resources/js/components/*"],
      "@/features/*": ["resources/js/features/*"],
      "@/layouts/*": ["resources/js/layouts/*"],
      "@/pages/*": ["resources/js/pages/*"],
      "@/types/*": ["resources/js/types/*"]
    }
  }
}
```

### vite alias

- `@`
- `@/core`
- `@/assets`
- `@/components`
- `@/features`
- `@/layouts`
- `@/pages`
- `@/types`

No legacy alias.

---

## Boundary Lint Rules (Locked)

1. `features` dilarang import dari `pages`.
2. `pages` boleh import dari `features`.
3. Shared non-domain logic masuk ke `core`.
4. Shared UI masuk ke `components/ui`, `components/layouts`, atau `components/pwa`.

---

## Verification Log

Executed on April 10, 2026:

1. `npm run typecheck` -> **PASS**
2. `npm run lint:fix` -> applied
3. `npm run lint` -> **PASS**
4. `npm run check:clean` -> **PASS**
5. `npm run build` -> **PASS**

Build selesai sukses dengan chunking tetap aktif (termasuk `charts-vendor` + split i18n).

---

## Non-Goals (Deliberately Not Forced)

1. Rename seluruh folder segment Inertia (`Admin/Auth/Tenant`) ke lowercase.
2. Meratakan seluruh segment subfolder Inertia (`pages/Tenant/*`) ke kebab-case penuh.

Keduanya bisa dilakukan di fase terpisah jika ingin standar naming full kebab-case sampai level terdalam, tetapi tidak dibutuhkan untuk mencapai baseline enterprise yang stabil saat ini.

---

## Done Criteria

Refactor dinyatakan **done** untuk baseline enterprise karena:

1. Tidak ada lagi layer legacy aktif (`common`, alias lama, root PascalCase).
2. Import path runtime konsisten ke struktur baru.
3. Boundary lint aktif dan sinkron dengan struktur final.
4. Seluruh gate teknis (type, lint, cleanliness, build) lulus.
