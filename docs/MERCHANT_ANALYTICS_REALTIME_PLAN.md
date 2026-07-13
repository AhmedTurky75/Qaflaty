# Real-Time Merchant Analytics — Technical Implementation Plan

## Context

Merchants need a **live** view of what is happening in their store *right now*, not the
day-old, manual-refresh numbers they get today. Three metrics are required:

1. **Active users** currently browsing the store (active = interacted within the last 10 min).
2. **Active users per product page** — how many people are viewing each product right now.
3. **Active/abandoned carts** — carts that hold items but have not converted to an order,
   with full cart contents, disappearing the moment the order is placed.

The platform is **multi-tenant**; every number must be isolated per store — one merchant must
never see another's traffic.

### What already exists (and what we reuse vs. build)

| Capability | Status today | Plan |
|---|---|---|
| SignalR | `ChatHub` at `/hubs/chat`, bare `AddSignalR()`, **no backplane**, **no `[Authorize]`**, groups keyed per-conversation only | Add a **new** `AnalyticsHub`, add Redis backplane, add auth + per-store groups |
| Active carts read model | **Fully built**: `GetActiveCartsQuery`/`Handler`, `CartsController GET /api/carts/active`, Angular `active-carts` component | **Extend**, don't rebuild: add real-time push + abandoned/converted state |
| Cart→order conversion | `PlaceOrderCommandHandler` **never touches the cart** — checked-out carts linger forever | Add cart clearing/flagging on `OrderPlacedEvent` |
| Presence / heartbeat / "online users" | **Does not exist anywhere** | Greenfield |
| Storefront `PageView` tracking | Exists but only forwarded to ad pixels (`StorefrontTrackingController` → `IngestBrowserEvent`) | New lightweight first-party heartbeat, separate from ad pixels |
| Redis / IDistributedCache | **Not present at all** | Introduce (see decision below) |
| Hosted-worker pattern | `TrackingRetryWorker`, `GuestCartCleanupService` (`BackgroundService` + `IServiceScopeFactory`) | Reuse pattern for the sweeper |
| SignalR Angular client | `MerchantChatService` (signals-based, `@microsoft/signalr`, token via `?access_token=`) | Reuse pattern for `analytics.service.ts` |

**Core design decision — state store:** presence is high-write, ephemeral, TTL-based, and must be
shared across API instances behind a load balancer. That is a textbook Redis workload, **not** a
Postgres one — writing every heartbeat to Postgres would hammer the DB for data we throw away in
10 minutes. **Recommendation: introduce Redis** as (a) the presence/counter store and (b) the
SignalR backplane. For a single-instance MVP we ship an in-memory fallback behind the same
interface, but the production target is Redis-backed and multi-instance.

---

## 1. Overall Architecture

```
 Storefront (Angular, store app)                 Merchant Dashboard (Angular, merchant app)
   │  heartbeat every 30s (POST)                    │  SignalR: subscribe store_{storeId}
   │  + SignalR heartbeat (preferred)               ▼
   ▼                                        ┌──────────────────────────┐
 ┌────────────────────────────┐             │  AnalyticsHub (/hubs/     │
 │ StorefrontPresenceController│             │  analytics) [Authorize]   │
 │  POST /api/storefront/      │             │  group = store_{storeId}  │
 │        presence/heartbeat   │             └──────────┬───────────────┘
 └──────────────┬──────────────┘                        │ IHubContext push
                │ IPresenceTracker.Touch(...)            │
                ▼                                        │
        ┌───────────────────────────────────────────────┴──────────┐
        │              Redis  (presence + counters + backplane)      │
        │  ZSET presence:store:{id}          score = expiryUnixMs    │
        │  ZSET presence:store:{id}:prod:{p} score = expiryUnixMs    │
        │  Pub/Sub SignalR backplane (Microsoft.AspNetCore.SignalR.  │
        │                             StackExchangeRedis)            │
        └───────────────────────────────────────┬──────────────────┘
                                                 │
        ┌────────────────────────────────────────┴─────────────────┐
        │ PresenceSweeper (BackgroundService, leader-elected)        │
        │  every ~15s: ZREMRANGEBYSCORE expired; if a store's counts │
        │  changed → push StoreMetricsUpdated to store_{storeId}      │
        └────────────────────────────────────────────────────────────┘

 Cart side:  PlaceOrder → OrderPlacedEvent → CartConversionHandler
             clears cart → pushes ActiveCartsChanged to store_{storeId}
```

Three loosely-coupled subsystems, all keyed by `StoreId`:
- **Presence** (metrics 1 & 2) — heartbeats into Redis sorted sets, swept for expiry, pushed to merchants.
- **Active carts** (metric 3) — existing read model, now event-driven for changes + real-time push.
- **Transport** — one `AnalyticsHub`, per-store groups, Redis backplane.

---

## 2. Backend Design

New/changed pieces, following the existing DDD-by-context layout:

**Domain / abstractions (`Qaflaty.Application/Analytics/`):**
- `IPresenceTracker` — the store-agnostic presence API:
  - `Touch(StoreId, VisitorKey, string? productId, DateTime nowUtc)`
  - `Remove(StoreId, VisitorKey)` (explicit leave)
  - `GetStoreActiveCount(StoreId)` / `GetProductActiveCounts(StoreId)` / `GetActiveCount(StoreId, productId)`
  - `SweepExpired(...)` → returns the set of `StoreId`s whose counts changed.
- `VisitorKey` value object — stable per visitor: `customer:{customerId}` for authenticated,
  `guest:{guestId}` for guests (guest id already exists via `GuestSessionService`/`X-Guest-Id`).
  This dedupes multiple tabs/connections of the same person (see Edge Cases).

**Infrastructure (`Qaflaty.Infrastructure/Services/Analytics/`):**
- `RedisPresenceTracker : IPresenceTracker` (production) — StackExchange.Redis sorted sets.
- `InMemoryPresenceTracker : IPresenceTracker` (single-instance/dev fallback) — `ConcurrentDictionary`
  of sorted structures; registered when Redis is not configured.
- `PresenceSweeper : BackgroundService` — models on `TrackingRetryWorker.cs`
  (`IServiceScopeFactory.CreateAsyncScope()`, catch-all except `OperationCanceledException`,
  fixed interval ~15s).

**API (`Qaflaty.Api`):**
- `Hubs/AnalyticsHub.cs` — `[Authorize]`, merchant-only. `OnConnectedAsync` reads accessible stores
  from claims and adds the connection to `store_{storeId}` group(s) **derived server-side** (never
  from a client-supplied id). A `Subscribe(storeId)` method re-validates via
  `CanMerchantAccessStoreAsync` (same check `StoreScopeAuthorizationFilter` uses) before joining.
- `Controllers/StorefrontPresenceController.cs` — `POST /api/storefront/presence/heartbeat`
  (public, tenant-resolved via `ITenantContext` like `StorefrontTrackingController`). Body:
  `{ productId?, event: "heartbeat"|"leave" }`. Resolves `VisitorKey` from JWT `customer_id` or
  `X-Guest-Id`, calls `IPresenceTracker.Touch/Remove`.
- Push metrics to merchants via injected `IHubContext<AnalyticsHub>` from the sweeper and from
  `CartConversionHandler` — the exact pattern `MerchantChatController` already uses with
  `IHubContext<ChatHub>`.

**Query surface (extend, don't replace):**
- Add `GetLiveMetricsQuery(StoreId)` → `{ activeUsers, activeCartCount, productViewers[] }` for the
  initial snapshot on dashboard load (SignalR then streams deltas). Guarded by `CanMerchantAccessStoreAsync`.
- Keep `GetActiveCartsQuery` as the cart-detail source; add real-time invalidation.

**Registration** (`Qaflaty.Infrastructure/DependencyInjection.cs`): `IPresenceTracker` singleton
(Redis-backed or in-memory), `AddHostedService<PresenceSweeper>()`, and in `Program.cs`
`AddSignalR().AddStackExchangeRedis(...)` + `MapHub<AnalyticsHub>("/hubs/analytics").RequireAuthorization()`.

---

## 3. Database Schema Changes

Presence is **ephemeral** — no tables, no migrations for metrics 1 & 2. It lives only in Redis
(or in-memory). This is deliberate: persisting sub-10-minute heartbeats to Postgres is pure write
amplification for data we discard.

**One schema change, for carts (metric 3):** distinguishing *active* from *converted/abandoned*.
Today `Cart` has no `Status` and is never cleared on checkout. Two options:

- **Recommended (simplest, matches existing behaviour): delete the cart on conversion.** Add a
  `CartConversionHandler` on `OrderPlacedEvent` that resolves the buyer's cart
  (`GetByCustomerIdAsync` / `GetByGuestIdAsync`) and calls `ICartRepository.Delete`. `GetActiveCarts`
  already filters to non-empty carts, so a deleted cart simply drops off the list. No migration.
  - Requires carrying the buyer identity into checkout: `OrderPlacedEvent` already includes
    `CustomerId`; for guests, thread the `X-Guest-Id` into `PlaceOrderCommand` so the guest cart
    can be resolved.
- **Alternative (if merchants want post-purchase cart history):** add `CartStatus`
  (`Active`/`Converted`) + `ConvertedAt` columns via one EF migration, flag instead of delete, and
  filter `GetActiveCartsByStoreAsync` to `Active`. More data, one migration.

Ship the delete approach for MVP; the column approach is a later enhancement if history is wanted.

---

## 4. Redis / In-Memory Data Structures

**Sorted sets (ZSET) keyed for O(log n) expiry — the crux of the design.** Score = absolute expiry
timestamp (`nowUnixMs + 10min`); member = `VisitorKey`.

| Purpose | Key | Member | Score |
|---|---|---|---|
| Store-wide active users | `presence:store:{storeId}` | `VisitorKey` | expiry ms |
| Per-product viewers | `presence:store:{storeId}:prod:{productId}` | `VisitorKey` | expiry ms |
| Reverse index (which product a visitor is on) | `presence:store:{storeId}:loc:{VisitorKey}` (string, `EXPIRE 10m`) | — | — |

Operations:
- **Heartbeat:** `ZADD presence:store:{id} <expiry> <key>`. If on a product page: read old location
  from the `loc` key, `ZREM` from the previous product set, `ZADD` to the new product set, update
  `loc`. This makes **page changes** automatic — moving pages moves the member between sets.
- **Active count (store):** `ZCOUNT key (now +inf` — counts only non-expired members without any
  cleanup. Same for a product.
- **Expiry sweep:** `ZREMRANGEBYSCORE key -inf (now` removes everyone whose 10-min window lapsed.
- **Product viewer map for the dashboard:** iterate the store's product sets (or maintain a small
  `SET presence:store:{id}:products` of product keys touched, cleaned as sets empty).

Counts are cheap and always correct-by-construction because the score encodes expiry; the sweeper
is only needed to *free memory* and to *detect change for pushes*, not for correctness of a read.

**In-memory fallback** mirrors this with `ConcurrentDictionary<StoreId, ...>` of
`(VisitorKey → expiryTicks)` maps; identical `IPresenceTracker` surface so nothing above the
interface changes.

---

## 5. Real-Time Communication Approach — SignalR (and why)

**Use SignalR.** Justification against alternatives:
- The codebase **already runs SignalR** (`ChatHub`, `@microsoft/signalr` in both Angular apps,
  established token-via-query-param auth, `IHubContext` server push). Adding a second hub is
  low-risk and reuses the client pattern in `MerchantChatService`. Introducing raw WebSockets or a
  separate SSE stack would duplicate transport infrastructure.
- Traffic is **server→client fan-out** (merchant watches, rarely talks back) — SignalR groups
  (`store_{storeId}`) fan out to all of a merchant's open dashboards in one call.
- SignalR gives **automatic reconnect**, transport negotiation (WebSocket → SSE → long-poll
  fallback for restrictive proxies), and a **Redis backplane** out of the box
  (`Microsoft.AspNetCore.SignalR.StackExchangeRedis`) — which we need anyway for multi-server.
- SSE would work for the one-way merchant stream but can't reuse the existing client stack and
  still needs its own scaling story; the storefront heartbeat is a tiny POST (or a hub invoke), so
  a full duplex channel there is optional.

**Storefront → server** heartbeats: default to a lightweight `POST` every 30s (simplest, works
through any proxy, no persistent socket cost for thousands of anonymous browsers). Optionally
upgrade the storefront to a hub connection later if we want `OnDisconnectedAsync` for instant
"tab closed" removal — but the 10-min TTL already covers correctness, so POST-heartbeat is the MVP.

---

## 6. Frontend Update Strategy

**Merchant dashboard (`projects/merchant`):**
- New `analytics-realtime.service.ts` modeled on `merchant-chat.service.ts`: signals-based
  (`activeUsers`, `activeCartCount`, `productViewers`, `isConnected`), `HubConnectionBuilder`
  to `${apiUrl.replace('/api','')}/hubs/analytics?access_token=${token}`, `.withAutomaticReconnect()`.
- On connect: `invoke('Subscribe', storeId)`, then fetch the one-time snapshot via
  `GET /api/analytics/live?storeId=` (`GetLiveMetricsQuery`) to render immediately, then apply
  streamed deltas from handlers `on('StoreMetricsUpdated', ...)` and `on('ActiveCartsChanged', ...)`.
- Dashboard gets live stat tiles (active users, carts) using the existing `stats-card` component;
  the **`active-carts` component** subscribes to `ActiveCartsChanged` and re-pulls
  `GET /carts/active` (or applies the pushed delta), replacing today's manual Refresh button.
  Reuse the `dataviz` skill conventions for any live counters/sparklines.
- React to `StoreContextService.currentStoreId()` changes via `effect()` (already the dashboard's
  pattern) to re-`Subscribe` when the merchant switches stores.

**Storefront (`projects/store`):**
- A small `presence.service.ts`: `setInterval` 30s → `POST /api/storefront/presence/heartbeat`
  with current `productId` (null on non-product pages). Hook product id from the product-page
  route. On Angular router `NavigationEnd`, send an immediate heartbeat with the new page's product
  id (fast page-change reflection). On `visibilitychange` → hidden, stop; on visible, resume + beat.
  `beforeunload`/`pagehide` → best-effort `navigator.sendBeacon` `leave`.

---

## 7. Heartbeat / Activity Tracking Mechanism

- **Cadence:** heartbeat every **30s**; TTL **10min** (20 missed beats of slack — tolerant of
  network blips). "Interacted" = any heartbeat; the storefront only beats while the tab is visible
  and (optionally) gated on real interaction (scroll/click/route) to avoid counting idle-but-open tabs.
- **Identity:** `VisitorKey` = `customer:{id}` (JWT `customer_id`) or `guest:{X-Guest-Id}`. Because
  the key is stable, N tabs = 1 active user (ZADD is idempotent on member) — solves multi-tab
  double counting for free.
- **Server action:** `IPresenceTracker.Touch(storeId, key, productId, now)` → ZADD with
  `score = now + 10min`, plus the product-set move described in §4.
- **Tenant:** `storeId` comes from `ITenantContext` (resolved by `TenantMiddleware` on
  `/api/storefront/*`), never from the client body — guarantees isolation.

---

## 8. Detecting Page Changes

- **Client:** Angular router `NavigationEnd` fires an immediate heartbeat carrying the new page's
  `productId` (or null). No waiting for the next 30s tick.
- **Server:** the heartbeat's `productId` differs from the visitor's stored `loc` key → the tracker
  `ZREM`s the member from the old product set and `ZADD`s to the new one (§4). Leaving all product
  pages (productId=null) just removes from any product set while staying in the store-wide set.
  Result: per-product counts always reflect the *current* page, and a visitor is counted for at
  most one product at a time.

---

## 9. Automatic Removal of Inactive Users

Two complementary mechanisms:
1. **Correctness (immediate):** every count uses `ZCOUNT ... (now +inf`, so an expired member is
   *never counted* even before it is physically removed. A visitor who stops beating disappears
   from counts exactly 10 min after their last beat, with zero extra work.
2. **Memory reclaim + push (sweeper):** `PresenceSweeper` runs every ~15s,
   `ZREMRANGEBYSCORE key -inf (now` across active store keys, and for any store whose active count
   or product counts changed, pushes `StoreMetricsUpdated` to `store_{storeId}`. This is what makes
   the merchant's number tick *down* in real time without the merchant polling.
- **Explicit leave:** `beforeunload`/tab-close `sendBeacon` and `OnDisconnectedAsync` (if the
  storefront uses a hub) call `Remove` for near-instant removal; the TTL is the safety net when
  those fire-and-forget signals are lost.

---

## 10. Efficient Abandoned-Cart Tracking

"Abandoned/active cart" = a non-empty cart with no completed order. The read model already exists
(`GetActiveCartsByStoreAsync` returns non-empty carts per store, enriched by
`GetActiveCartsQueryHandler`). Changes:
- **Removal on conversion:** `CartConversionHandler : INotificationHandler<OrderPlacedEvent>`
  deletes the buyer's cart (§3), so it leaves the list immediately. Then push `ActiveCartsChanged`
  to `store_{storeId}`.
- **Real-time additions/updates:** the storefront cart commands (`AddCartItem`, `RemoveCartItem`,
  `UpdateCartItemQuantity`, `ClearCart`) already run through the CQRS pipeline — raise an
  `ActiveCartsChanged` push (debounced) so the merchant sees new/changed carts appear live. Because
  these mutate the cart, they are the natural hook; no polling.
- **Efficiency:** don't recompute the whole store's cart list on every event — push a lightweight
  "carts changed" signal and let the dashboard re-pull `GET /carts/active` at most every few
  seconds (debounced), or send only the single changed `ActiveCartDto`. Fix the known handler bug:
  it enriches unit price with base product price only, **ignoring `variant.PriceOverride`** (unlike
  `PlaceOrder`) — align it so "revenue at risk" is accurate.
- **Abandonment window (optional):** carts older than a threshold (e.g. `UpdatedAt` > 1h) can be
  labelled "abandoned" vs "active" in the DTO for UI segmentation — a computed field, no new storage.

---

## 11. Scalability (thousands of concurrent users)

- **Presence cost is O(1) per heartbeat** (single ZADD, maybe one ZREM+ZADD on page change). 10k
  concurrent visitors at 30s cadence ≈ 333 ops/s — trivial for Redis.
- **Counts are O(log n)** ZCOUNT/ZCARD, computed on demand; no full scans.
- **Sweeper is bounded:** only sweeps store keys with recent activity (track a `SET` of active store
  ids, or scan a bounded key pattern), and only pushes to stores whose numbers changed.
- **Push fan-out is per-store**, so a merchant with M open dashboards gets one grouped send.
- **Heartbeat via POST** avoids holding thousands of open sockets for anonymous storefront
  visitors; only *merchants* hold persistent SignalR connections (far fewer).
- **DB untouched by presence** — no write amplification; Postgres only sees the existing cart/order
  writes plus the new cart-delete-on-conversion.

---

## 12. Multi-Server / Load-Balanced Deployment

Today the stack is **single-instance only** (in-memory SignalR groups, no backplane). For LB:
- **SignalR Redis backplane** (`AddStackExchangeRedis`) so a push from any instance reaches merchant
  connections pinned to any other instance. Required before running >1 API replica.
- **Shared Redis presence store** — all instances read/write the same ZSETs, so counts are global,
  not per-node.
- **Single sweeper across the fleet:** run `PresenceSweeper` with **leader election** (a Redis
  lock key with TTL, e.g. `SET presence:sweeper:leader <instanceId> NX PX 20s` renewed each tick)
  so only one node sweeps+pushes and merchants don't get duplicate deltas. Non-leaders idle.
- **Sticky sessions not required** with the backplane, but WebSocket-friendly LB config
  (idle timeouts, upgrade headers) is needed — same as any SignalR deployment.

---

## 13. Performance Optimizations

- Redis **pipelining/Lua** for the page-change move (ZREM old + ZADD new + set loc) as one round trip.
- **Debounce/coalesce pushes:** the sweeper and cart handlers batch changes and push at most every
  ~2–5s per store; merchants don't need sub-second precision on a "people browsing" number.
- **Diff-only pushes:** only emit `StoreMetricsUpdated` when a store's numbers actually changed.
- **Snapshot-then-stream:** one `GET /analytics/live` on load, deltas thereafter — avoids re-fetching
  full state on every tick.
- **Interaction-gated heartbeats** on the client (pause when tab hidden) cut needless traffic.
- Reuse existing enrichment; fix the variant-price bug rather than adding a second query path.

---

## 14. Security Considerations

- **`AnalyticsHub` must be `[Authorize]` + `.RequireAuthorization()`** — unlike the current
  `ChatHub`, which is anonymous. Merchants only.
- **Store authorization at the hub layer:** `Subscribe(storeId)` must re-validate with
  `IStoreRepository.CanMerchantAccessStoreAsync(merchantId, storeId)` (the same check
  `StoreScopeAuthorizationFilter` enforces on `/api/stores/{storeId}/*`). Never trust a
  client-supplied store id for group membership — otherwise merchant A subscribes to
  `store_{B}` and sees B's live traffic. This is the #1 tenant-isolation risk.
- **Storefront heartbeat store scoping** comes from `ITenantContext` (header-resolved by
  `TenantMiddleware`), not the request body — a visitor can only affect their own store's counts.
- **Rate-limit / validate heartbeats:** clamp cadence server-side, validate `productId` belongs to
  the tenant store, and cap per-visitor writes so the endpoint can't be used to inflate numbers or
  flood Redis. `VisitorKey` derivation prevents a client from impersonating another visitor's key
  beyond their own guest id.
- **No PII in presence** — only opaque `VisitorKey`s live in Redis; cart contents (which include
  customer name/email via the existing DTO) stay in the authorized `/carts/active` path.
- **Token on the WS query string** (`?access_token=`) is the established pattern; ensure TLS so it
  isn't exposed in transit, and keep tokens short-lived.

---

## 15. Edge Cases

| Case | Handling |
|---|---|
| **Multiple tabs, same user** | Same `VisitorKey` → idempotent ZADD → counted once. Closing one tab doesn't remove them while another keeps beating. |
| **Browser/tab close** | `beforeunload`/`pagehide` `sendBeacon('leave')` for instant removal; 10-min TTL is the fallback if the beacon is dropped. |
| **Refresh** | New page load re-beats immediately with same `VisitorKey` — no flicker (member already present or re-added within its TTL). |
| **Network disconnect** | Missed beats; TTL expires them after 10 min. On reconnect they beat again and reappear. Merchant SignalR uses `withAutomaticReconnect`. |
| **Duplicate hub connections (merchant)** | Group add is idempotent per connection; pushes fan out to all, client applies idempotent state. |
| **Guest → login mid-session** | `VisitorKey` changes from `guest:x` to `customer:y`; brief double count until the guest key TTLs out (≤10 min). Optionally `Remove(guest:x)` at login (mirrors existing `MergeGuestCart`). |
| **Page change** | Router `NavigationEnd` immediate beat moves the member between product sets (§8). |
| **Clock skew across nodes** | Scores are server-set from a single `IDateTimeProvider`; all instances use UTC. Avoid client-supplied timestamps. |
| **Checkout with OTP pending** | Cart cleared on `OrderPlacedEvent` which fires on `Order.Confirm()` — for OTP stores that's after verification, so an unconfirmed cart correctly still shows as active. |
| **Guest cart conversion** | Requires threading `X-Guest-Id` into `PlaceOrderCommand` so the guest cart can be resolved and deleted; otherwise guest carts only clear via the 30-day cleanup. |
| **Sweeper node dies** | Leader lock TTL expires; another node takes over within one TTL window. |
| **Redis unavailable** | Presence degrades (counts stale/empty) but storefront and checkout keep working — presence writes are fire-and-forget, never in the request-critical path. |

---

## 16. Phased Implementation Roadmap

**Phase 0 — Foundations (infra)**
- Add StackExchange.Redis + `Microsoft.AspNetCore.SignalR.StackExchangeRedis`; config-gated so
  absence of a Redis connection string → in-memory fallback + single-instance.
- Define `IPresenceTracker`, `VisitorKey`; implement `InMemoryPresenceTracker` first.
- Scaffold `AnalyticsHub` ([Authorize], per-store groups, `CanMerchantAccessStoreAsync` check) and
  register `MapHub`. Milestone: merchant can connect and subscribe to their store group only.

**Phase 1 — Active users (metric 1)**
- `StorefrontPresenceController` heartbeat endpoint + storefront `presence.service.ts` (30s POST).
- `PresenceSweeper` (in-memory) + `StoreMetricsUpdated` push + `GET /analytics/live` snapshot.
- Merchant live "active users" stat tile. Milestone: live count rises/falls within 10 min end-to-end.

**Phase 2 — Per-product viewers (metric 2)**
- Add product-set logic + page-change move; `NavigationEnd` immediate beat on storefront.
- Per-product viewer list in the dashboard. Milestone: navigating between products moves the count.

**Phase 3 — Real-time active carts (metric 3)**
- `CartConversionHandler` on `OrderPlacedEvent` (delete cart; thread `X-Guest-Id` for guests).
- `ActiveCartsChanged` pushes from cart commands + conversion; wire the existing `active-carts`
  component to live-update; fix the variant-price enrichment bug. Milestone: placing an order
  removes the cart from the merchant list instantly.

**Phase 4 — Scale-out & hardening**
- Swap in `RedisPresenceTracker` + SignalR Redis backplane; add sweeper leader election.
- Rate limiting, debounced/diff pushes, load test to thousands of concurrent heartbeats.
- Optional: storefront hub connection for instant `OnDisconnectedAsync` removal; optional
  `CartStatus`/`ConvertedAt` columns if post-purchase cart history is wanted.

---

## Verification

- **Unit:** `IPresenceTracker` (in-memory) — Touch/expiry/page-move/count correctness against a
  controllable `IDateTimeProvider`; `VisitorKey` derivation; `CartConversionHandler` deletes the
  right cart. Run `dotnet test`.
- **Tenant isolation (critical):** integration test — merchant A's `Subscribe(storeB)` is rejected
  by `CanMerchantAccessStoreAsync`; heartbeats to store A never appear in store B's counts.
- **End-to-end (manual, per CLAUDE.md commands):**
  1. `docker-compose up -d`; run API (`dotnet run --project src/Qaflaty.Api`) and both Angular apps
     (`npm run start:merchant`, `npm run start:store`).
  2. Open the storefront in 2 browsers/tabs → merchant dashboard active-users shows the right count;
     confirm two tabs of the same guest count once.
  3. Navigate to a product page → per-product viewer count increments; navigate away → decrements.
  4. Stop beating (close tab) → count drops after the TTL (temporarily shorten TTL for the test);
     `sendBeacon` leave drops it immediately.
  5. Add items to a cart → cart appears live in merchant `active-carts`; place the order →
     cart disappears immediately; verify "revenue at risk" honors variant price overrides.
- **Scale sanity:** script thousands of heartbeats against the presence endpoint; watch Redis op
  rate and API CPU stay flat, and confirm counts are correct under load.
- **Multi-instance:** run 2 API instances behind the LB with Redis backplane; confirm a heartbeat on
  instance 1 updates a merchant connected to instance 2, and only one sweeper (leader) emits deltas.
