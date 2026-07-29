# Order Bot — Plan

A standalone tool that places **N orders with configurable products and quantities**
against a Qaflaty storefront. It lives outside `clients/qaflaty-workspace` (store +
merchant apps) and outside `src/` (the API), and talks to the running API the same way a
real shopper's browser does.

**Scope: order volume.** Fill a store with hundreds of realistic orders so the order list,
dashboard analytics, reports, active-carts and chat can be exercised under load. Bot
orders are left in place — no cleanup tooling, no CI wiring.

Anti-bot / blocklist testing is deliberately **out of scope** for now; §6 notes what would
be added later if that changes.

---

## 1. How should the bot work — human, script, or browser?

Three possible levels. The recommendation is **Level 2**.

| Level | What it is | Speed | Verdict |
|-------|-----------|-------|---------|
| 1. Human | A person clicking through the store | ~2 min/order | Useless for volume |
| 2. **Scripted HTTP client (recommended)** | A Node process calling the same REST endpoints the Angular store app calls | ~50–200 ms/order | Everything needed here |
| 3. Headless browser (Playwright) | Drives the real store SPA at `:4202` | ~5–15 s/order | Not needed for volume |

**Why HTTP.** The store app is a thin Angular SPA — it holds no order logic. Every rule
that matters (pricing, stock, OTP, delivery zones, promo validation) is enforced in
`PlaceOrderCommandHandler` and its friends, server-side. A script hitting
`POST /api/storefront/orders` exercises exactly the same code path as a human at the
checkout page, at 100× the rate. Driving a browser to reach the same handler is pure
overhead.

**"Acts like a human" is a dial, not a mode.** The bot carries a pacing layer: think-time
between steps, browse-before-buy, cart abandonment. Turn it up when you want traffic that
resembles real shopper timing (useful for realistic active-carts and analytics data), turn
it down when you just want 500 orders in the database quickly. Same binary, one config
field.

---

## 2. What the bot does per order

Mirrors the storefront's real sequence. Every call carries `X-Store-Slug` (required by
`TenantMiddleware` for all `/api/storefront/*` routes) and, for cart/order calls,
`X-Guest-Id` (UUID v4, per virtual shopper).

```
 1. GET  /api/storefront/store                      → confirm store resolves and is Active
 2. GET  /api/storefront/payment-methods            → pick an enabled method key
 3. GET  /api/storefront/products?pageSize=100      → discover catalog (or use configured IDs)
 4. GET  /api/storefront/products/{slug}            → product page view  [pacing: human only]
 5. POST /api/storefront/presence/heartbeat         → shows up in merchant "active carts"
 6. POST /api/storefront/guest-cart/items           → { productId, quantity, variantId? }  × N items
 7. GET  /api/storefront/locations/{countries|cities|districts}
 8. POST /api/storefront/orders/calculate           → totals preview, catches delivery-zone rejects early
 9. POST /api/storefront/orders                     → 201 + { orderNumber, status, ... }
10. POST /api/storefront/orders/{orderNumber}/verify → { otpCode } — only if the store requires OTP
11. GET  /api/storefront/orders/track/{orderNumber}?contact=… → confirm the final status
12. POST /api/storefront/presence/leave
```

Prices, product names and totals are resolved server-side, so the bot only ever supplies
`productId`, `quantity` and an optional `variantId` — exactly the input you care about.

### Constraints the bot must respect (read from the code, not guessed)

- **Tenant header is mandatory.** No `X-Store-Slug` / `X-Custom-Domain` → 400
  `Tenant.Required`. Store must be `Active` or → 404 `Store.Inactive`.
  (`src/Qaflaty.Api/Middleware/TenantMiddleware.cs`)
- **Email is required on every order**, even when OTP is off →
  `OrderingErrors.EmailRequired`. (`PlaceOrderCommandHandler.cs:81`)
- **Payment method must be configured *and* enabled.** If the store has any
  `PaymentMethodAdjustments`, an unlisted key fails with
  `Order.PaymentMethodNotConfigured` and a disabled one with
  `Order.PaymentMethodDisabled`. Hence step 2 — never hardcode `"COD"`.
  (`PlaceOrderCommandHandler.cs:140-151`)
- **Delivery zones can refuse the address** (`Order.DeliveryNotAvailable`) at district,
  city or country level. Location must be configurable and the failure reported clearly.
- **OTP is conditional** on `CustomerAuthSettings.RequireOtpOnPlaceOrder`. When the API
  runs with `MockOtp:Enabled=true` the code is fixed (`000000` in
  `appsettings.Development.json`), so the bot needs no mailbox. Against an environment
  without MockOtp, an OTP-requiring store needs a mail-catcher — avoid that for now by
  running against a store with OTP off, or with MockOtp enabled.
- **A phone on the merchant's blocklist silently parks the order in `Blocked`** rather
  than failing it. Not a target scenario here, but the bot should report the tracked
  status so a batch that lands in `Blocked` isn't mistaken for success.
  (`PlaceOrderCommandHandler.cs:99-104, 301-310`)
- **There is no rate limiting or CAPTCHA on the storefront order route today**, so nothing
  will throttle the bot. Worth knowing before pointing it at a shared environment.

---

## 3. Shape of the tool

### Stack

**Node 20 + TypeScript**, plain `fetch`, no framework. Rationale: zero coupling to the
solution (test code can never ship inside the product) and trivial concurrency for the
volume runs. A .NET console project is a reasonable alternative if you prefer a single
toolchain — the design below is stack-agnostic — but it pulls test tooling into
`Qaflaty.slnx`.

### Layout

```
tools/order-bot/                 # not in Qaflaty.slnx, not in the Angular workspace
├── package.json
├── README.md
├── src/
│   ├── main.ts                  # CLI: order-bot run <scenario> [--orders N] [--concurrency C]
│   ├── config.ts                # load + validate scenario file, host allowlist
│   ├── api/
│   │   ├── client.ts            # fetch wrapper: tenant headers, retries, latency capture
│   │   ├── storefront.ts        # store, products, categories, payment-methods, locations
│   │   ├── cart.ts              # guest-cart + presence
│   │   └── orders.ts            # calculate, place, verify-otp, track
│   ├── shopper.ts               # one virtual shopper = identity + guest id + full journey
│   ├── identity.ts              # name / phone / email generation
│   ├── pacing.ts                # human | fast | burst think-times and jitter
│   ├── runner.ts                # N orders across C workers, ramp-up, abort-on-error-rate
│   └── report.ts                # JSONL per order + summary
└── scenarios/                   # one file per scenario in §4
```

### Scenario file (JSON/YAML)

```yaml
name: bulk-volume
baseUrl: http://localhost:5000/api
storeSlug: demo-store

orders: 200
concurrency: 10
pacing: fast            # human | fast | burst
rampUpSeconds: 5

products:               # omit to auto-discover from the catalog
  - { id: "…uuid…", quantityMin: 1, quantityMax: 3, weight: 5 }
  - { id: "…uuid…", quantityMin: 1, quantityMax: 10, weight: 2, variantId: "…uuid…" }
itemsPerOrder: { min: 1, max: 4 }

identity:
  phoneStrategy: unique     # unique | fixed | pool
  phoneCountryCode: "+966"
  emailDomain: qaflaty-bot.test
location: { countryCode: 966, cityId: 1, districtId: null }
paymentMethod: auto         # auto = first enabled from /payment-methods
promoCode: null

otp: { mode: mock, code: "000000" }   # mock | none
```

### Output

- `runs/<timestamp>/orders.jsonl` — one line per attempt: shopper id, guest id, phone,
  items, HTTP status, error code, order number, final tracked status, per-step latency.
- `runs/<timestamp>/summary.json` + a console table — counts by outcome, error-code
  histogram, latency p50/p95/p99, orders/sec.

Bot orders stay in the database. Identities still use a distinct email domain and phone
prefix so you can *filter* them later if you ever want to — costs nothing now, and means
you aren't stuck if you change your mind.

---

## 4. Scenarios

| # | Scenario | Setup | Purpose |
|---|----------|-------|---------|
| S1 | **Bulk volume** | 200–2000 orders, mixed products/quantities, `fast` pacing | The main event: fill the store, capture throughput + latency |
| S2 | **Human-paced** | 50 orders, `human` pacing, unique identities, browse-before-buy | Realistic timestamps and session behaviour for analytics/active-carts screens |
| S3 | **Cart flooding / abandonment** | Add to cart + heartbeat, never check out | Populates merchant active-carts and downsell surfaces |
| S4 | **OTP flow** | OTP-required store: place → resend → verify | Confirms the bot handles `Pending` → `Confirmed` |

---

## 5. Safety rails

Only two, both cheap:

1. **Target allowlist.** Refuses to run unless `baseUrl` is localhost/127.0.0.1 or a host
   in an explicit `allowedHosts` list. Anything else needs `--allow-remote` plus an
   interactive confirmation. Prevents pointing 2000 orders at prod by typo.
2. **Default caps.** `orders ≤ 500`, `concurrency ≤ 20` unless explicitly raised in the
   scenario file.

---

## 6. Prerequisites

- API running locally (`dotnet run --project src/Qaflaty.Api`) against the docker-compose
  Postgres.
- A seeded **Active** store with a known slug, ≥3 published products (one with variants),
  at least one enabled payment method, and delivery enabled for the target location.
- `MockOtp:Enabled=true` if the target store requires OTP on place-order (already the case
  in `appsettings.Development.json`).
- No merchant credentials needed — every scenario here runs purely against public
  storefront endpoints.

---

## 7. Phasing

| Phase | Deliverable | Notes |
|-------|-------------|-------|
| **0** | Seed script / documented store setup | Unblocks everything else |
| **1** | HTTP bot core — one order end-to-end from a scenario file | The proof the approach works |
| **2** | Volume: concurrency, ramp-up, pacing personas, JSONL + summary reporting | Delivers S1–S4 |

**Not now, tracked in case the need returns:** a merchant-side helper (login, block phone,
release/reject) would unlock blocklist and promo-abuse assertions; a cleanup command would
purge bot orders by their email/phone markers; a Playwright browser mode would be needed
only if a future defense depends on real-browser signals (JS challenge, CAPTCHA,
fingerprinting).
