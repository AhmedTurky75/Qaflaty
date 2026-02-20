# Guest Cart Implementation Plan

## Todo List

### Layer 1 — Domain
- [x] **1.1** Extend `Cart` aggregate — add `GuestId`, `StoreId`, `IsGuestCart`, `CreateForCustomer`, `CreateForGuest`
- [x] **1.2** Extend `ICartRepository` — add `GetByGuestIdAsync` and `DeleteExpiredGuestCartsAsync`

### Layer 2 — Infrastructure
- [x] **2.1** Update `CartConfiguration` — nullable `customer_id`, filtered unique indexes, new columns
- [x] **2.3** Implement new `CartRepository` methods — `GetByGuestIdAsync`, `DeleteExpiredGuestCartsAsync`, update `GetActiveCartsByStoreAsync`
- [x] **2.2** Generate migration (`AddGuestCartSupport`), inspect, then apply *(run last in this layer)*

### Layer 3 — Application
- [x] **3.1** Create `CartOwnerContext.cs` — discriminated union (`CustomerOwner` / `GuestOwner`)
- [x] **3.2** Update all 6 command/query records — replace `StoreCustomerId CustomerId` with `CartOwnerContext Owner`
- [x] **3.3** Create `CartOwnerResolver.cs` — shared `ResolveExistingCartAsync` / `ResolveOrCreateCartAsync` helper
- [x] **3.4** Update 5 simple handlers — use `CartOwnerResolver`; add max-qty and max-items guards in `AddCartItemCommandHandler`
- [x] **3.5** Update `SyncCartCommandHandler` — inject `ITenantContext`, merge + delete server-side guest cart by `GuestSessionId`
- [x] **3.6** Update `CartDto` — make `CustomerId` nullable, add `GuestId`; fix all construction sites
- [x] **3.7** Update `ActiveCartDto` + `GetActiveCartsQueryHandler` — null-safe `CustomerId` access (critical crash fix)

### Layer 4 — API
- [x] **4.1** Create `GuestCartController` — unauthenticated, validates `X-Guest-Id`, 5 mirrored endpoints
- [x] **4.2** Update `StorefrontCartController` — wrap owner in `CartOwnerContext.CustomerOwner`, add `GuestSessionId` to sync request
- [x] **4.3** Create `GuestCartCleanupService` — `BackgroundService`, daily 30-day TTL cleanup; register in `DependencyInjection.cs`

### Layer 5 — Frontend
- [x] **5.1** Create `GuestSessionService` — UUID generation + localStorage persistence
- [x] **5.2** Create `guestCartInterceptor` — adds `X-Guest-Id` header to `/storefront/guest-cart` requests
- [x] **5.3** Register `guestCartInterceptor` in `app.config.ts` (between store-header and customer-auth interceptors)
- [x] **5.4** Update `CartApiService` — add 4 guest methods targeting `/storefront/guest-cart`
- [x] **5.5** Update `CartService` — call guest API in `else` branch when not logged in
- [x] **5.6** Update `CustomerAuthService.syncCart()` — send `guestSessionId`, clear UUID post-sync, fix 2 pre-existing bugs
- [x] **5.7** Update merchant Active Carts UI — `guestId` field in interface, guest badge in template

---

## Context

Merchants need to see anonymous (guest) shoppers' carts alongside authenticated customers in the Active Carts dashboard. Currently, guest carts live only in `localStorage` — they never reach the server. This plan adds server-side persistence for guest carts via **unauthenticated endpoints** that internally reuse the **same commands and queries** as authenticated endpoints, with the owner type abstracted through a `CartOwnerContext` discriminated union.

**Security invariants:**
- Guest cart is always scoped to a store (TenantMiddleware enforces store resolution)
- Guest UUID invalidated after login sync; server deletes guest cart on merge
- 30-day TTL cleanup job removes stale guest carts
- Max 100 qty/item and 50 items/cart enforced at the command level

---

## Architecture Summary

```
Authenticated:  [Authorize]  → CustomerId from JWT claims     → CartOwnerContext.CustomerOwner
Guest:          [No Auth]    → X-Guest-Id header              → CartOwnerContext.GuestOwner
                             + StoreId from TenantContext
                                           ↓
                                Same commands / queries
                                Same domain logic
```

---

## Layer 1 — Domain

### Step 1.1 — Extend `Cart` aggregate
**File:** `src/Qaflaty.Domain/Storefront/Aggregates/Cart/Cart.cs`

- Make `CustomerId` nullable: `StoreCustomerId?`
- Add `GuestId: string? { get; private set; }`
- Add `StoreId: StoreId? { get; private set; }`
- Add computed `bool IsGuestCart => GuestId != null`
- Rename `Create(StoreCustomerId)` → `CreateForCustomer(StoreCustomerId customerId, StoreId? storeId = null)`
- Add new factory `CreateForGuest(string guestId, StoreId storeId)`

### Step 1.2 — Extend `ICartRepository`
**File:** `src/Qaflaty.Domain/Storefront/Repositories/ICartRepository.cs`

Add two new method signatures:
```csharp
Task<Cart?> GetByGuestIdAsync(string guestId, StoreId storeId, CancellationToken ct = default);
Task<int> DeleteExpiredGuestCartsAsync(DateTime cutoff, CancellationToken ct = default);
```

---

## Layer 2 — Infrastructure

### Step 2.1 — Update EF Core cart configuration
**File:** `src/Qaflaty.Infrastructure/Persistence/Configurations/Storefront/CartConfiguration.cs`

- `customer_id` column: set `.IsRequired(false)`
- Drop plain unique index on `customer_id`; recreate as filtered: `.HasFilter("customer_id IS NOT NULL")`
- Add `guest_id varchar(36)` nullable column
- Add `store_id uuid` nullable column with `StoreId` value converter
- Add filtered composite unique index `(guest_id, store_id)` with `.HasFilter("guest_id IS NOT NULL")`
- `builder.Ignore(c => c.IsGuestCart)` (computed property)

### Step 2.2 — EF Core migration
Run **after all C# compiles successfully**:
```bash
dotnet ef migrations add AddGuestCartSupport --project src/Qaflaty.Infrastructure --startup-project src/Qaflaty.Api
```
Manually verify the generated migration before applying:
- `customer_id` altered to nullable
- Filtered unique index on `customer_id` uses `"customer_id IS NOT NULL"` (PostgreSQL syntax)
- New `(guest_id, store_id)` composite filtered index present
Then apply:
```bash
dotnet ef database update --project src/Qaflaty.Infrastructure --startup-project src/Qaflaty.Api
```

### Step 2.3 — Implement new repository methods
**File:** `src/Qaflaty.Infrastructure/Persistence/Repositories/CartRepository.cs`

- `GetByGuestIdAsync`: `FirstOrDefaultAsync(c => c.GuestId == guestId && c.StoreId == storeId)` + `Include(c => c.Items)`
- `DeleteExpiredGuestCartsAsync`: filter `GuestId != null && UpdatedAt < cutoff`, `RemoveRange`, return count
- Update `GetActiveCartsByStoreAsync` — add OR clause to include guest carts via direct `StoreId`:
  ```csharp
  Where(c => c.Items.Any() &&
    (c.StoreId == storeId ||
     c.Items.Any(i => _context.Products.Any(p => p.Id == i.ProductId && p.StoreId == storeId))))
  ```

---

## Layer 3 — Application

### Step 3.1 — Create `CartOwnerContext` discriminated union
**File (new):** `src/Qaflaty.Application/Common/CartOwnerContext.cs`

```csharp
public abstract record CartOwnerContext {
    public sealed record CustomerOwner(StoreCustomerId CustomerId) : CartOwnerContext;
    public sealed record GuestOwner(string GuestId, StoreId StoreId) : CartOwnerContext;
}
```

### Step 3.2 — Update all 6 command/query records
Replace `StoreCustomerId CustomerId` with `CartOwnerContext Owner` in each:

| File | Change |
|---|---|
| `AddCartItemCommand.cs` | `StoreCustomerId CustomerId` → `CartOwnerContext Owner` |
| `RemoveCartItemCommand.cs` | same |
| `UpdateCartItemQuantityCommand.cs` | same |
| `ClearCartCommand.cs` | same |
| `SyncCartCommand.cs` | same + add `string? GuestSessionId = null` |
| `GetCustomerCartQuery.cs` | same |

### Step 3.3 — Create `CartOwnerResolver` helper
**File (new):** `src/Qaflaty.Application/Storefront/Common/CartOwnerResolver.cs`

Static helper used by all handlers to eliminate duplication:
```csharp
// Finds existing cart or returns null
Task<Cart?> ResolveExistingCartAsync(CartOwnerContext owner, ICartRepository repo, CancellationToken ct)

// Finds or creates cart, never null
Task<Cart> ResolveOrCreateCartAsync(CartOwnerContext owner, ICartRepository repo, CancellationToken ct)
```
Internally switches on `CartOwnerContext` type:
- `CustomerOwner` → `GetByCustomerIdAsync` / `Cart.CreateForCustomer`
- `GuestOwner` → `GetByGuestIdAsync` / `Cart.CreateForGuest`

### Step 3.4 — Update 5 simple command/query handlers
For each handler, replace direct `GetByCustomerIdAsync(request.CustomerId)` with `CartOwnerResolver` call.

Additional guards added in `AddCartItemCommandHandler`:
- `quantity > 100` → return failure `Cart.QuantityTooHigh`
- `cart.Items.Count >= 50` → return failure `Cart.TooManyItems`

**Files to update:**
- `AddCartItemCommandHandler.cs`
- `RemoveCartItemCommandHandler.cs`
- `UpdateCartItemQuantityCommandHandler.cs`
- `ClearCartCommandHandler.cs`
- `GetCustomerCartQueryHandler.cs`

### Step 3.5 — Update `SyncCartCommandHandler`
**File:** `src/Qaflaty.Application/Storefront/Commands/SyncCart/SyncCartCommandHandler.cs`

Inject `ITenantContext`. Updated flow:
1. `ResolveOrCreateCartAsync(request.Owner, ...)` — always `CustomerOwner` for sync
2. If `request.GuestSessionId != null`: fetch guest cart via `GetByGuestIdAsync(guestSessionId, tenantContext.CurrentStoreId, ct)`. If found: `cart.MergeGuestCart(guestCart.Items)` then `_cartRepository.Delete(guestCart)`
3. Merge `request.GuestItems` (localStorage items) as before
4. Save and return updated `CartDto`

### Step 3.6 — Update `CartDto`
**File:** `src/Qaflaty.Application/Storefront/DTOs/CartDto.cs`

```csharp
record CartDto(Guid Id, Guid? CustomerId, string? GuestId, List<CartItemDto> Items, int TotalItems, DateTime CreatedAt, DateTime UpdatedAt)
```
Update all construction sites: `cart.CustomerId?.Value` for CustomerId, `cart.GuestId` for GuestId.

### Step 3.7 — Update `ActiveCartDto` + `GetActiveCartsQueryHandler`
**File:** `src/Qaflaty.Application/Storefront/DTOs/ActiveCartDto.cs`
- `CustomerId: Guid` → `CustomerId: Guid?`
- Add `GuestId: string?`

**File:** `src/Qaflaty.Application/Storefront/Queries/GetActiveCarts/GetActiveCartsQueryHandler.cs`

> **Critical breaking site:** handler calls `c.CustomerId.Value` unconditionally — will throw `NullReferenceException` for guest carts.

Fixes:
```csharp
// Filter only non-null customer IDs for the lookup
var customerIds = carts.Where(c => c.CustomerId.HasValue)
                       .Select(c => c.CustomerId!.Value).Distinct();

// Null-safe lookup
customerLookup.TryGetValue(cart.CustomerId?.Value ?? Guid.Empty, out var customer);
// customer == null for guest carts → existing "Guest" fallback handles display
```

---

## Layer 4 — API

### Step 4.1 — Create `GuestCartController`
**File (new):** `src/Qaflaty.Api/Controllers/GuestCartController.cs`

- Route: `api/storefront/guest-cart`
- **No `[Authorize]` attribute** — TenantMiddleware already enforces store resolution
- Private header validation: read `X-Guest-Id`, reject empty or non-UUID values with `BadRequest`
- Private `BuildOwner()`: returns `CartOwnerContext.GuestOwner(guestId, tenantContext.CurrentStoreId.Value)`

Endpoints (mirror `StorefrontCartController`):

| Method | Route | Command/Query |
|---|---|---|
| `GET` | `/` | `GetCustomerCartQuery(owner)` |
| `POST` | `/items` | `AddCartItemCommand(owner, productId, qty, variantId?)` |
| `PUT` | `/items/{productId:guid}` | `UpdateCartItemQuantityCommand(owner, ...)` |
| `DELETE` | `/items/{productId:guid}` | `RemoveCartItemCommand(owner, ...)` |
| `DELETE` | `/` | `ClearCartCommand(owner)` |

No sync endpoint on guest controller.

### Step 4.2 — Update `StorefrontCartController`
**File:** `src/Qaflaty.Api/Controllers/StorefrontCartController.cs`

- Wrap every `customerId.Value` in `CartOwnerContext.CustomerOwner(customerId.Value)`
- Update `SyncCartRequest` record: add `string? GuestSessionId = null`
- Pass `request.GuestSessionId` to `SyncCartCommand`

### Step 4.3 — Add `GuestCartCleanupService`
**File (new):** `src/Qaflaty.Infrastructure/Services/GuestCartCleanupService.cs`

Implements `BackgroundService`. Uses `IServiceScopeFactory` (scoped repo inside singleton):
```csharp
// Runs daily
await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
// Resolve ICartRepository + IUnitOfWork from scope
await repo.DeleteExpiredGuestCartsAsync(DateTime.UtcNow.AddDays(-30), ct);
await unitOfWork.SaveChangesAsync(ct);
```

Register in `DependencyInjection.cs`:
```csharp
services.AddHostedService<GuestCartCleanupService>();
```

---

## Layer 5 — Frontend

### Step 5.1 — Create `GuestSessionService`
**File (new):** `projects/store/src/app/services/guest-session.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class GuestSessionService {
  private readonly KEY = 'qaflaty_guest_id';

  getOrCreateGuestId(): string  // reads localStorage or creates via crypto.randomUUID()
  getGuestId(): string | null   // reads only, no creation
  clearGuestId(): void          // called after successful login sync
}
```

Uses native `crypto.randomUUID()` — no external library needed.

### Step 5.2 — Create `guestCartInterceptor`
**File (new):** `projects/store/src/app/interceptors/guest-cart.interceptor.ts`

```typescript
export const guestCartInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/storefront/guest-cart')) return next(req);
  const guestId = inject(GuestSessionService).getOrCreateGuestId();
  return next(req.clone({ setHeaders: { 'X-Guest-Id': guestId } }));
};
```

### Step 5.3 — Register interceptor in `app.config.ts`
**File:** `projects/store/src/app/app.config.ts`

Order matters:
```typescript
withInterceptors([storeHeaderInterceptor, guestCartInterceptor, customerAuthInterceptor])
```

### Step 5.4 — Update `CartApiService` with guest methods
**File:** `projects/store/src/app/services/cart-api.service.ts`

Add `GUEST_BASE = .../storefront/guest-cart`. Add 4 guest methods:
- `addGuestItem(productId, quantity, variantId?)`
- `updateGuestItemQuantity(productId, quantity, variantId?)`
- `removeGuestItem(productId, variantId?)`
- `clearGuestCart()`

Same fire-and-forget `catchError(() => EMPTY).subscribe()` pattern as existing methods.

### Step 5.5 — Update `CartService` with guest API fallback
**File:** `projects/store/src/app/services/cart.service.ts`

Add `else` branch in all 4 mutating methods:
```typescript
if (this.isLoggedIn) { this.cartApi.addItem(...); }
else                 { this.cartApi.addGuestItem(...); }
```

### Step 5.6 — Update `CustomerAuthService.syncCart()`
**File:** `projects/store/src/app/services/customer-auth.service.ts`

- Inject `GuestSessionService`
- **Fix pre-existing bug 1**: `localStorage.removeItem('cart')` → `localStorage.removeItem('qaflaty_cart')`
- **Fix pre-existing bug 2**: `JSON.parse(json)` returns `CartItem[]` directly (not `{ items: [...] }`) — parse as `const guestItems = JSON.parse(json) as CartItem[]`
- Add `guestSessionId: this.guestSession.getGuestId()` to sync request body
- After successful sync: `this.guestSession.clearGuestId()`

### Step 5.7 — Update merchant Active Carts UI
**File:** `projects/merchant/src/app/features/active-carts/services/active-carts.service.ts`
Update `ActiveCart` interface: `customerId: string | null`, add `guestId: string | null`

**File:** `projects/merchant/src/app/features/active-carts/active-carts.component.ts`
Add guest badge in cart card template:
```html
@if (cart.guestId) { <span class="badge">Guest</span> }
```
Backend already returns `customerName: "Guest"` for guest carts — no null-guard needed for display.

---

## Risks & Known Issues

| Risk | Impact | Mitigation in plan |
|---|---|---|
| `GetActiveCartsQueryHandler` calls `.CustomerId.Value` unconditionally | 💥 Crash for guest carts | Fixed in Step 3.7 — filter + null-safe access |
| `CartDto` is positional — signature change breaks all construction sites | 🔴 Compile error | Update all construction sites together in Step 3.6 |
| `customerAuthInterceptor` adds Bearer token to guest-cart requests when logged in | ℹ️ Harmless | By design; unauthenticated endpoints ignore auth headers |
| Filtered unique index syntax differs per DB provider | ⚠️ Migration may generate wrong filter clause | Inspect generated migration file before `database update` |
| `SyncCartCommandHandler` needs `ITenantContext` (new injection) | 🔴 DI error if not registered | `ITenantContext` is already globally registered by TenantMiddleware |
| `syncCart()` parses localStorage items as `guestCart.items` (pre-existing bug) | 🔴 Sync silently fails | Fixed in Step 5.6 — parse as `CartItem[]` directly |

---

## File Inventory

### Backend — New files
| File | Purpose |
|---|---|
| `src/Qaflaty.Application/Common/CartOwnerContext.cs` | Discriminated union for cart ownership |
| `src/Qaflaty.Application/Storefront/Common/CartOwnerResolver.cs` | Shared repo-lookup helper for handlers |
| `src/Qaflaty.Api/Controllers/GuestCartController.cs` | Unauthenticated guest cart endpoints |
| `src/Qaflaty.Infrastructure/Services/GuestCartCleanupService.cs` | Daily TTL cleanup hosted service |
| `src/Qaflaty.Infrastructure/Migrations/...AddGuestCartSupport.cs` | DB migration |

### Backend — Modified files
`Cart.cs`, `ICartRepository.cs`, `CartRepository.cs`, `CartConfiguration.cs`,
`AddCartItemCommand.cs`, `AddCartItemCommandHandler.cs`,
`RemoveCartItemCommand.cs`, `RemoveCartItemCommandHandler.cs`,
`UpdateCartItemQuantityCommand.cs`, `UpdateCartItemQuantityCommandHandler.cs`,
`ClearCartCommand.cs`, `ClearCartCommandHandler.cs`,
`SyncCartCommand.cs`, `SyncCartCommandHandler.cs`,
`GetCustomerCartQuery.cs`, `GetCustomerCartQueryHandler.cs`,
`CartDto.cs`, `ActiveCartDto.cs`, `GetActiveCartsQueryHandler.cs`,
`StorefrontCartController.cs`, `DependencyInjection.cs`

### Frontend — New files
| File | Purpose |
|---|---|
| `projects/store/src/app/services/guest-session.service.ts` | UUID generation and persistence |
| `projects/store/src/app/interceptors/guest-cart.interceptor.ts` | Adds X-Guest-Id header |

### Frontend — Modified files
`app.config.ts`, `cart-api.service.ts`, `cart.service.ts`, `customer-auth.service.ts`,
`active-carts.service.ts`, `active-carts.component.ts`

---

## Execution Order (strict)

```
Domain (1.1 → 1.2)
  └─ Infrastructure EF config (2.1 → 2.3)  [write code, NO migration yet]
       └─ Application (3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7)
            └─ API (4.1 → 4.2 → 4.3)
                 └─ [BUILD — fix compile errors]
                      └─ Migration (2.2) — inspect, then apply

Frontend (5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6 → 5.7)  [can run in parallel with API layer]
```

---

## Security Enforcement Summary

| Concern | Enforced By |
|---|---|
| Store must exist and be active | TenantMiddleware (runs before every `/api/storefront/*` action) |
| `X-Guest-Id` must be a valid UUID | `GuestCartController` private header validation |
| Max 100 quantity per item | `AddCartItemCommandHandler` and `UpdateCartItemQuantityCommandHandler` |
| Max 50 items per cart | `AddCartItemCommandHandler` (checks `cart.Items.Count` after add) |
| Guest cart scoped to one store | `GetByGuestIdAsync(guestId, storeId)` — both required for lookup |
| Guest UUID invalidated after login | Server deletes guest cart in `SyncCartCommandHandler`; frontend calls `clearGuestId()` |
| Stale guest carts purged | `GuestCartCleanupService` — daily job, 30-day TTL |
