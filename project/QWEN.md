# QWEN.md - Project Context

## Project Overview

This is a **SaaS multi-tenant boilerplate application** built with **Laravel 12 + Inertia React**, integrated with a **WhatsApp microservice** and **Laravel Reverb** for real-time WebSocket communication. The project is part of a larger monorepo structure where documentation lives at the repository root (`/var/www/html/apps/family2/docs/`), not inside this `project/` folder.

### Tech Stack

**Backend:**
- Laravel 12 (PHP 8.2+)
- PostgreSQL database
- Stancl/Tenancy for multi-tenant architecture
- Spatie Laravel Permission for RBAC
- Laravel Sanctum for API authentication
- Laravel Reverb for WebSocket broadcasting
- Laravel Socialite for OAuth (Google, GitHub)
- Pusher PHP server (broadcasting adapter)
- pragmaORX Google 2FA
- Guzzle HTTP client

**Frontend:**
- React 19 with TypeScript
- Inertia.js (React adapter) for SPA routing
- React Bootstrap 5 + Bootstrap CSS
- Vite 5 for bundling
- i18next for internationalization (en/id)
- ApexCharts + react-apexcharts for charts
- TanStack React Table for data tables
- Ziggy.js for Laravel route access in JS
- Laravel Echo + Pusher-js for WebSocket
- React Toastify for notifications
- SimpleBar for scrollbars
- Swiper for carousels
- Cloudflare Turnstile (captcha)

**Testing & Quality:**
- Pest PHP 3 + PHPUnit 11 for PHP testing
- Playwright for E2E testing (Chromium)
- ESLint + TypeScript-ESLint for linting
- Prettier for code formatting
- Commitlint + Husky for commit standards
- Laravel Pint for PHP formatting

**Documentation:**
- VitePress for documentation site

### Architecture

- **Multi-tenant** via `stancl/tenancy` — each tenant has isolated data and domain scoping
- **RBAC** via `spatie/laravel-permission` — permission format: `module.action`
- **Subscription/Entitlements** — feature access gated by `SubscriptionEntitlements`
- **Backend API** — Laravel controllers, services, policies, observers
- **Frontend** — Inertia React pages with TypeScript, organized by `features/`, `pages/`, `components/`, `layouts/`
- **Real-time** — Laravel Reverb for WebSocket, Echo on the client
- **WhatsApp integration** — external Node.js microservice for WhatsApp messaging

## Directory Structure

```
project/
├── app/                  # Laravel application code
│   ├── Console/          # Artisan commands
│   ├── DTOs/             # Data transfer objects
│   ├── Enums/            # PHP enums
│   ├── Events/           # Laravel events
│   ├── Exceptions/       # Exception handlers
│   ├── Http/             # Controllers, middleware, requests
│   ├── Jobs/             # Queue jobs
│   ├── Models/           # Eloquent models
│   ├── Observers/        # Model observers
│   ├── Policies/         # Authorization policies
│   ├── Providers/        # Service providers
│   ├── Services/         # Business logic services
│   └── Support/          # Helpers and utilities
├── bootstrap/            # Laravel bootstrap
├── config/               # Laravel configuration
├── database/             # Migrations, seeders, factories
├── lang/                 # Translation files
├── resources/
│   ├── js/
│   │   ├── app.tsx       # Frontend entry point
│   │   ├── assets/       # Static assets
│   │   ├── compat/       # Compatibility shims
│   │   ├── components/   # Reusable React components
│   │   ├── core/         # Core utilities and hooks
│   │   ├── features/     # Feature-specific React modules
│   │   ├── layouts/      # Inertia layouts
│   │   ├── locales/      # i18n locale files
│   │   ├── pages/        # Inertia page components
│   │   └── types/        # TypeScript type definitions
│   └── scss/             # Sass stylesheets
├── routes/               # Laravel routes (web, api, auth, channels, console)
├── scripts/              # Utility scripts (cleanliness check, icon audit)
├── storage/              # Laravel storage (logs, cache, uploads)
├── tests/
│   ├── Unit/             # PHPUnit/Pest unit tests
│   ├── Feature/          # PHPUnit/Pest feature tests
│   └── e2e/              # Playwright E2E tests
├── public/               # Public assets, entry point
└── module-template/      # Template for creating new modules
```

## Key Commands

### Setup
```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
```

### Development
```bash
npm run dev              # Start Vite dev server
php artisan serve        # Start Laravel dev server
php artisan reverb:start # Start Reverb WebSocket server
```

### Build
```bash
npm run build            # Production Vite build
```

### Testing & Quality
```bash
php artisan test         # Run PHPUnit/Pest tests
npm run test:e2e         # Run Playwright E2E tests
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint check
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier formatting
npm run check:clean      # Cleanliness check
```

### Documentation
```bash
npm run docs:dev         # Start VitePress dev server
npm run docs:build       # Build VitePress docs
npm run docs:preview     # Preview VitePress docs
```

### Commit Standards
```bash
# Commits follow conventional commit format
# e.g., feat(auth): add google social login
#     fix(team): enforce owner uniqueness
```

## Development Conventions

### Multi-Tenant Rules
- Always scope tenant-domain queries with `tenant_id`
- Cross-tenant access must return `404`
- Mutable entity updates must honor `row_version` and return `409 VERSION_CONFLICT` on stale writes
- Important mutations must write append-only `activity_logs`

### RBAC & Permissions
- Permission naming: `module.action` format
- Route guards: `tenant.resolve` → `tenant.access` → `permission.team` → `tenant.feature` (when applicable)
- Policies must align with the permission matrix

### Subscription Policy
- All plan/feature access logic must go through `SubscriptionEntitlements`
- Kuota checks may be in controllers for custom JSON responses
- Never hardcode plan limits in controllers/services/policies

### i18n Policy
- No hardcoded user-facing copy in translated areas
- Use consistent translation keys and update relevant locale files

### Testing Practices
- Unit tests in `tests/Unit/`
- Feature tests in `tests/Feature/`
- E2E tests in `tests/e2e/` using Playwright (Chromium)
- Quality gates: `php artisan test`, `npm run typecheck`, `npm run lint`, `npm run build`

### Git Hooks
- **pre-commit**: lint-staged (auto-lints staged files)
- **commit-msg**: commitlint (enforces conventional commits)

### Code Style
- TypeScript strict mode enabled
- Prettier for formatting (JSON, MD, YML, YAML, SCSS, CSS)
- ESLint for React/TypeScript code
- No translation of code identifiers or quoted text in responses

## Important Notes

1. **Documentation location**: Product/architecture docs are at `/var/www/html/apps/family2/docs/`, NOT in `project/docs/`. Always read from the root `docs/` folder.
2. **AGENTS.md workflow**: This project follows a strict docs-first + progress-first workflow. See `AGENTS.md` for details.
3. **Environment**: Database is PostgreSQL (`cabinet_core` for dev, `cabinet_core_test` for tests).
4. **WhatsApp microservice**: Optional external service at `WHATSAPP_SERVICE_URL` (default `http://127.0.0.1:3030`).
5. **Path aliases**: `@/` maps to `resources/js/`, with sub-aliases for `@/core/`, `@/components/`, `@/features/`, `@/layouts/`, `@/pages/`, `@/types/`.
