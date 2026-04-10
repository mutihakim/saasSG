# Tenant Finance Frontend Implementation Plan

## Goal

Reduce repeated network calls when users move between Finance menus, keep UX responsive, and make module structure easier to maintain.

## Final Folder Structure

```text
resources/js/pages/Tenant/Finance/
├── IMPLEMENTATION_PLAN.md
├── AccountsPage.tsx
├── OverviewPage.tsx
├── TransactionsPage.tsx
├── ReportsPage.tsx
├── Planning/
│   ├── BudgetsPage.tsx
│   ├── GoalsPage.tsx
│   └── WishesPage.tsx
├── components/
│   ├── ... (UI building blocks for finance flows)
│   └── pwa/
│       ├── FinanceTopbar.tsx
│       ├── FinanceBottomNav.tsx
│       ├── FinanceModuleBottomNav.tsx
│       └── ... (mobile-first list/detail widgets)
├── hooks/
│   ├── useFinanceData.ts
│   ├── useFinanceFilters.ts
│   ├── useFinanceListSync.ts
│   ├── useFinanceDeleteFlow.ts
│   └── ... (feature-level behavior hooks)
├── data/
│   ├── api/
│   │   └── financeApi.ts
│   └── cache/
│       └── financeCache.ts
└── types.ts
```

## Shared Component Ownership

Use `components/` for presentational UI that can be reused by multiple pages in Finance.

Use `components/pwa/` for mobile-optimized shared primitives (topbar, bottom nav, cards, sheets, grouped list, filters panel).

Keep page-level orchestration in page files (`OverviewPage.tsx`, `TransactionsPage.tsx`, `Planning/*Page.tsx`) and avoid putting business logic inside components.

## Terminology Decision (`Pocket` vs `Wallet`)

Canonical technical entity is `pocket`:
- DB/model/API fields stay `pocket`, `wallet_id`, `/finance/wallets`.
- Frontend domain type stays `FinanceWallet`.
- Cache payload keys also stay `pockets`.

`wallet` is treated as UI/business label and legacy compatibility term:
- Existing translation keys/text can still show "Wallet" for user familiarity.
- Legacy `Wallet/*` hooks are thin re-exports to Finance canonical hooks.
- New core logic should use Finance namespace + `pocket` entity naming.

## Shared Data Layer

`data/cache/financeCache.ts`
- In-memory cache for tenant finance payloads.
- TTL profiles:
  - `structures`: 5 minutes
  - `summary`: 2 minutes
  - `short`: 30 seconds
- Prefix invalidation to clear tenant-scoped keys when backend cache version changes.

`data/api/financeApi.ts`
- Single API client for `/finance/bootstrap`.
- Adds:
  - response cache with short TTL
  - in-flight request deduplication for the same query

## Hook Responsibilities

`hooks/useFinanceStructuresData.ts`
- Source of truth for wallet-related entities (accounts, pockets, budgets, goals, wishes, summary, monthly review).
- Sync per tab (`dashboard`, `accounts`, `budgets`, `goals`, `wishes`) via bootstrap endpoint.
- Uses cache version from backend to invalidate stale cache safely.

`hooks/useFinanceData.ts`
- Source of truth for transactions and reports side data.
- Loads transactions + summary from bootstrap first, then falls back to dedicated endpoints only when needed.
- Supports infinite pagination and entity-scoped refresh.

`hooks/useFinancePlanningState.ts` and `hooks/useFinanceOverviewMetrics.ts`
- Canonical planning/overview state and derived-metrics hooks for Home/Accounts/Planning pages.
- Legacy `Wallet/hooks/*` now re-export these hooks as compatibility aliases.

## Backend/Redis Contract

Backend exposes `cache_version` in bootstrap response.

Any finance structure mutation bumps tenant cache version in Redis (`FinanceCacheKeyService`), so frontend can evict stale in-memory cache by tenant prefix.

All versioned cache keys are tenant-scoped (`finance:tenant:{tenantId}:v{n}:...`) to avoid cross-tenant collisions.

## Expected Network Behavior

Menu switches should mostly produce at most one bootstrap request per section/query (and often zero for quick repeats due short client cache), instead of multiple separate requests (`accounts`, `summary`, `pockets`, `transactions`) every time.

Forced refresh after mutation still fetches fresh data immediately.
