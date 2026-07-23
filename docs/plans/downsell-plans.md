# Downsell — Enhanced Requirements & 3 Implementation Plans

> Source: `docs/Cross selling and down selling and up selling Tasks.txt` (Downsell section).
> This document (a) **enhances** the original business requirements and (b) proposes **three
> distinct implementation plans** grounded in the existing Qaflaty architecture. Pick one.

Downsell is the most behaviorally complex of the three features: it combines a **typed product
relationship** (cheaper alternatives), an **offer** (coupon/promo), a **trigger/rule engine**
(behavioral signals), **frequency capping**, and **analytics**. It reuses the same relationship
substrate as cross/up-sell, but adds a rules engine and an offer layer on top.

---

## 0. What already exists (reuse it)

| Building block | Location | Reused for |
|---|---|---|
| Typed relationship engine (from cross-sell Plan B) | `ProductRelationship` + Strategy pipeline | downsell *product* alternatives |
| Promo codes / coupons (percentage, fixed, free-shipping) | `Domain/Catalog/Aggregates/PromoCode/PromoCode.cs` | downsell *offer* alternatives |
| Promo validation + discount calc | `PromoCode.Validate()` / `CalculateDiscount()` | offer eligibility |
| Product-view tracking (session/customer) | `ProductView`, `TrackProductView` | "visited N times", "stayed on page" |
| Cart aggregate (guest + auth) | `Domain/Storefront/Aggregates/Cart/Cart.cs` | "removed from cart", "cart inactive" |
| Store configuration + feature toggles | `StoreConfiguration`, `FeatureToggles` | enable/disable + settings |
| Storefront tracking endpoint | `Api/Controllers/StorefrontTrackingController.cs` | behavioral signal ingestion |

**Key architectural distinction for downsell:** triggers are partly **client-side** (exit intent,
dwell time, inactivity are browser events) and partly **server-side** (visit counts, cart removal,
eligibility, capping). The design must split responsibilities cleanly: the **client detects a signal
and asks the server "should I show a downsell?"**; the **server owns the decision** (eligibility,
capping, which offer). Never let the client decide *what* to show — only *when to ask*.

---

## 1. Enhanced Requirements (beyond the original brief)

### 1.1 Two downsell payload types (unify under one config)
A downsell configuration resolves to **either or both**:
- **Product downsell** — cheaper `DownSell`-typed `ProductRelationship`s (reuse cross-sell substrate).
- **Offer downsell** — an existing `PromoCode`/promotion surfaced as an incentive to complete purchase.
Model an `DownsellOffer` that references *either* a target product set *or* a promo code (or both),
with a display priority. The brief says "instead of or in addition to" — support both simultaneously.

### 1.2 Trigger rules as data (Rule Engine — required by brief, made concrete)
Model triggers as **configurable rows**, not hard-coded branches. A `DownsellTriggerRule` has:
- `TriggerType` enum: `ExitIntentPdp`, `DwellTimePdp`, `CartItemRemoved`, `CartInactivity`,
  `RepeatProductVisits` (future), extensible.
- `Threshold` (e.g. seconds of dwell/inactivity, or visit count).
- `Surface` (`ProductDetails` | `Cart`).
- `IsEnabled`, `Priority`.
Multiple rules may be enabled simultaneously (brief). Evaluation is an `IDownsellTriggerEvaluator`
strategy per type, so new triggers register without touching callers.

### 1.3 Server-authoritative decision endpoint (enhancement — critical)
Single endpoint `POST /api/storefront/downsell/evaluate` with body `{ surface, triggerType, productId?,
cartId?, sessionId, context }`. Server:
1. checks feature enabled + rule enabled + threshold consistent with client claim (defense-in-depth);
2. applies **frequency cap** (see 1.4);
3. resolves the **highest-priority eligible offer** (product set and/or coupon);
4. applies eligibility policy (active, in-stock-configurable, same tenant, not the original, deduped,
   **cheaper than original** for product downsell — see 1.5);
5. records an *impression* if it returns an offer;
6. returns the offer payload or `204 No Content` (nothing to show).

### 1.4 Frequency capping & session state (made precise)
- "Display only once per configured interval" + "limit shows per session" → track shows per
  `(sessionId | customerId, storeId, ruleType)` with a `MaxShowsPerSession` and a
  `MinIntervalSeconds` cooldown. Store server-side (short-lived) keyed on session; the server, not the
  client, enforces it so it can't be bypassed by refresh.
- Distinguish **impression** (shown) from **acceptance** (clicked / added / coupon applied).

### 1.5 Product downsell validation (recommended validation → enforced-with-override)
- Same category (recommended). Emit a merchant-facing **warning**, don't hard-block cross-category.
- **Lower-priced than original**: validate at *configuration time* (warn) *and* filter at *query time*
  (a downsell must be strictly cheaper than the source, else it isn't a downsell). This is the one rule
  that genuinely differs from cross/up-sell and justifies the typed relationship.
- Available for purchase (active + in-stock configurable).

### 1.6 Configuration surface (new — on StoreConfiguration or dedicated aggregate)
- `DownsellEnabled` (bool, default false — opt-in, unlike cross-sell).
- Per-store default `MaxShowsPerSession`, `MinIntervalSeconds`.
- `DownsellExcludeOutOfStock` (bool, default true).
- Bilingual heading/subtext for the offer modal.
- Ordered `DownsellTriggerRule` list + `DownsellOffer` list per product/store.

### 1.7 Analytics (brief requires it — schema made explicit)
Append-only `downsell_events` capturing: `impression`, `accept`, `dismiss`, `coupon_redeemed`,
`converted`, with `triggerType`, `offerType`, source product, chosen product, coupon, session,
timestamp, and (on convert) attributed revenue. Backs future dashboards:
- offers displayed, trigger breakdown, acceptance rate, coupon redemption rate, post-downsell
  conversion rate, revenue generated. Coupon redemption joins to existing `PromoCodeRedemption`.

### 1.8 Multi-tenant + safety
- Products, coupons, rules all resolved via `StoreId`; never expose another tenant's promo.
- Downsell modal must **not** appear on checkout / post-purchase (enforce by not wiring the trigger
  detectors on those routes).
- Coupon surfaced by downsell must still pass `PromoCode.Validate()` at apply time — the downsell only
  *advertises*; the cart/checkout remains the source of truth for actual discounting.

### 1.9 Non-functional
- Trigger evaluation is lightweight: the hot path is a single keyed cache/state read + one indexed
  offer lookup. No heavy aggregation on the request path.
- Merchant settings cached per store, event-invalidated.
- Indexing on `(store_id, source_product_id, relation_type)` and on `downsell_events(store_id, created_at)`.
- Client detectors are debounced/throttled and never block interaction.

---

## 2. Three Implementation Plans

---

### PLAN A — "Coupon-First MVP" (fastest path to value; no product-relationship work)

**Idea:** Ship the highest-ROI slice first: a single behavioral trigger (exit-intent on PDP + cart
inactivity) that surfaces an **existing promo code** as a "wait — here's 10% off" modal. Defer product
alternatives entirely.

**Domain**
- `DownsellRule` value object/entity on `StoreConfiguration`: `{ triggerType, threshold, promoCodeId,
  maxShowsPerSession, minIntervalSeconds, isEnabled }`. Reuse `PromoCode` as the offer.

**Application**
- `EvaluateDownsellQuery(surface, triggerType, sessionId, storeId)` → checks enabled + cap, returns the
  configured promo (code, label, discount preview via `PromoCode.CalculateDiscount`) or nothing.
- Session cap state in `IMemoryCache` keyed by `(sessionId, storeId, triggerType)`.
- Minimal `RecordDownsellEventCommand` (impression/accept) writing to a simple `downsell_events` table.

**API**
- `POST /api/storefront/downsell/evaluate`, `POST /api/storefront/downsell/event`.
- Merchant: extend store-builder settings with a "Downsell" panel (enable, pick trigger(s), pick coupon,
  caps).

**Frontend**
- Store: a `DownsellDirective`/service that wires **exit-intent** (mouseleave to top on desktop) and
  **cart inactivity** timers, calls evaluate, shows a `DownsellModalComponent` with the coupon.
- Merchant: `pages/downsell.component.ts` in store-builder.

**Pros:** live in days; zero new relationship modeling; reuses coupons + tracking; immediate revenue
lever. **Cons:** no cheaper-product path; rules not fully generalized; analytics minimal.

**Effort:** ~S. **Best when:** you want to validate downsell lift before investing in the full engine.

---

### PLAN B — "Product + Coupon Downsell with Rule Engine" (recommended)

**Idea:** Full downsell over the shared typed-relationship engine (from cross-sell Plan B) plus a real
trigger rule engine and offer layer. This is the complete, extensible feature the brief describes.

**Domain**
- Reuse `ProductRelationship` with `RelationType.DownSell` for cheaper alternatives; add the
  **cheaper-than-source** validation at query time.
- New `DownsellOffer` aggregate: `{ StoreId, ProductId?, promoCodeId?, targetProductIds[], priority,
  isEnabled }` — a product may map to one or more offers; store-wide fallback offers allowed.
- `DownsellTriggerRule` entity (types, threshold, surface, priority, enabled).
- `IDownsellTriggerEvaluator` strategy per `TriggerType`; server-side ones (repeat visits via
  `ProductView`, cart-removed) validated server-side; client-only ones (exit intent, dwell) trusted as
  *signals* but still gated by server eligibility + capping.
- `DownsellDecisionService` (domain/app service): given context → highest-priority eligible offer.

**Application**
- `EvaluateDownsellQuery` orchestrates: feature check → rule match → cap check → decision service →
  eligibility policy (shared `RecommendationEligibilityPolicy` + cheaper filter) → impression record.
- CRUD commands for rules and offers (merchant).
- `GetDownsellAnalyticsQuery` (aggregations over `downsell_events`).

**Infrastructure**
- Tables: `downsell_offers`, `downsell_trigger_rules`, `downsell_events` (append-only), reuse
  `product_relationships`. Indexes per §1.9. Register evaluators + decision service in DI.
- Session cap state via `IMemoryCache` (or distributed cache if multi-instance).

**API**
- Storefront: `POST downsell/evaluate`, `POST downsell/event`.
- Merchant: `MerchantDownsellController` — rules CRUD, offers CRUD, analytics read; product-level
  downsell picker on the product editor.

**Frontend**
- Store: `DownsellService` + detectors (exit-intent, dwell timer, cart-inactivity timer,
  cart-item-removed hook) → `DownsellModalComponent` rendering either cheaper products or a coupon (or
  both), with accept/dismiss tracking.
- Merchant: store-builder "Downsell" section (enable, trigger rules with thresholds, offers, caps,
  priority) + per-product downsell alternatives editor. Bilingual copy fields.

**Pros:** complete feature; rules + offers fully data-driven; shares relationship engine with
cross/up-sell; analytics real; new triggers/offers extend cleanly. **Cons:** meaningfully larger;
careful client/server responsibility split required; multiple migrations.

**Effort:** ~L. **Best when:** downsell is a committed feature and you want it done right once.

---

### PLAN C — "Behavioral Scoring & Personalized Downsell Platform" (max headroom)

**Idea:** Plan B plus real-time behavioral scoring and personalization — the "abandonment probability"
the brief hints at becomes an actual (simple, explainable) score, and offers adapt to customer
segment / margin.

**Adds on top of Plan B**
- **Abandonment scoring service** `IAbandonmentScorer`: combines signals (dwell, exit intent, repeat
  visits from `ProductView`, cart dwell, prior dismissals) into a 0–1 score; the trigger fires when
  score crosses a configurable threshold rather than on a single raw signal. Starts rule-based/weighted
  (explainable, no ML infra) with a clean seam for an ML model later.
- **Personalization context**: customer segment, loyalty, order history feed offer selection
  (e.g. bigger coupon for high-abandonment-risk / low-loyalty customers) — margin-aware so downsell
  never destroys margin (floor per product).
- **Dynamic discount**: compute the *smallest* incentive likely to convert (bounded by merchant caps)
  instead of a fixed coupon — ties into `PromoCode` or a transient one-time offer token.
- **Full analytics platform**: `downsell_events` partitioned, cohort/funnel queries, revenue
  attribution, A/B experiment buckets on rule/offer selection, exportable for dashboards.
- **AI-powered alternatives**: reuse the embeddings/RAG stack to suggest semantically-cheaper
  alternatives when no manual downsell is configured.

**Pros:** satisfies every "future extensibility" bullet (AI, personalization, dynamic discount,
inventory-aware, segmentation, real-time scoring); strong revenue optimization. **Cons:** significant
scope + ownership; scoring/personalization need iteration + data; over-built as a first release.

**Effort:** ~XL. **Best when:** downsell/retention is a strategic optimization surface with data to tune it.

---

## 3. Recommendation

Ship **Plan A first as a 1–2 week validation**, then evolve into **Plan B** (its data model is a strict
superset — the Plan A coupon rule becomes one `DownsellOffer` + one `DownsellTriggerRule`, no rework if
you name the tables with Plan B in mind from day one). Treat **Plan C** as a later optimization phase
once analytics prove downsell lift. This staged path avoids both premature platform-building and
throwaway MVP work.

## 4. Cross-cutting checklist (all plans)
- [ ] Server is authoritative for *what* to show and *whether* to show (capping, eligibility) — client only signals *when to ask*.
- [ ] Frequency cap enforced server-side, survives refresh, keyed by session/customer.
- [ ] Product downsell filtered to strictly-cheaper-than-source at query time.
- [ ] Advertised coupon re-validated by `PromoCode.Validate()` at apply time.
- [ ] Not wired on checkout / post-purchase routes.
- [ ] Tenant isolation on products, coupons, rules, events.
- [ ] `downsell_events` append-only + indexed for analytics.
- [ ] Detectors debounced/throttled; never block interaction; desktop-only exit-intent.
- [ ] Bilingual offer copy.
- [ ] Migrations applied by the user (project convention).
