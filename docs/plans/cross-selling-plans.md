# Cross-Selling — Enhanced Requirements & 3 Implementation Plans

> Source: `docs/Cross selling and down selling and up selling Tasks.txt` (Cross-Selling section).
> This document (a) **enhances** the original business requirements and (b) proposes **three
> distinct implementation plans** grounded in the existing Qaflaty architecture. Pick one.

---

## 0. What already exists (do not rebuild it)

The codebase already ships a recommendation substrate that cross-selling should extend, not duplicate:

| Building block | Location |
|---|---|
| Merchant-curated product-to-product links | `Domain/Storefront/Aggregates/RelatedProduct/RelatedProductLink.cs` |
| Related-products repo | `Domain/Storefront/Repositories/IRelatedProductRepository.cs` |
| Manual vs auto toggle | `StoreConfiguration.RelatedProductsManual` |
| Auto scoring (category + shared properties + newest) | `Application/Storefront/Recommendations/GetRelatedProducts/GetRelatedProductsQueryHandler.cs` |
| Frequently-bought-together (order history) | `Application/Storefront/Recommendations/GetFrequentlyBoughtTogether/…` |
| Product-view tracking (session/customer) | `Domain/Storefront/Aggregates/ProductView/ProductView.cs`, `TrackProductView` |
| Merchant management endpoints | `Api/Controllers/MerchantRelatedProductsController.cs` |
| Storefront read endpoints | `Api/Controllers/StorefrontRecommendationsController.cs` |
| Product DTO + mapper | `ProductRecommendationMapper`, `ProductPublicDto` |

**The current `RelatedProductLink` is untyped** — it only expresses a generic "related" relationship.
Cross-sell, up-sell and down-sell are three *typed* relationships over the same shape. That single
observation drives the design decisions below.

---

## 1. Enhanced Requirements (beyond the original brief)

The original brief is solid but under-specifies several areas. Enhancements:

### 1.1 Relationship modeling
- **Typed relationships**, not a new table per feature. Introduce a `ProductRelationType` enum
  (`CrossSell`, `UpSell`, `DownSell`, `Related`) so cross/up/down-sell share one storage shape,
  one repository, one management surface, and one query pipeline. This directly satisfies the brief's
  "support future expansion without requiring schema changes."
- **Bidirectional intent flag** (enhancement): a merchant linking A→B often wants B→A too
  (case + phone). Support an optional "also add the reverse link" convenience at the command layer
  (two rows, still explicit — never silently inferred at query time).

### 1.2 Recommendation strategy (Strategy Pattern — required by brief, made concrete)
- Define `ICrossSellStrategy` with a priority-ordered chain:
  1. **Manual** merchant links (typed `CrossSell`).
  2. **Frequently bought together** (reuse existing order-history engine, filtered to complements).
  3. **Category/property affinity** (reuse existing auto scorer).
  4. **Best-selling complements** fallback.
- A `CompositeCrossSellStrategy` runs the chain until it fills the requested `take`, de-duplicating
  across strategies. New strategies (AI, personalized) register without touching callers.

### 1.3 Cart-level aggregation (brief says "complement multiple cart items" — made precise)
- Score each candidate by **how many distinct cart items** recommend it (frequency), then by
  strategy rank. Exclude anything already in cart. Exclude the cart items' own variants.
- Cap fan-out: only consider the top *N* cart lines (config, default 10) to bound query cost on large carts.

### 1.4 Eligibility rules (consolidated + made testable)
A single `RecommendationEligibilityPolicy` enforces, for every strategy:
- never the source product itself; never other cart items;
- `Status == Active` only (never Draft/Inactive);
- out-of-stock exclusion is **configurable** (`ExcludeOutOfStock`, default `true`);
- **same tenant only** (enforced at repo query via `StoreId`, not post-filter);
- de-duplicate; respect `take` limit.

### 1.5 Configuration surface (new)
Add to `StoreConfiguration` (or a nested `RecommendationSettings` VO):
- `CrossSellEnabled` (bool, default true)
- `CrossSellLimit` (int, default 4)
- `CrossSellExcludeOutOfStock` (bool, default true)
- `CrossSellTitle` / `CrossSellTitleAr` (bilingual heading — "Frequently Bought Together")
- `CrossSellStrategyOrder` (ordered list of strategy keys, for future tuning)

### 1.6 Non-functional (made explicit)
- **Single round-trip** per surface: batch-load candidate products by store once, score in memory.
- **Caching**: cache per `(storeId, productId, type, take)` for product-page cross-sell with a short
  TTL (e.g. 5 min) and **invalidate on** product update / stock change / link change domain events.
  Cart cross-sell is *not* cached (cart is volatile) but reuses the cached per-product link sets.
- **Indexing**: composite index on `(store_id, product_id, relation_type, sort_order)`.
- **Bilingual**: recommendations must carry English + Arabic names (project already bilingual —
  see `ProductName`). `ProductRecommendationMapper` must emit both.

### 1.7 Analytics hooks (enhancement — brief omits this for cross-sell but downsell has it)
Emit lightweight events for later reporting: `impression`, `click`, `add_to_cart_from_recommendation`,
attributed by `type`, source product, and surface (PDP vs cart). Fire-and-forget; never block the render.

### 1.8 Placement & UX guardrails
- Only on **Product Details** and **Cart** (brief). Explicitly *not* on checkout/post-purchase — enforce
  by simply not calling the endpoint there; document it so it isn't added by accident.
- Graceful empty state: if fewer than 2 results survive eligibility, hide the section entirely.
- Accessibility + RTL: section renders correctly in Arabic/RTL.

---

## 2. Three Implementation Plans

Each plan delivers the same user-visible feature but trades off scope, effort, and future headroom.

---

### PLAN A — "Lean Extension" (fastest; reuse the existing related-products path)

**Idea:** Cross-sell is just a *second flavor* of the existing manual related-products mechanism.
Add a `RelationType` discriminator to `RelatedProductLink` and thread it through the existing
repository, handlers, and controllers.

**Domain**
- Add `enum ProductRelationType { Related, CrossSell, UpSell, DownSell }` in `Domain/Storefront/Enums/`.
- Add `RelationType` to `RelatedProductLink` (default `Related` for backfill). Keep the factory
  signature backward-compatible with an overload.

**Infrastructure**
- Migration: add `relation_type` column (int, default 0) + extend the unique/index to
  `(store_id, product_id, relation_type, sort_order)`.
- `IRelatedProductRepository.GetByProductIdAsync` gains an optional `ProductRelationType?` filter.

**Application**
- New `GetCrossSellProductsQuery(ProductId, take)` handler: loads `CrossSell` links, falls back to the
  **existing** `GetRelatedProductsQueryHandler` auto scorer when none exist. Reuse
  `RecommendationEligibilityPolicy` (extract from current inline filtering).
- New `GetCartCrossSellQuery(cartId/guestSessionId, take)`: load cart items, union their cross-sell
  links, score by frequency, exclude cart contents.
- Reuse `SetManualRelatedProductsCommand` with an added `RelationType` parameter.

**API**
- Extend `MerchantRelatedProductsController` with `?type=crossSell` on existing routes (or add
  `products/{id}/cross-sell` aliases).
- Add `GET /api/storefront/products/{id}/cross-sell` and `GET /api/storefront/cart/cross-sell`.

**Frontend**
- Merchant: add a "Cross-sell" picker to the existing related-products editor (tabbed by type).
- Store: new `<app-cross-sell-section>` used in `product-detail.component` and the cart page.

**Config:** single `CrossSellEnabled` + `CrossSellLimit` on `StoreConfiguration`.

**Pros:** smallest diff, ships in days, no new aggregate, leverages tested code.
**Cons:** overloads one table with mixed semantics; strategy chain stays implicit; analytics/caching
deferred; harder to give each relation type its own rules later (e.g. downsell price validation).

**Effort:** ~S. **Best when:** you want cross-sell live quickly and will iterate.

---

### PLAN B — "Typed Strategy Engine" (recommended; clean seam for up/down-sell reuse)

**Idea:** Model a first-class, typed `ProductRelationship` and a real Strategy pipeline. This is the
sweet spot: it directly satisfies the brief's Clean-Architecture/Strategy-Pattern requirement and is
the shared foundation the up-sell and down-sell plans also build on.

**Domain**
- New aggregate/entity `ProductRelationship` (`Domain/Catalog/Aggregates/ProductRelationship/`):
  `StoreId, SourceProductId, TargetProductId, RelationType, SortOrder, IsEnabled`.
  (Keeps existing `RelatedProductLink` untouched for backward compat, or migrate it in — decide once.)
- `IProductRelationshipRepository` with tenant-scoped, type-filtered queries and batch loads.
- `RecommendationEligibilityPolicy` domain service (pure, unit-tested).

**Application — the Strategy pipeline**
- `ICrossSellStrategy { Task<IReadOnlyList<ProductId>> RecommendAsync(context, ct) }`.
- Implementations: `ManualCrossSellStrategy`, `FrequentlyBoughtTogetherStrategy` (wraps existing
  handler), `CategoryAffinityStrategy` (wraps existing auto scorer), `BestSellingComplementStrategy`.
- `CompositeCrossSellStrategy` composes them by `StoreConfiguration.CrossSellStrategyOrder`,
  de-duping and stopping at `take`.
- Queries: `GetProductCrossSellQuery`, `GetCartCrossSellQuery` — both just build a context and call the
  composite. Cart query aggregates by complement frequency across cart lines.

**Infrastructure**
- Table `product_relationships` with index `(store_id, source_product_id, relation_type, sort_order)`.
- Register strategies + composite in `DependencyInjection.cs`.
- Optional `IMemoryCache`-backed decorator for the per-product strategy result, invalidated by
  `ProductPriceChangedEvent` / `ProductStockChangedEvent` / relationship-changed events.

**API**
- `MerchantProductRelationshipsController`: CRUD scoped to `stores/{storeId}/products/{productId}/relationships?type=crossSell`
  with reorder + enable/disable + optional "add reverse link".
- Storefront: `GET products/{id}/cross-sell`, `GET cart/cross-sell`.

**Frontend**
- Merchant store-builder: a "Recommendations" panel (new `pages/recommendations.component.ts`) with a
  per-product relationship editor (drag-reorder, enable toggle, type tabs). Reuse product-picker.
- Store: shared `CrossSellSectionComponent` on PDP + cart, driven by a `RecommendationService`.

**Config:** `RecommendationSettings` VO (enabled, limit, exclude-out-of-stock, bilingual titles,
strategy order).

**Pros:** clean DDD seam; strategy chain explicit and testable; up/down-sell reuse the *same* engine by
passing a different `RelationType`; caching/analytics slot in as decorators.
**Cons:** more upfront work than Plan A; requires one well-designed migration.

**Effort:** ~M. **Best when:** you want cross/up/down-sell to share infrastructure (they should).

---

### PLAN C — "Extensible Recommendation Platform" (max headroom; AI-ready + analytics)

**Idea:** Everything in Plan B, plus a provider registry, first-class analytics, and an
inventory/margin-aware scoring context — a platform other features (search, chatbot, email) can reuse.

**Adds on top of Plan B**
- **Provider registry**: `IRecommendationProvider` keyed by a `RecommendationContextType`
  (`PdpCrossSell`, `CartCrossSell`, `Upsell`, `Downsell`, …). Providers are discovered via DI, so an
  `AiCrossSellProvider` (using the existing embeddings/RAG stack — see AI memory notes) registers with
  zero caller changes.
- **Scoring context object** carrying customer segment, cart, recently-viewed (`ProductView`),
  inventory, and margin — enabling personalized / margin-based strategies later.
- **Analytics**: `RecommendationImpression` / `RecommendationClick` events → an append-only
  `recommendation_events` table (partition-friendly), with a `GetCrossSellAnalyticsQuery` for merchant
  reporting (impressions, CTR, add-to-cart rate, attributed revenue).
- **Two-tier cache**: in-memory per-request + distributed (Redis-ready via `IDistributedCache`
  abstraction) for hot products, event-invalidated.
- **A/B hooks**: strategy-order can vary by experiment bucket (feature-flag friendly).
- **Batch/precompute option**: a background job precomputes FBT co-occurrence matrices nightly so the
  hot path is a lookup, not an aggregation.

**Pros:** longest runway; satisfies every "future extensibility" bullet (AI, personalization,
best-selling, rule engine) without refactoring; analytics ready for dashboards.
**Cons:** clearly over-scoped for an MVP; introduces caching/analytics infra ownership; slower to first
value. Only justified if recommendations are a strategic pillar.

**Effort:** ~L. **Best when:** recommendations are a roadmap centerpiece and you want AI/personalization next.

---

## 3. Recommendation

Start with **Plan B**. It is the smallest design that (a) honors the brief's Clean-Architecture +
Strategy-Pattern mandate, (b) gives cross/up/down-sell a *shared* typed foundation, and (c) leaves
clean decorator seams to grow into Plan C (caching → analytics → AI) without refactoring. Plan A is a
valid fast-track only if you accept re-work when up/down-sell arrive; Plan C is a deliberate platform bet.

## 4. Cross-cutting checklist (all plans)
- [ ] Tenant isolation enforced in the SQL query (`store_id`), not in memory.
- [ ] Eligibility policy unit-tested (self, inactive, out-of-stock toggle, dedupe, take-limit).
- [ ] Bilingual names in every recommendation DTO.
- [ ] Section hidden when < 2 eligible results.
- [ ] Not rendered on checkout / post-purchase.
- [ ] Index on the relationship table verified with `EXPLAIN` on a seeded large store.
- [ ] Migration applied by the user (per project convention — Claude writes code, user runs migrations).
