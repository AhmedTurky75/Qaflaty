# Upselling — Enhanced Requirements & 3 Implementation Plans

> Source: `docs/Cross selling and down selling and up selling Tasks.txt` (Upselling section).
> This document (a) **enhances** the original business requirements and (b) proposes **three
> distinct implementation plans** grounded in the existing Qaflaty architecture. Pick one.

Upselling is the **mirror image of downsell** and a sibling of cross-sell: it recommends *higher-value*
alternatives/upgrades of the current product. Architecturally it is the **cheapest of the three** to
build because it is the same typed-relationship engine as cross-sell with the price predicate flipped
(`higher` instead of `lower`) and no trigger/coupon machinery.

---

## 0. What already exists (reuse it)

| Building block | Location | Reused for |
|---|---|---|
| Typed relationship engine (cross-sell Plan B) | `ProductRelationship` + Strategy pipeline | upsell alternatives |
| Auto scorer (category + shared property + newest) | `GetRelatedProductsQueryHandler` | auto upsell fallback |
| Manual curated links + merchant endpoints | `RelatedProductLink`, `MerchantRelatedProductsController` | manual upsell |
| Cart aggregate (guest + auth) | `Domain/Storefront/Aggregates/Cart/Cart.cs` | cart-based upsell |
| Product pricing VO (base + compare-at) | `Domain/Catalog/ValueObjects/ProductPricing.cs` | higher-price validation |
| Store configuration | `StoreConfiguration` | enable + limit + titles |
| Product DTO + mapper | `ProductRecommendationMapper`, `ProductPublicDto` | recommendation payload |

**If cross-sell Plan B is built, upsell is ~1–2 days of incremental work** (a new `RelationType`, a
price predicate, config keys, two endpoints, one merchant tab, one store section). The plans below
therefore differ mainly in *how much of the shared engine you assume exists*.

---

## 1. Enhanced Requirements (beyond the original brief)

### 1.1 Typed relationship, shared engine
- Reuse `RelationType.UpSell` on the shared `ProductRelationship` (see cross-selling Plan B). No
  upsell-specific table. This satisfies the brief's many-to-many self-referencing + "no schema redesign".

### 1.2 Price predicate (the one thing that differs from cross-sell)
- **Higher-priced than source** (recommended → enforced-with-override, mirroring downsell's cheaper
  rule): warn at config time if an upsell isn't strictly more expensive; filter at query time so the
  section never shows a *cheaper* product as an "upgrade".
- Compare on effective sale price (`ProductPricing.Price`, honoring compare-at) not list price.
- Same category recommended (warn, don't hard-block — cross-category upgrades exist, e.g. phone → phone+plan bundle).

### 1.3 Variant-aware upsell (enhancement — brief's own example demands it)
The brief's example (`iPhone 16` → `iPhone 16 (256GB)`) is a **same-product, higher variant** upsell.
The current product model has `ProductVariant`s with price overrides. Support **two upsell sources**:
1. **Cross-product** upsell (`ProductRelationship`, e.g. iPhone 16 → iPhone 16 Pro).
2. **Intra-product variant** upsell (recommend a higher-priced *variant* of the same product, e.g.
   128GB → 256GB) computed automatically from `Product.Variants` price ordering. This is a genuinely
   distinct, high-converting upsell the raw brief under-specifies.

### 1.4 Strategy pipeline (Strategy Pattern — required by brief)
`IUpSellStrategy` chain, de-duped, stop at `take`:
1. **Manual** merchant `UpSell` links.
2. **Variant upsell** (higher variant of same product).
3. **Category + higher-price affinity** (reuse auto scorer, add price filter).
4. **Best-selling premium alternatives** fallback.
New strategies (AI, margin-based, personalized) register without touching callers.

### 1.5 Cart upsell aggregation
- Generate from products currently in cart; exclude items already in cart (and their variants);
  de-dupe; score by how many cart lines suggest each upgrade; cap at configurable limit (default 3–4).
- Avoid the awkward case of upselling a product the customer *already* has a higher variant of in cart.

### 1.6 Eligibility rules (shared policy)
Reuse `RecommendationEligibilityPolicy`: never the source itself; active only; out-of-stock exclusion
configurable; same tenant (enforced in SQL); respect visibility; de-dupe; `take` limit — **plus** the
higher-price predicate from §1.2.

### 1.7 Configuration surface
On `StoreConfiguration` (or shared `RecommendationSettings` VO):
- `UpSellEnabled` (bool, default true), `UpSellLimit` (int, default 4).
- `UpSellExcludeOutOfStock` (bool, default true).
- `UpSellTitle` / `UpSellTitleAr` (bilingual — "Upgrade Your Choice" / "Premium Alternatives").
- `UpSellIncludeVariantUpgrades` (bool, default true).
- `UpSellStrategyOrder` (ordered strategy keys).

### 1.8 Non-functional
- Single round-trip: batch-load candidates once, score in memory.
- Cacheable per `(storeId, productId, take)` on PDP with short TTL, invalidated by
  `ProductPriceChangedEvent` / `ProductStockChangedEvent` / link changes. Cart upsell not cached.
- Index `(store_id, source_product_id, relation_type, sort_order)`.
- Bilingual names in every DTO.

### 1.9 UX guardrails
- Only on Product Details + Cart; never checkout / post-purchase.
- Hide the section when < 2 eligible upgrades survive.
- Show the price *delta* ("+120 SAR for 256GB") — upsell converts on framing the upgrade cost, an
  enhancement the raw brief omits. RTL/Arabic correct.

---

## 2. Three Implementation Plans

---

### PLAN A — "Lean Extension" (fastest; ride the existing related-products path)

**Idea:** Identical strategy to cross-sell Plan A. Add `RelationType.UpSell` to `RelatedProductLink`,
thread a type filter through the existing repo/handlers/controllers, add a higher-price filter, done.

**Domain/Infra**
- Reuse the `ProductRelationType` enum (shared with cross-sell). If cross-sell Plan A already added
  `relation_type` to `related_products`, this is *zero* schema work — just a new enum value.

**Application**
- `GetUpSellProductsQuery(productId, take)`: manual `UpSell` links → else auto scorer **filtered to
  strictly-higher effective price**. Reuse extracted `RecommendationEligibilityPolicy`.
- `GetCartUpSellQuery`: union cart items' upsell links, score by frequency, exclude cart contents.
- (Optional) variant-upsell computed inline from `Product.Variants`.

**API**
- Extend `MerchantRelatedProductsController` with `?type=upSell`; add
  `GET /api/storefront/products/{id}/upsell` and `GET /api/storefront/cart/upsell`.

**Frontend**
- Merchant: add an "Upsell" tab to the related-products editor.
- Store: `UpSellSectionComponent` on PDP + cart, showing price delta.

**Pros:** days of work; reuses tested code; if cross-sell Plan A shipped, this is a thin addition.
**Cons:** inherits Plan A's untyped-table smell; variant upsell + strategy chain stay minimal;
caching/analytics deferred.

**Effort:** ~S. **Best when:** cross-sell already shipped as Plan A and you want parity fast.

---

### PLAN B — "Typed Strategy Engine (shared with cross-sell)" (recommended)

**Idea:** Reuse the *same* `ProductRelationship` + Strategy pipeline built for cross-sell Plan B,
passing `RelationType.UpSell` and injecting a higher-price predicate + variant strategy. Upsell becomes
a thin, clean addition to a shared engine — the intended end state.

**Domain**
- `RelationType.UpSell` on `ProductRelationship` (already exists if cross-sell Plan B shipped).
- `HigherPricePredicate` + `VariantUpsellStrategy` (reads `Product.Variants`, orders by effective
  price, returns higher variants of the source product).
- Shared `RecommendationEligibilityPolicy` with the price predicate parameterized (cheaper vs higher).

**Application**
- `IUpSellStrategy` implementations (Manual, Variant, CategoryHigherPrice, BestSellingPremium) composed
  by `CompositeUpSellStrategy` per `StoreConfiguration.UpSellStrategyOrder`.
- Queries `GetProductUpSellQuery` / `GetCartUpSellQuery` build context → composite → policy → map.

**Infrastructure**
- Reuse `product_relationships` (+ index). Register strategies in `DependencyInjection.cs`.
- Optional cache decorator per product, event-invalidated (shared with cross-sell decorator).

**API**
- Merchant: reuse `MerchantProductRelationshipsController` with `type=upSell` (CRUD, reorder,
  enable/disable). Storefront: `GET products/{id}/upsell`, `GET cart/upsell`.

**Frontend**
- Merchant: the shared "Recommendations" store-builder panel gains an Upsell tab (variant-upgrade
  toggle, price-delta preview, bilingual title). Store: shared section component with price delta.

**Config:** `RecommendationSettings` VO gains the upsell keys (§1.7).

**Pros:** near-zero marginal cost on top of cross-sell Plan B; explicit testable strategy chain;
variant upsell included; clean seam to AI/margin strategies. **Cons:** presumes the shared engine
exists (build cross-sell Plan B first, or build the engine here and let cross-sell adopt it).

**Effort:** ~S–M (M if this is where the shared engine is first built). **Best when:** you're building
cross/up/down-sell as one coherent recommendation capability (recommended).

---

### PLAN C — "Margin-Aware & Personalized Upsell" (max headroom)

**Idea:** Plan B plus the platform features — margin-based ranking, personalization, and AI premium
alternatives — so upsell optimizes *profit*, not just order value.

**Adds on top of Plan B**
- **Margin-based strategy**: rank upgrades by contribution margin (needs a cost field on product —
  additive migration) so the store surfaces the *most profitable* viable upgrade, not just the most
  expensive. Directly satisfies the brief's "margin-based recommendation strategies".
- **Personalization context**: customer segment, order history, recently-viewed (`ProductView`) bias
  the upgrade shown (e.g. premium-affinity customers see the top-tier upgrade first).
- **Inventory-aware**: prefer upgrades with healthy stock; suppress low-stock upgrades (config).
- **AI premium alternatives**: reuse the embeddings/RAG stack to find semantically-similar higher-tier
  products when no manual upsell exists.
- **Analytics**: shared `recommendation_events` (with cross-sell) attributing impressions, CTR,
  upgrade-accept rate, and incremental revenue/margin from upsell.
- **A/B hooks**: strategy order + title variants per experiment bucket.

**Pros:** turns upsell into a profit-optimization surface; satisfies every "future extensibility"
bullet (AI, personalization, inventory-aware, best-selling premium, margin-based); shares analytics
with cross-sell. **Cons:** needs a product cost/margin field and data to tune; over-scoped as a first
release.

**Effort:** ~L. **Best when:** upsell is a strategic margin lever and cross-sell Plan B/C already exist.

---

## 3. Recommendation

Build upsell as **Plan B, immediately after (or together with) cross-sell Plan B** — they share one
engine and upsell is the cheapest way to prove that engine generalizes across relation types. Include
the **variant-upgrade strategy** (§1.3) even in the first release; it's low effort and among the
highest-converting upsell patterns. Defer **Plan C** until a product cost/margin field and recommendation
analytics exist.

## 4. Cross-cutting checklist (all plans)
- [ ] Upsell filtered to strictly-higher effective price than source (query time).
- [ ] Variant-upgrade upsell computed from `Product.Variants` when enabled.
- [ ] Price delta shown in the UI ("+X for the upgrade").
- [ ] Tenant isolation enforced in SQL (`store_id`).
- [ ] Eligibility policy unit-tested (self, inactive, out-of-stock toggle, dedupe, take-limit, price predicate).
- [ ] Excludes items already in cart (and their variants) on the cart surface.
- [ ] Bilingual names + titles.
- [ ] Section hidden when < 2 eligible upgrades.
- [ ] Not rendered on checkout / post-purchase.
- [ ] Migration (if any) applied by the user (project convention).
