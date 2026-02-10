# Store Switcher Implementation Plan

## Overview

Replace the raw `localStorage.getItem('currentStoreId')` pattern with a reactive `StoreContextService` and a visible store switcher UI in the sidebar. All store-scoped features (products, categories, orders, customers) will reactively respond to store changes.

---

## Phase 1: StoreContextService

**File**: `projects/merchant/src/app/core/services/store-context.service.ts`

### Responsibilities

- Hold the currently selected store as an Angular signal
- Persist selection to `localStorage` (`currentStoreId`)
- Load user's stores on init via `StoreService.getMyStores()`
- Expose:
  - `currentStore: Signal<StoreDto | null>` — the full store object
  - `currentStoreId: Signal<string | null>` — shortcut for the ID
  - `stores: Signal<StoreDto[]>` — all user stores
  - `loading: Signal<boolean>`
  - `selectStore(storeId: string): void`
  - `refresh(): void` — reload stores list (after create/delete)
- On init: auto-select last used store from localStorage, or first store if none saved
- If no stores exist: set `currentStore` to null (components/guards handle redirect)

### Key Decisions

- Injectable at root level (`providedIn: 'root'`)
- Initialize in `ShellComponent.ngOnInit()` or via APP_INITIALIZER
- Use Angular signals (not BehaviorSubject) for consistency with existing codebase

---

## Phase 2: StoreSwitcherComponent

**File**: `projects/merchant/src/app/shared/components/store-switcher/store-switcher.component.ts`

### UI Design

```
┌──────────────────────────┐
│  🏪 My Coffee Shop    ▾  │  ← Clickable bar at top of sidebar
└──────────────────────────┘
        │
        ▼ (dropdown on click)
┌──────────────────────────┐
│  ✓ My Coffee Shop        │
│    Electronics Hub        │
│    Fashion Store          │
│  ──────────────────────  │
│  + Create New Store       │
└──────────────────────────┘
```

### Behavior

- Shows current store name (or "Select a Store" if none)
- Click toggles dropdown with all stores
- Selecting a store calls `StoreContextService.selectStore(id)`
- "Create New Store" navigates to `/stores/create`
- Click outside closes dropdown
- Show store logo thumbnail if available

---

## Phase 3: Integrate into ShellComponent

**File**: `projects/merchant/src/app/shared/components/shell/shell.component.ts`

### Changes

- Import and place `<app-store-switcher>` at the top of the sidebar, above navigation links
- Initialize `StoreContextService` on shell load
- Sidebar nav items (Products, Orders, Customers) should be visually disabled or hidden if no store is selected

---

## Phase 4: No-Store Guard / Redirect

**File**: `projects/merchant/src/app/core/guards/store.guard.ts`

### Logic

- Guard for routes that require a store context: `/products`, `/orders`, `/customers`
- If `StoreContextService.currentStoreId()` is null:
  - If user has stores → auto-select first one, allow navigation
  - If user has no stores → redirect to `/stores/create`
- Apply guard to relevant routes in `app.routes.ts`

---

## Phase 5: Refactor Existing Components

### ProductListComponent

- **Remove**: `localStorage.getItem('currentStoreId')`
- **Inject**: `StoreContextService`
- **Use**: `storeContext.currentStoreId()` to fetch products
- **React**: Use `effect()` or `computed()` to reload products when store changes

### ProductFormComponent

- Same refactor as above for product creation/editing

### CategoryManagementComponent

- Same refactor — use `StoreContextService` for storeId

### StoreListComponent

- After deleting a store, call `storeContext.refresh()`
- If deleted store was the selected one, auto-switch

### CreateStoreComponent

- After successful creation, call `storeContext.refresh()` and `storeContext.selectStore(newStoreId)`

### StoreDetailsComponent

- After updates, call `storeContext.refresh()` to reflect name/branding changes in switcher

---

## Phase 6: Empty State / Onboarding

### When User Has No Stores

- Dashboard shows a friendly message: "Create your first store to get started"
- Large CTA button to `/stores/create`
- Sidebar switcher shows "No stores yet"

### When Store Is Selected but Has No Products

- Existing empty states in product/category lists are sufficient

---

## File Summary

| Action | File |
|--------|------|
| **Create** | `core/services/store-context.service.ts` |
| **Create** | `shared/components/store-switcher/store-switcher.component.ts` |
| **Create** | `core/guards/store.guard.ts` |
| **Modify** | `shared/components/shell/shell.component.ts` |
| **Modify** | `app.routes.ts` |
| **Modify** | `features/products/product-list/product-list.component.ts` |
| **Modify** | `features/products/product-form/product-form.component.ts` |
| **Modify** | `features/products/category-management/category-management.component.ts` |
| **Modify** | `features/stores/store-list/store-list.component.ts` |
| **Modify** | `features/stores/create-store/create-store.component.ts` |
| **Modify** | `features/stores/store-details/store-details.component.ts` |

---

## Implementation Order

1. StoreContextService (foundation — everything depends on this)
2. StoreSwitcherComponent (UI for the service)
3. ShellComponent integration (place switcher in sidebar)
4. Store guard + route updates
5. Refactor product components (ProductList, ProductForm, CategoryManagement)
6. Refactor store components (StoreList, CreateStore, StoreDetails)
7. Empty state / onboarding UX
