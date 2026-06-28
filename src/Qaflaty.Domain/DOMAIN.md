# Qaflaty Domain Layer

This document summarizes the **domain layer** (`Qaflaty.Domain`) of the Qaflaty multi-tenant
e-commerce SaaS. The domain is pure C# with no infrastructure dependencies — it holds the
business rules. All aggregates inherit `AggregateRoot<TId>`, business operations return
`Result` / `Result<T>` (never throw for business errors), and state changes raise domain
events that are dispatched after `SaveChanges`.

> Every entity/value-object property file now carries an inline `// ...` comment explaining
> what the property is and giving an example. This doc gives the higher-level "what each
> domain does" view.

---

## Building blocks (`Common/`)

### Primitives (`Common/Primitives`)
| Type | Responsibility |
|------|----------------|
| `Entity<TId>` | Base class for entities; identity-based equality on `Id`. |
| `AggregateRoot<TId>` | An entity that is a consistency boundary; buffers `DomainEvents` until dispatched. |
| `ValueObject` | Base class for value objects; structural equality via `GetEqualityComponents()`. |
| `DomainEvent` / `IDomainEvent` | Base record for domain events; carries `EventId` + `OccurredAt`. |

### Strongly-typed identifiers (`Common/Identifiers`)
Each aggregate has a dedicated `readonly record struct` ID wrapping a single `Guid Value`
(e.g. `ProductId`, `OrderId`, `StoreId`, `CartId`, `ChatConversationId`). They expose
`New()` and `Empty`. They are mechanical wrappers (no business data), so they are documented
here rather than annotated individually. Geographic/reference IDs (`Country`, `City`,
`District`, `PaymentMethodDefinition`) use plain `int` keys from seeded data.

### Shared value objects (`Common/ValueObjects`)
| Type | What it represents |
|------|--------------------|
| `Money` | Non-negative `Amount` + `Currency`; safe arithmetic, rejects cross-currency math. |
| `Currency` | Enum: `SAR` (default), `USD`, `EUR`. |
| `Email` | Normalized + format-validated email address. |
| `PhoneNumber` | E.164 phone validated against an ISO country region (via libphonenumber). |

---

## Bounded contexts

The domain is split into five bounded contexts. Each owns its aggregates, value objects,
enums, errors, repository interfaces, and domain services.

### 1. Identity (`Identity/`)
Authentication & accounts for the two kinds of users.

| Aggregate / Entity | Purpose |
|--------------------|---------|
| **`Merchant`** (AR) | A seller account: email, password hash, name, username, phone. Owns `RefreshToken`s and `MerchantStoreAssignment`s (which stores it can access + role). |
| `MerchantStoreAssignment` | Links a merchant to a store with a `MerchantRole` (multi-store / staff support). |
| `RefreshToken` | A JWT refresh token for a merchant session (expiry + revocation). |
| **`StoreCustomer`** (AR) | A storefront shopper account: credentials, profile, saved `CustomerAddress`es, and `CustomerRefreshToken`s. |
| `CustomerRefreshToken` | Refresh token for a customer session. |
| **`LoginOtp`** (AR) | A 6-digit email login code (10-min expiry, max 5 attempts, 60s resend) for merchant or customer login. |
| **`AccessDeniedReport`** (AR) | Audit record of a request denied even after token refresh; for the admin dashboard. |

Value objects: `HashedPassword` (bcrypt hash), `PersonName` (first/last), `CustomerAddress`
(saved shopper address with geo-IDs + soft delete).
Enums: `MerchantRole` (Owner/Admin/Manager/Staff), `MerchantPermission`, `LoginOtpPurpose`.

### 2. Catalog (`Catalog/`)
Stores, products, categories, store configuration, content pages, promotions, geo/payment
reference data.

| Aggregate / Entity | Purpose |
|--------------------|---------|
| **`Store`** (AR) | A tenant storefront: slug/custom-domain routing, name, branding, status, default delivery settings. |
| **`Product`** (AR) | A sellable item: pricing, inventory, status, images, variants (`VariantOption` axes + `ProductVariant` combinations), `InventoryMovement` ledger, and custom `ProductPropertyValue`s. |
| `ProductVariant` | A concrete sellable combination (e.g. "Red / M") with its own SKU/stock/price. |
| `InventoryMovement` | Append-only stock ledger entry (sale, restock, adjustment…). |
| **`ProductPropertyDefinition`** (AR) | Store-level template for a custom product attribute (e.g. "Material"). |
| `ProductPropertyValue` | A product's value for a property definition. |
| **`Category`** (AR) | Product category supporting nesting via `ParentId`. |
| **`StoreConfiguration`** (AR) | All per-store storefront settings: page/feature toggles, auth, communication, AI assistant, localization, social links, layout variants, search, tax, reviews policy, payment-method adjustments. |
| **`PageConfiguration`** (AR) | A storefront page (Home, About…) built from ordered `SectionConfiguration`s; carries SEO. |
| `SectionConfiguration` | One builder section of a page (type + variant + content/settings JSON). |
| **`FaqItem`** | A bilingual FAQ question/answer. |
| **`PromoCode`** (AR) | A discount coupon with validity window, usage limits, and discount calculation. |
| `PromoCodeRedemption` (AR) | Audit record of one redemption (enforces per-customer limits). |
| `Country` / `City` / `District` | Seeded geographic reference data (int keys). |
| **`DeliveryZone`** (AR) | Per-store delivery rule for a Country/City/District (enabled flag + optional custom fee). |
| `PaymentMethodDefinition` | Seeded catalog of available payment methods (COD, Visa…). |

Key value objects: `StoreName`/`StoreSlug`, `ProductName`/`ProductSlug`, `CategoryName`/`CategorySlug`,
`ProductPricing` (price + compare-at), `ProductInventory`, `ProductImage`, `VariantOption`,
`StoreBranding`, `DeliverySettings`, `BilingualText` (ar/en), `PageSeoSettings`, and the settings
VOs (`PageToggles`, `FeatureToggles`, `CustomerAuthSettings`, `CommunicationSettings`,
`AiAssistantSettings`, `LocalizationSettings`, `SocialLinks`, `SearchSettings`, `TaxSettings`,
`PaymentMethodAdjustment`).
Enums: `ProductStatus` (Draft/Active/Inactive), `StoreStatus`, `PageType`, `SectionType`,
`CustomerAuthMode` (GuestOnly/Required/Optional), `PromoDiscountType`, `FeeAdjustmentType`,
`ProductPropertyType`, `ProductSortOption`, `DeliveryZoneLevel`, `AssistantPersonality`, `AssistantLanguage`.

### 3. Ordering (`Ordering/`)
Customers, orders, payments, returns.

| Aggregate / Entity | Purpose |
|--------------------|---------|
| **`Order`** (AR) | The core sales aggregate. Holds line `OrderItem`s, computed `OrderPricing`, `PaymentInfo`, `DeliveryInfo`, optional `ShipmentInfo`, `OrderNotes`, tax fields, and a `StatusHistory`. Enforces the lifecycle (Pending → Confirmed → Processing → Shipped → Delivered, or Cancelled) and raises events on each transition. |
| `OrderItem` | A line item; snapshots product name + unit price at order time. |
| `OrderStatusChange` | Audit entry of one status transition. |
| `OrderOtp` | Email OTP that confirms a Pending order before it proceeds (10-min, max 5 attempts). |
| **`Customer`** (AR) | A per-store customer record (contact + address) used by Ordering, keyed by phone. |
| **`ReturnRequest`** (AR) | Customer return of a delivered order; holds returned `ReturnRequestItem`s and computed refund; merchant approves/rejects → refund. |
| `ReturnRequestItem` | One product+quantity being returned. |

Value objects: `OrderNumber` ("QAF-NNNNNN"), `OrderPricing` (subtotal/delivery/discount/tax/total),
`PaymentInfo`, `DeliveryInfo`, `Address`, `CustomerContact`, `OrderNotes`, `ShipmentInfo`.
Enums: `OrderStatus`, `PaymentStatus` (Pending/Paid/Failed/Refunded), `PaymentMethod`
(CashOnDelivery/Card/Wallet), `OrderSource` (Storefront/ChatAssistant), `ReturnStatus`.

### 4. Communication (`Communication/`)
Live chat + AI assistant.

| Aggregate / Entity | Purpose |
|--------------------|---------|
| **`ChatConversation`** (AR) | A chat thread between a store and a customer/guest; owns `ChatMessage`s, tracks unread counts and Active/Closed/Archived status. (SignalR hub at `/hubs/chat`.) |
| `ChatMessage` | A single message (sender type Customer/Merchant/Bot, content, read receipt). |
| **`AiInteractionLog`** (AR) | Append-only analytics record of one AI assistant interaction (reply/suggestion/cart-add/order), powering the AI dashboard and knowledge-gap detection. |

Enums: `ConversationStatus`, `MessageSenderType`, `AiInteractionType`.

### 5. Storefront (`Storefront/`)
Cross-cutting storefront shopping behaviors.

| Aggregate / Entity | Purpose |
|--------------------|---------|
| **`Cart`** (AR) | A shopping cart. Supports **cart duality**: authenticated (`CustomerId`) or guest (`GuestId`). Owns `CartItem`s and can merge a guest cart on login. |
| `CartItem` | A product (+ optional variant) and quantity in the cart. |
| **`Wishlist`** (AR) | A customer's saved products; owns `WishlistItem`s. |
| `WishlistItem` | A saved product (+ optional variant). |
| **`ProductReview`** (AR) | A 1–5 star rating with optional title/comment + media; moderation status; verified-purchase flag. |
| `ProductReviewMedia` | An image/video attached to a review. |
| **`ProductView`** (AR) | Append-only product-view record powering most-viewed/recently-viewed recommendations. |
| `RelatedProductLink` | Merchant-curated "related product" link (manual recommendation mode). |

Enums: `ReviewStatus` (Pending/Approved/Rejected/Hidden), `ReviewMediaType` (Image/Video).

---

## Cross-cutting patterns

- **Result pattern** — every business operation returns `Result`/`Result<T>`; errors are static
  `Error` instances in each context's `Errors/` folder.
- **Factory methods** — aggregates are created via static `Create(...)` returning a `Result<T>`;
  constructors are private (with a parameterless one for EF Core).
- **Encapsulated collections** — child collections are private `List<>` exposed as
  `IReadOnlyList<>`; mutated only through aggregate methods.
- **Snapshots** — `OrderItem`/`ReturnRequestItem` capture product name + price at the time of the
  action so later catalog edits don't rewrite history.
- **Domain events** — raised inside aggregate methods (e.g. `OrderConfirmedEvent`,
  `ProductPriceChangedEvent`, `VariantStockLowEvent`) and dispatched post-save by an interceptor.
- **Multi-tenancy** — almost every aggregate carries a `StoreId`; the storefront resolves the
  tenant from request headers.

### Domain events by context
- **Identity:** `MerchantRegisteredEvent`, `PasswordChangedEvent`, `StoreCustomerRegisteredEvent`, `CustomerPasswordChangedEvent`.
- **Catalog:** `StoreCreatedEvent`, `StoreUpdatedEvent`, `ProductCreatedEvent`, `ProductPriceChangedEvent`, `ProductStockChangedEvent`, `VariantStockLowEvent`, `StoreConfigurationCreatedEvent`.
- **Ordering:** `OrderPlacedEvent`, `OrderConfirmedEvent`, `OrderShippedEvent`, `OrderDeliveredEvent`, `OrderCancelledEvent`, `PaymentProcessedEvent`.

(Events are immutable records with positional parameters carrying the changed data, so they are
described here rather than annotated inline.)
