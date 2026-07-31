# order-bot

Places storefront orders with configurable products and quantities, for volume testing.

It runs outside the Angular apps and outside the .NET solution, and talks to the running
API over HTTP exactly as the store SPA does — same endpoints, same headers, same payloads.
Bot orders are left in the database; identities carry a run tag so they stay filterable.

See [`docs/ORDER_BOT_PLAN.md`](../../docs/ORDER_BOT_PLAN.md) for the design and the phases.
**Phases 1 and 2 are both done:** the full storefront journey per order (Phase 1), plus
concurrency, ramp-up, pacing personas and latency reporting (Phase 2).

## Requirements

Node 22.6+ only — no dependencies, no `npm install`. The TypeScript sources run without a
build step via Node's type stripping. (`npm install` is only needed for
`npm run typecheck`.)

Node 22.18+ or 24+ strips types with no flags. On 22.6–22.17 the flag is still required,
so **start from `bot.mjs`, not `src/main.ts`** — it re-execs with the flag when the running
Node needs it.

## Usage

```bash
cd tools/order-bot

node bot.mjs run scenarios/smoke.json                # 1 order, sequential — a quick check
node bot.mjs run scenarios/volume.json                # 50 orders, 10 at a time, fast pacing
node bot.mjs run scenarios/human-paced.json           # 10 orders, human-like browsing speed
node bot.mjs run scenarios/smoke.json --orders 25
node bot.mjs --help
```

Exit code is `0` when every order was placed and the run wasn't aborted early, `1` otherwise.

## Concurrency, ramp-up and pacing

A scenario doesn't just say how many orders to place — it says how they should arrive.

- **`concurrency`** — how many shoppers place orders at the same time (default `1`, capped
  at `20`). `1` is a single shopper doing everything one order after another, the way Phase 1
  worked. `10` is ten shoppers checking out at once, each picking up the next order the
  moment it finishes its last one.
- **`rampUpSeconds`** — instead of all workers starting in the same instant, their *first*
  order is spread evenly across this many seconds. `concurrency: 10, rampUpSeconds: 5` means
  worker 1 starts immediately, worker 10 starts around the 4.5s mark — traffic building up
  rather than slamming the store all at once. `0` (the default) starts every worker together.
- **`pacing`** — how long a shopper pauses between steps, i.e. whether it behaves like a
  script or like someone actually reading the page:

  | Mode | Behaviour | Use it for |
  |------|-----------|-------------|
  | `burst` | Zero delay anywhere — every request fires as fast as the network allows | The undefended baseline: what does traffic look like with no pacing at all |
  | `fast` (default) | Short, small pauses — a fraction of a second per step | Just filling a store with data quickly, without looking like a zero-delay attacker |
  | `human` | Seconds-long pauses: reading a product page, thinking between adding items, filling in the checkout form | Making dashboard/analytics data (active shoppers, order timing) look like real customers, not a script |

A run whose failure rate hits 50% after at least 10 attempts stops itself early instead of
placing hundreds more orders that are unlikely to succeed — the summary reports this as
`aborted` with the reason, and the exit code is non-zero.

## Before the first run

The bot needs a store it can actually order from:

1. The API is running (`dotnet run --project src/Qaflaty.Api`) against the docker-compose
   Postgres, on the `baseUrl` in the scenario.
2. A store exists with the scenario's `storeSlug` and its status is **Active** —
   `TenantMiddleware` rejects anything else with `Store.NotFound` / `Store.Inactive`.
3. The store has at least one published, in-stock product.
4. Delivery is enabled for the scenario's `location`, otherwise every order fails with
   `Order.DeliveryNotAvailable`.
5. If the store has `RequireOtpOnPlaceOrder` switched on, run the API with
   `MockOtp:Enabled=true` (already the default in `appsettings.Development.json`) so the
   bot can clear OTP with the fixed code instead of reading a mailbox.

## Scenario file

```jsonc
{
  "name": "smoke",
  "baseUrl": "http://localhost:5000/api",
  "storeSlug": "demo-store",

  "orders": 1,                       // capped at 500
  "concurrency": 1,                  // shoppers placing orders at once; capped at 20
  "rampUpSeconds": 0,                // spread worker start times across this many seconds
  "pacing": "fast",                  // burst | fast | human — see "Concurrency, ramp-up and pacing"

  // Empty = discover in-stock products from the catalog.
  // Otherwise: [{ "id": "<guid>", "quantityMin": 1, "quantityMax": 5, "weight": 3,
  //              "variantId": null }]
  "products": [],
  "itemsPerOrder": { "min": 1, "max": 2 },

  "identity": {
    "phoneRegion": "SA",             // EG | SA | AE | KW | JO
    "emailDomain": "qaflaty-bot.test",
    "namePrefix": "Bot"
  },

  "location": {
    "countryCode": 682,              // ISO 3166-1 *numeric* (682 = Saudi Arabia)
    "cityId": 6821,                  // from shared/models/geo-data.ts; null = first city
    "districtId": null
  },

  "paymentMethod": "auto",           // "auto" = first enabled method the store returns
  "promoCode": null,
  "notes": null,                     // free text prefixed to the run tag in order notes

  "otp": { "mode": "mock", "code": "000000" },  // "none" leaves OTP orders Pending

  "seed": 1,                         // null = non-deterministic; reproducible even under concurrency
  "allowedHosts": [],                // non-loopback hosts this scenario may target
  "userAgent": "qaflaty-order-bot/0.1",
  "timeoutMs": 15000
}
```

## What one order does

```
POST /storefront/presence/heartbeat      → visible in the merchant's live active-users metric
GET  /storefront/products/{slug}         → product page view
POST /storefront/guest-cart/items        → one call per line item
POST /storefront/orders/calculate        → totals preview; flags an undeliverable address early
POST /storefront/orders                  → the order
POST /storefront/orders/{n}/verify       → only when the store returned Pending
GET  /storefront/orders/track/{n}        → final status, tracked by the shopper's email
POST /storefront/presence/leave
```

Prices, names and totals are resolved server-side, so the bot only ever supplies
`productId`, `quantity` and an optional `variantId`.

## Output

Each run writes to `runs/<timestamp>-<scenario>/`:

- `orders.jsonl` — one line per attempt: shopper, items, order number, final status, total,
  every HTTP step with its status and latency, and the error when one failed. With
  `concurrency` above 1, lines land in *completion* order, not the shopper's `index` — that's
  expected, not a bug.
- `summary.json` — counts by status, error-code histogram, total value, end-to-end latency
  percentiles (p50/p95/p99) per order, throughput in orders/sec, and whether the run was
  aborted early by the failure-rate breaker.

## Notes

- **Phone numbers are E.164 and region-valid**, e.g. `+966501234567` with
  `phoneCountryCode: "SA"` — the shape the shared `PhoneInputComponent` posts, since it emits
  `${dialCode}${digits}`. `PhoneNumber.Create` runs libphonenumber's `IsValidNumberForRegion`,
  so numbers are built from real mobile prefixes for the chosen region. Adding a region means
  adding its dial code and prefixes to `src/geo.ts`.
- **Locations are static, not from the API.** The checkout page reads them from
  `clients/qaflaty-workspace/projects/shared/src/lib/models/geo-data.ts`, and `countryCode`
  is the ISO numeric code, not a dial code. `src/geo.ts` mirrors a subset of that file —
  keep the ids in sync if it changes.
- **Safety rails.** The bot refuses any non-loopback target unless the host is in
  `allowedHosts` or `--allow-remote` is passed, and caps a run at 500 orders.
- **A blocked order is invisible here.** `CustomerFacingOrderStatus` maps `Blocked` to
  `Confirmed` for storefront callers, so if a generated phone happens to be on the store's
  blocklist the bot reports it as confirmed. Checking that is a merchant-side job.
