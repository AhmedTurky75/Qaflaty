# Order Bot — Plan

A standalone load/abuse simulator that places **N orders with configurable products and
quantities** against a Qaflaty storefront. It lives outside `clients/qaflaty-workspace`
(store + merchant apps) and outside `src/` (the API), and talks to the running API the
same way a real shopper's browser does.

Two jobs:

1. **Volume testing** — fill a store with hundreds of realistic orders (order list paging,
   dashboard analytics, reports, active-carts, chat load).
2. **Anti-bot testing** — drive the merchant-facing bot-protection features (blocked
   phones, blocked orders, and whatever rate limiting / challenge comes next) and prove
   both that abusive traffic gets caught **and** that ordinary human traffic does not.

---

## 1. How should the bot work — human, script, or browser?

There are three possible levels. The recommendation is **Level 2 as the main tool**, with
Level 3 built later and only for the cases Level 2 physically cannot cover.

| Level | What it is | Speed | Covers |
|-------|-----------|-------|--------|
| 1. Human | A person clicking through the store | ~2 min/order | Nothing a script can't, at 1/1000 the throughput. Only useful as a sanity baseline. |
| 2. **Scripted HTTP client (recommended)** | A Node process that calls the same REST endpoints the Angular store app calls | ~50–200 ms/order | Everything server-side: order creation, quantities, blocklist, promo abuse, cart flooding, rate limits, OTP flow |
| 3. Headless browser (Playwright) | Drives the real store SPA at `:4202` | ~5–15 s/order | Only what needs a real browser: JS challenges, CAPTCHA, canvas/TLS fingerprinting, client-side pixels |

**Why HTTP-first.** The store app is a thin Angular SPA — it holds no order logic. Every
rule that matters (pricing, stock, blocklist screening, OTP, delivery zones, promo
validation) is enforced in `PlaceOrderCommandHandler` and its friends, server-side. A
script hitting `POST /api/storefront/orders` exercises exactly the same code path as a
human at the checkout page, at 100× the rate and with deterministic, assertable results.
Driving a browser to reach the same handler is pure overhead today.

**Why a browser mode is still on the roadmap.** The moment a bot defense depends on
something only a browser produces — a JS-computed token, a CAPTCHA, a device
fingerprint, a behavioural signal — the HTTP bot can no longer honestly answer "would a
real customer get through?". At that point Level 3 becomes the *validation* run (a
handful of orders), while Level 2 stays the *volume* run.

**"Acts like a human" is a dial, not a mode.** The bot carries a pacing/persona layer:
think-time between steps, browse-before-buy, cart abandonment, phone/email/IP variety,
session reuse. Turn the dial up and traffic looks like real shoppers (used to prove the
defenses produce **no false positives**); turn it down and it looks like a scripted
attack (used to prove the defenses **catch** it). Same binary, one config field.

---

## 2. What the bot actually does per order

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
11. GET  /api/storefront/orders/track/{orderNumber}?contact=… → assert the final status
12. POST /api/storefront/presence/leave
```

Prices, product names and totals are resolved server-side, so the bot only ever supplies
`productId`, `quantity` and an optional `variantId` — exactly the input the feature under
test cares about.

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
  city or country level. Location must be configurable and the failure reported clearly
  rather than counted as a bot-detection hit.
- **OTP is conditional** on `CustomerAuthSettings.RequireOtpOnPlaceOrder`. When the API
  runs with `MockOtp:Enabled=true` the code is fixed (`000000` in
  `appsettings.Development.json`), so the bot needs no mailbox. Against an environment
  without MockOtp, an OTP-requiring store needs a mail-catcher — see §6 prerequisites.
- **A blocked phone does not fail the order.** By design the order is still created, still
  walks the whole flow including OTP, and parks in `Blocked` for the merchant to release
  or reject. So the blocklist assertion is *"201 Created, and tracked status is Blocked"*
  — **not** *"request rejected"*. (`PlaceOrderCommandHandler.cs:99-104, 301-310`)
- **A blocked order must not consume a promo redemption** — redemption is recorded only on
  merchant release. That is a directly assertable invariant.
  (`PlaceOrderCommandHandler.cs:286-298`)
- **There is currently no rate limiting, CAPTCHA or antiforgery on the storefront order
  route.** `Program.cs` registers CORS and antiforgery but no limiter. The bot is
  therefore also the harness that will validate those defenses when they land — today it
  should sail through, and that baseline is worth recording.

---

## 3. Shape of the tool

### Stack

**Node 20 + TypeScript**, plain `fetch`, no framework. Rationale: zero coupling to the
solution (test code can never ship inside the product), trivial concurrency for the volume
scenarios, and Playwright drops straight in for Level 3 without a second language.
A .NET console project is a reasonable alternative if the team prefers a single toolchain —
the design below is stack-agnostic — but it buys nothing here and pulls test tooling into
`Qaflaty.slnx`.

### Layout

```
tools/order-bot/                 # not in Qaflaty.slnx, not in the Angular workspace
├── package.json
├── README.md
├── src/
│   ├── main.ts                  # CLI: order-bot run <scenario> [--orders N] [--concurrency C]
│   ├── config.ts                # load + validate scenario file, safety rails
│   ├── api/
│   │   ├── client.ts            # fetch wrapper: tenant headers, retries, latency capture
│   │   ├── storefront.ts        # store, products, categories, payment-methods, locations
│   │   ├── cart.ts              # guest-cart + presence
│   │   └── orders.ts            # calculate, place, verify-otp, track
│   ├── shopper.ts               # one virtual shopper = identity + guest id + full journey
│   ├── identity.ts              # name / phone / email generation (tagged, see §5)
│   ├── pacing.ts                # human | fast | burst think-times and jitter
│   ├── runner.ts                # N orders across C workers, ramp-up, abort-on-error-rate
│   ├── assertions.ts            # per-scenario expected outcome
│   └── report.ts                # JSONL per order + summary, non-zero exit on failure
├── scenarios/                   # one file per scenario in §4
└── browser/                     # Phase 3, Playwright
    └── checkout.spec.ts
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

otp: { mode: mock, code: "000000" }   # mock | none | mailcatcher

expect:
  httpStatus: 201
  finalStatus: Confirmed    # Confirmed | Blocked | Pending
```

### Output

- `runs/<timestamp>/orders.jsonl` — one line per attempt: shopper id, guest id, phone,
  items, HTTP status, error code, order number, final tracked status, per-step latency.
- `runs/<timestamp>/summary.json` + a console table — counts by outcome, error-code
  histogram, latency p50/p95/p99, orders/sec.
- **Exit code non-zero when assertions fail**, so scenarios are CI-runnable.

---

## 4. Scenario library

| # | Scenario | Setup | Assertion |
|---|----------|-------|-----------|
| S1 | **Bulk volume** | 200–2000 orders, mixed products/quantities, `fast` pacing | All 201/`Confirmed`; capture throughput + latency as the perf baseline |
| S2 | **Blocklist catches the bot** | Merchant blocks phone P; bot orders from P | 201 Created, tracked status `Blocked`, order appears in merchant blocked-orders list |
| S3 | **Blocklist doesn't over-reach** | Same run, phones *not* on the list | All `Confirmed` — no false positives |
| S4 | **Promo not consumed while blocked** | Blocked phone + limited-use promo | Order shows the discount, but redemption count is unchanged until release |
| S5 | **Burst from one identity** | 100 orders, one phone/IP, `burst` pacing, zero think-time | Today: all succeed (records the undefended baseline). After rate limiting lands: expect 429 past the threshold |
| S6 | **Human-paced baseline** | 50 orders, `human` pacing, unique identities, browse-before-buy | Must **never** be flagged — this is the false-positive guard for every future defense |
| S7 | **Cart flooding / abandonment** | Add to cart + heartbeat, never check out | Merchant active-carts and downsell surfaces populate and stay responsive |
| S8 | **OTP flow** | OTP-required store: place → resend → verify | `Pending` → `Confirmed`; wrong/expired codes rejected |
| S9 | **Release / reject round-trip** | S2 orders, then merchant releases one and rejects another | Released → `Confirmed` + redemption recorded; rejected → stays out of fulfilment |

S3 and S6 are the ones that get skipped and shouldn't be: a bot-blocking feature that also
blocks real customers is worse than no feature at all.

---

## 5. Safety rails (non-negotiable)

This tool generates abuse-shaped traffic. It gets guardrails in the first commit, not later:

1. **Target allowlist.** Refuses to run unless `baseUrl` is localhost/127.0.0.1 or a host
   in an explicit `allowedHosts` list. Anything else needs `--allow-remote` *plus* an
   interactive confirmation. No "point it at prod by typo".
2. **Default caps.** `orders ≤ 500`, `concurrency ≤ 20` unless explicitly raised.
3. **Every bot order is tagged and traceable** — dedicated email domain
   (`…@qaflaty-bot.test`), a reserved phone prefix, and a marker in customer notes. Bot
   data must never be indistinguishable from real data.
4. **Cleanup command.** `order-bot cleanup --scenario <name>` removes orders/customers
   created under the bot's markers (dev DB only, same allowlist rules).
5. **Not wired into any deploy pipeline.** Scenarios run on demand or in a dedicated
   test-environment CI job.

---

## 6. Prerequisites

- API running locally (`dotnet run --project src/Qaflaty.Api`) against the docker-compose
  Postgres.
- A seeded **Active** store with a known slug, ≥3 published products (one with variants),
  at least one enabled payment method, and delivery enabled for the target location.
- `MockOtp:Enabled=true` if the target store requires OTP on place-order (already the case
  in `appsettings.Development.json`). Otherwise a mail-catcher is needed and the bot's
  `otp.mode: mailcatcher` adapter has to be written — avoid this for the first pass.
- Merchant credentials **only** for scenarios S2/S4/S9, which need the merchant side to
  block a phone and release/reject orders. Kept in a separate optional config block so the
  common scenarios need no merchant auth at all.

---

## 7. Phasing

| Phase | Deliverable | Notes |
|-------|-------------|-------|
| **0** | Seed script / documented store setup | Unblocks everything else |
| **1** | HTTP bot core — one order end-to-end, single scenario file, real assertions | The proof the whole approach works |
| **2** | Volume: concurrency, ramp-up, pacing personas, JSONL + summary reporting | Delivers S1, S5, S6, S7 |
| **3** | Merchant-side helper (login, block phone, release/reject) | Delivers S2, S3, S4, S8, S9 — the anti-bot suite |
| **4** | Cleanup command + CI job for the assertion scenarios | Makes it repeatable |
| **5** | Playwright browser mode reusing the same scenario files | Only needed once a defense requires a real browser |

### Optional backend follow-ups (separate decision, not part of the bot)

- **Test-traffic tagging** — an optional `Source` on `PlaceOrderRequest` (or a
  `X-Test-Traffic` header honoured only in Development) so bot orders are labelled at the
  domain level via the existing `Order.Source`, instead of by naming convention.
- **Rate limiting** on `/api/storefront/orders` and `/api/storefront/guest-cart/items` —
  the bot exists partly to tell you what threshold is safe. Run S6 first to find the real
  human ceiling, then set the limit above it.
