# Qaflaty Backend - Domain-Driven Design Architecture

## Table of Contents
1. [Strategic Design Overview](#strategic-design-overview)
2. [Bounded Contexts](#bounded-contexts)
3. [Context Map](#context-map)
4. [Tactical Design](#tactical-design)
5. [Project Structure](#project-structure)
6. [Layer Architecture](#layer-architecture)
7. [Aggregate Details](#aggregate-details)
8. [Domain Events](#domain-events)
9. [CQRS Pattern](#cqrs-pattern)

---

## Strategic Design Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              QAFLATY DOMAIN                                      │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │                 │  │                 │  │                 │                 │
│  │    IDENTITY     │  │     CATALOG     │  │     ORDERING    │                 │
│  │    CONTEXT      │  │     CONTEXT     │  │     CONTEXT     │                 │
│  │                 │  │                 │  │                 │                 │
│  │  • Merchants    │  │  • Stores       │  │  • Orders       │                 │
│  │  • Auth/Tokens  │  │  • Products     │  │  • Customers    │                 │
│  │                 │  │  • Categories   │  │  • Payments     │                 │
│  │                 │  │                 │  │                 │                 │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                 │
│           │                    │                    │                          │
│           └────────────────────┼────────────────────┘                          │
│                                │                                                │
│                    ┌───────────▼───────────┐                                   │
│                    │                       │                                   │
│                    │    SHARED KERNEL      │                                   │
│                    │                       │                                   │
│                    │  • Base Entities      │                                   │
│                    │  • Value Objects      │                                   │
│                    │  • Domain Events      │                                   │
│                    │  • Specifications     │                                   │
│                    │                       │                                   │
│                    └───────────────────────┘                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Bounded Contexts

### 1. Identity Context (Authentication & Authorization)

```
┌─────────────────────────────────────────────────────────────────┐
│                      IDENTITY CONTEXT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AGGREGATES                                                      │
│  ┌─────────────────────────────────────────────┐                │
│  │              MERCHANT (Root)                 │                │
│  │  ┌─────────────────────────────────────┐    │                │
│  │  │ - Id: MerchantId                    │    │                │
│  │  │ - Email: Email (VO)                 │    │                │
│  │  │ - PasswordHash: HashedPassword (VO) │    │                │
│  │  │ - FullName: PersonName (VO)         │    │                │
│  │  │ - Phone: PhoneNumber (VO)           │    │                │
│  │  │ - IsVerified: bool                  │    │                │
│  │  │ - CreatedAt: DateTime               │    │                │
│  │  └─────────────────────────────────────┘    │                │
│  │                     │                        │                │
│  │                     ▼                        │                │
│  │  ┌─────────────────────────────────────┐    │                │
│  │  │         REFRESH TOKEN (Entity)       │    │                │
│  │  │ - Id: RefreshTokenId                │    │                │
│  │  │ - Token: string                     │    │                │
│  │  │ - ExpiresAt: DateTime               │    │                │
│  │  │ - RevokedAt: DateTime?              │    │                │
│  │  └─────────────────────────────────────┘    │                │
│  └─────────────────────────────────────────────┘                │
│                                                                  │
│  VALUE OBJECTS                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │    Email     │ │  PersonName  │ │ PhoneNumber  │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│  ┌──────────────┐ ┌──────────────┐                              │
│  │HashedPassword│ │   JwtToken   │                              │
│  └──────────────┘ └──────────────┘                              │
│                                                                  │
│  DOMAIN SERVICES                                                 │
│  ┌────────────────────────────────────────────┐                 │
│  │ IPasswordHasher                            │                 │
│  │ ITokenGenerator                            │                 │
│  │ IAuthenticationService                     │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  DOMAIN EVENTS                                                   │
│  • MerchantRegisteredEvent                                      │
│  • MerchantVerifiedEvent                                        │
│  • PasswordChangedEvent                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Catalog Context (Stores, Products, Categories)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CATALOG CONTEXT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AGGREGATES                                                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        STORE (Aggregate Root)                        │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │ - Id: StoreId                                                 │  │   │
│  │  │ - MerchantId: MerchantId (reference to Identity Context)      │  │   │
│  │  │ - Slug: StoreSlug (VO)                                        │  │   │
│  │  │ - CustomDomain: Domain (VO, nullable)                         │  │   │
│  │  │ - Name: StoreName (VO)                                        │  │   │
│  │  │ - Description: string                                         │  │   │
│  │  │ - Branding: StoreBranding (VO)                                │  │   │
│  │  │ - Status: StoreStatus (enum)                                  │  │   │
│  │  │ - DeliverySettings: DeliverySettings (VO)                     │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       PRODUCT (Aggregate Root)                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │ - Id: ProductId                                               │  │   │
│  │  │ - StoreId: StoreId                                            │  │   │
│  │  │ - CategoryId: CategoryId (nullable)                           │  │   │
│  │  │ - Name: ProductName (VO)                                      │  │   │
│  │  │ - Slug: ProductSlug (VO)                                      │  │   │
│  │  │ - Description: ProductDescription (VO)                        │  │   │
│  │  │ - Pricing: ProductPricing (VO)                                │  │   │
│  │  │ - Inventory: ProductInventory (VO)                            │  │   │
│  │  │ - Status: ProductStatus (enum)                                │  │   │
│  │  │ - Images: List<ProductImage> (VO)                             │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CATEGORY (Aggregate Root)                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │ - Id: CategoryId                                              │  │   │
│  │  │ - StoreId: StoreId                                            │  │   │
│  │  │ - ParentId: CategoryId (nullable)                             │  │   │
│  │  │ - Name: CategoryName (VO)                                     │  │   │
│  │  │ - Slug: CategorySlug (VO)                                     │  │   │
│  │  │ - SortOrder: int                                              │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  VALUE OBJECTS                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │ StoreSlug  │ │ StoreName  │ │ StoreBranding  │ │DeliverySettings│       │
│  └────────────┘ └────────────┘ └────────────────┘ └────────────────┘       │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │ProductSlug │ │ProductName │ │ProductPricing  │ │ProductInventory│       │
│  └────────────┘ └────────────┘ └────────────────┘ └────────────────┘       │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐                          │
│  │ProductImage│ │   Money    │ │   Quantity     │                          │
│  └────────────┘ └────────────┘ └────────────────┘                          │
│                                                                              │
│  DOMAIN SERVICES                                                             │
│  ┌────────────────────────────────────────────┐                             │
│  │ ISlugGenerator                             │                             │
│  │ ISlugUniquenessChecker                     │                             │
│  │ IInventoryService                          │                             │
│  └────────────────────────────────────────────┘                             │
│                                                                              │
│  DOMAIN EVENTS                                                               │
│  • StoreCreatedEvent                                                        │
│  • StoreUpdatedEvent                                                        │
│  • ProductCreatedEvent                                                      │
│  • ProductPriceChangedEvent                                                 │
│  • ProductStockChangedEvent                                                 │
│  • CategoryCreatedEvent                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Ordering Context (Orders, Customers, Payments)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ORDERING CONTEXT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AGGREGATES                                                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        ORDER (Aggregate Root)                        │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │ - Id: OrderId                                                 │  │   │
│  │  │ - StoreId: StoreId                                            │  │   │
│  │  │ - CustomerId: CustomerId                                      │  │   │
│  │  │ - OrderNumber: OrderNumber (VO)                               │  │   │
│  │  │ - Status: OrderStatus (enum)                                  │  │   │
│  │  │ - Items: List<OrderItem> (Entity)                             │  │   │
│  │  │ - Pricing: OrderPricing (VO)                                  │  │   │
│  │  │ - Payment: PaymentInfo (VO)                                   │  │   │
│  │  │ - Delivery: DeliveryInfo (VO)                                 │  │   │
│  │  │ - Notes: OrderNotes (VO)                                      │  │   │
│  │  │ - Timeline: List<OrderStatusChange> (Entity)                  │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                              │                                       │   │
│  │              ┌───────────────┼───────────────┐                      │   │
│  │              ▼               ▼               ▼                      │   │
│  │  ┌─────────────────┐ ┌─────────────┐ ┌──────────────────┐          │   │
│  │  │ ORDER ITEM      │ │ORDER STATUS │ │ ORDER TIMELINE   │          │   │
│  │  │ (Entity)        │ │CHANGE       │ │ ENTRY (Entity)   │          │   │
│  │  │                 │ │(Entity)     │ │                  │          │   │
│  │  │ - ProductId     │ │             │ │ - Status         │          │   │
│  │  │ - ProductName   │ │ - From      │ │ - ChangedAt      │          │   │
│  │  │ - UnitPrice     │ │ - To        │ │ - ChangedBy      │          │   │
│  │  │ - Quantity      │ │ - At        │ │ - Notes          │          │   │
│  │  │ - Total         │ │ - By        │ │                  │          │   │
│  │  └─────────────────┘ └─────────────┘ └──────────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CUSTOMER (Aggregate Root)                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │ - Id: CustomerId                                              │  │   │
│  │  │ - StoreId: StoreId                                            │  │   │
│  │  │ - Contact: CustomerContact (VO)                               │  │   │
│  │  │ - Address: Address (VO)                                       │  │   │
│  │  │ - Notes: string                                               │  │   │
│  │  │ - Stats: CustomerStats (VO) - calculated                      │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  VALUE OBJECTS                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │OrderNumber │ │OrderPricing│ │  PaymentInfo   │ │  DeliveryInfo  │       │
│  └────────────┘ └────────────┘ └────────────────┘ └────────────────┘       │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │  Address   │ │CustomerCon-│ │ CustomerStats  │ │   OrderNotes   │       │
│  │            │ │   tact     │ │                │ │                │       │
│  └────────────┘ └────────────┘ └────────────────┘ └────────────────┘       │
│                                                                              │
│  DOMAIN SERVICES                                                             │
│  ┌────────────────────────────────────────────┐                             │
│  │ IOrderNumberGenerator                      │                             │
│  │ IPaymentProcessor                          │                             │
│  │ IOrderPricingCalculator                    │                             │
│  │ IStockValidator                            │                             │
│  └────────────────────────────────────────────┘                             │
│                                                                              │
│  DOMAIN EVENTS                                                               │
│  • OrderPlacedEvent                                                         │
│  • OrderConfirmedEvent                                                      │
│  • OrderShippedEvent                                                        │
│  • OrderDeliveredEvent                                                      │
│  • OrderCancelledEvent                                                      │
│  • PaymentProcessedEvent                                                    │
│  • PaymentFailedEvent                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Context Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CONTEXT MAP                                         │
│                                                                                  │
│                                                                                  │
│     ┌─────────────────────┐                    ┌─────────────────────┐          │
│     │                     │                    │                     │          │
│     │   IDENTITY CONTEXT  │                    │   CATALOG CONTEXT   │          │
│     │                     │                    │                     │          │
│     │   [Upstream]        │                    │   [Downstream]      │          │
│     │                     │                    │                     │          │
│     └──────────┬──────────┘                    └──────────┬──────────┘          │
│                │                                          │                      │
│                │  Conformist                              │                      │
│                │  (Catalog uses MerchantId                │                      │
│                │   from Identity)                         │                      │
│                │                                          │                      │
│                ▼                                          │                      │
│     ┌──────────────────────────────────────────────────────                     │
│     │                                                                            │
│     │            SHARED KERNEL                                                   │
│     │                                                                            │
│     │  • StoreId, MerchantId, ProductId (Strongly Typed IDs)                    │
│     │  • Money Value Object                                                      │
│     │  • Base Entity, Aggregate Root                                            │
│     │  • Domain Event Base                                                       │
│     │  • Audit Info (CreatedAt, UpdatedAt)                                      │
│     │                                                                            │
│     └──────────────────────────────────────────────────────                     │
│                │                                          │                      │
│                │                                          │                      │
│                │  Customer-Supplier                       │ Customer-Supplier    │
│                │  (Ordering depends on                    │ (Ordering uses       │
│                │   Identity for auth)                     │  Product snapshots)  │
│                │                                          │                      │
│                ▼                                          ▼                      │
│     ┌─────────────────────────────────────────────────────────────────┐         │
│     │                                                                  │         │
│     │                      ORDERING CONTEXT                            │         │
│     │                                                                  │         │
│     │   [Downstream - Consumes from Identity & Catalog]               │         │
│     │                                                                  │         │
│     │   Uses Anti-Corruption Layer to:                                │         │
│     │   • Snapshot product info at order time                         │         │
│     │   • Validate stock via Catalog Context                          │         │
│     │   • Get merchant info from Identity Context                     │         │
│     │                                                                  │         │
│     └─────────────────────────────────────────────────────────────────┘         │
│                                                                                  │
│                                                                                  │
│  INTEGRATION PATTERNS:                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Identity ──[Published Language]──► Catalog                             │   │
│  │            (MerchantId used to scope stores)                            │   │
│  │                                                                          │   │
│  │  Catalog ──[Domain Events]──► Ordering                                  │   │
│  │           (ProductPriceChanged, ProductOutOfStock)                      │   │
│  │                                                                          │   │
│  │  Ordering ──[Domain Events]──► Catalog                                  │   │
│  │            (OrderPlaced → Reduce Stock)                                 │   │
│  │            (OrderCancelled → Restore Stock)                             │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tactical Design

### Value Objects Detail

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            VALUE OBJECTS                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                              MONEY                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Amount: decimal                                                │    │   │
│  │  │  Currency: Currency (enum: SAR, USD, EUR)                       │    │   │
│  │  │                                                                 │    │   │
│  │  │  Methods:                                                       │    │   │
│  │  │  + Add(Money other): Money                                      │    │   │
│  │  │  + Subtract(Money other): Money                                 │    │   │
│  │  │  + Multiply(decimal factor): Money                              │    │   │
│  │  │  + static Zero(Currency): Money                                 │    │   │
│  │  │                                                                 │    │   │
│  │  │  Validation:                                                    │    │   │
│  │  │  - Amount >= 0                                                  │    │   │
│  │  │  - Currency must match for operations                           │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           STORE SLUG                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Value: string                                                  │    │   │
│  │  │                                                                 │    │   │
│  │  │  Validation:                                                    │    │   │
│  │  │  - Length: 3-50 characters                                      │    │   │
│  │  │  - Pattern: ^[a-z][a-z0-9-]*[a-z0-9]$                          │    │   │
│  │  │  - No consecutive hyphens                                       │    │   │
│  │  │  - Not in reserved list (www, api, admin, app, etc.)           │    │   │
│  │  │                                                                 │    │   │
│  │  │  Methods:                                                       │    │   │
│  │  │  + static Create(string value): Result<StoreSlug>              │    │   │
│  │  │  + static GenerateFromName(string name): StoreSlug             │    │   │
│  │  │  + ToSubdomain(): string  // returns "{slug}.qaflaty.com"      │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         PRODUCT PRICING                                  │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Price: Money                                                   │    │   │
│  │  │  CompareAtPrice: Money? (original price for discounts)         │    │   │
│  │  │                                                                 │    │   │
│  │  │  Computed Properties:                                           │    │   │
│  │  │  + HasDiscount: bool                                            │    │   │
│  │  │  + DiscountPercentage: decimal?                                 │    │   │
│  │  │  + DiscountAmount: Money?                                       │    │   │
│  │  │                                                                 │    │   │
│  │  │  Validation:                                                    │    │   │
│  │  │  - Price > 0                                                    │    │   │
│  │  │  - CompareAtPrice > Price (if set)                             │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        PRODUCT INVENTORY                                 │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Quantity: int                                                  │    │   │
│  │  │  Sku: string?                                                   │    │   │
│  │  │  TrackInventory: bool (default true)                           │    │   │
│  │  │                                                                 │    │   │
│  │  │  Computed Properties:                                           │    │   │
│  │  │  + InStock: bool (Quantity > 0 or !TrackInventory)             │    │   │
│  │  │  + LowStock: bool (Quantity > 0 && Quantity <= 5)              │    │   │
│  │  │                                                                 │    │   │
│  │  │  Methods:                                                       │    │   │
│  │  │  + Reserve(int qty): Result<ProductInventory>                  │    │   │
│  │  │  + Restock(int qty): ProductInventory                          │    │   │
│  │  │  + CanFulfill(int qty): bool                                   │    │   │
│  │  │                                                                 │    │   │
│  │  │  Validation:                                                    │    │   │
│  │  │  - Quantity >= 0                                                │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            ADDRESS                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Street: string                                                 │    │   │
│  │  │  City: string                                                   │    │   │
│  │  │  District: string?                                              │    │   │
│  │  │  PostalCode: string?                                            │    │   │
│  │  │  Country: string (default "Saudi Arabia")                      │    │   │
│  │  │  AdditionalInfo: string?                                        │    │   │
│  │  │                                                                 │    │   │
│  │  │  Methods:                                                       │    │   │
│  │  │  + ToSingleLine(): string                                       │    │   │
│  │  │  + ToMultiLine(): string                                        │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          ORDER NUMBER                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Value: string                                                  │    │   │
│  │  │                                                                 │    │   │
│  │  │  Format: QAF-XXXXXX (where X is alphanumeric)                  │    │   │
│  │  │                                                                 │    │   │
│  │  │  Methods:                                                       │    │   │
│  │  │  + static Generate(StoreId storeId): OrderNumber               │    │   │
│  │  │  + static Parse(string value): Result<OrderNumber>             │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Strongly Typed IDs

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         STRONGLY TYPED IDs                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  All IDs are record structs wrapping Guid for type safety:                      │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  public readonly record struct MerchantId(Guid Value)                   │   │
│  │  {                                                                       │   │
│  │      public static MerchantId New() => new(Guid.NewGuid());             │   │
│  │      public static MerchantId Empty => new(Guid.Empty);                 │   │
│  │      public override string ToString() => Value.ToString();             │   │
│  │  }                                                                       │   │
│  │                                                                          │   │
│  │  // Same pattern for:                                                    │   │
│  │  • StoreId                                                               │   │
│  │  • ProductId                                                             │   │
│  │  • CategoryId                                                            │   │
│  │  • CustomerId                                                            │   │
│  │  • OrderId                                                               │   │
│  │  • OrderItemId                                                           │   │
│  │  • RefreshTokenId                                                        │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Benefits:                                                                       │
│  • Prevents mixing up IDs (can't pass ProductId where StoreId expected)        │
│  • Self-documenting code                                                        │
│  • Compile-time safety                                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DDD PROJECT STRUCTURE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Qaflaty/                                                                        │
│  │                                                                               │
│  ├── src/                                                                        │
│  │   │                                                                           │
│  │   ├── Qaflaty.Domain/                    # DOMAIN LAYER                      │
│  │   │   ├── Common/                        # Shared Kernel                     │
│  │   │   │   ├── Primitives/                                                    │
│  │   │   │   │   ├── Entity.cs                                                  │
│  │   │   │   │   ├── AggregateRoot.cs                                          │
│  │   │   │   │   ├── ValueObject.cs                                            │
│  │   │   │   │   └── DomainEvent.cs                                            │
│  │   │   │   ├── Identifiers/                                                   │
│  │   │   │   │   ├── MerchantId.cs                                             │
│  │   │   │   │   ├── StoreId.cs                                                │
│  │   │   │   │   ├── ProductId.cs                                              │
│  │   │   │   │   └── ...                                                        │
│  │   │   │   └── ValueObjects/                                                  │
│  │   │   │       ├── Money.cs                                                   │
│  │   │   │       ├── Email.cs                                                   │
│  │   │   │       └── PhoneNumber.cs                                            │
│  │   │   │                                                                       │
│  │   │   ├── Identity/                      # Identity Bounded Context          │
│  │   │   │   ├── Aggregates/                                                    │
│  │   │   │   │   └── Merchant/                                                  │
│  │   │   │   │       ├── Merchant.cs        # Aggregate Root                   │
│  │   │   │   │       ├── RefreshToken.cs    # Entity                           │
│  │   │   │   │       └── Events/                                               │
│  │   │   │   │           ├── MerchantRegisteredEvent.cs                        │
│  │   │   │   │           └── PasswordChangedEvent.cs                           │
│  │   │   │   ├── ValueObjects/                                                  │
│  │   │   │   │   ├── HashedPassword.cs                                         │
│  │   │   │   │   └── PersonName.cs                                             │
│  │   │   │   ├── Services/                                                      │
│  │   │   │   │   └── IPasswordHasher.cs                                        │
│  │   │   │   ├── Repositories/                                                  │
│  │   │   │   │   └── IMerchantRepository.cs                                    │
│  │   │   │   └── Errors/                                                        │
│  │   │   │       └── IdentityErrors.cs                                         │
│  │   │   │                                                                       │
│  │   │   ├── Catalog/                       # Catalog Bounded Context           │
│  │   │   │   ├── Aggregates/                                                    │
│  │   │   │   │   ├── Store/                                                     │
│  │   │   │   │   │   ├── Store.cs                                              │
│  │   │   │   │   │   └── Events/                                               │
│  │   │   │   │   ├── Product/                                                   │
│  │   │   │   │   │   ├── Product.cs                                            │
│  │   │   │   │   │   └── Events/                                               │
│  │   │   │   │   └── Category/                                                  │
│  │   │   │   │       └── Category.cs                                           │
│  │   │   │   ├── ValueObjects/                                                  │
│  │   │   │   │   ├── StoreSlug.cs                                              │
│  │   │   │   │   ├── StoreBranding.cs                                          │
│  │   │   │   │   ├── ProductPricing.cs                                         │
│  │   │   │   │   ├── ProductInventory.cs                                       │
│  │   │   │   │   └── ...                                                        │
│  │   │   │   ├── Services/                                                      │
│  │   │   │   │   ├── ISlugGenerator.cs                                         │
│  │   │   │   │   └── IInventoryService.cs                                      │
│  │   │   │   ├── Repositories/                                                  │
│  │   │   │   │   ├── IStoreRepository.cs                                       │
│  │   │   │   │   ├── IProductRepository.cs                                     │
│  │   │   │   │   └── ICategoryRepository.cs                                    │
│  │   │   │   └── Errors/                                                        │
│  │   │   │       └── CatalogErrors.cs                                          │
│  │   │   │                                                                       │
│  │   │   └── Ordering/                      # Ordering Bounded Context          │
│  │   │       ├── Aggregates/                                                    │
│  │   │       │   ├── Order/                                                     │
│  │   │       │   │   ├── Order.cs                                              │
│  │   │       │   │   ├── OrderItem.cs                                          │
│  │   │       │   │   ├── OrderStatusChange.cs                                  │
│  │   │       │   │   └── Events/                                               │
│  │   │       │   └── Customer/                                                  │
│  │   │       │       └── Customer.cs                                           │
│  │   │       ├── ValueObjects/                                                  │
│  │   │       │   ├── OrderNumber.cs                                            │
│  │   │       │   ├── OrderPricing.cs                                           │
│  │   │       │   ├── DeliveryInfo.cs                                           │
│  │   │       │   ├── PaymentInfo.cs                                            │
│  │   │       │   ├── Address.cs                                                │
│  │   │       │   └── CustomerContact.cs                                        │
│  │   │       ├── Enums/                                                         │
│  │   │       │   ├── OrderStatus.cs                                            │
│  │   │       │   ├── PaymentStatus.cs                                          │
│  │   │       │   └── PaymentMethod.cs                                          │
│  │   │       ├── Services/                                                      │
│  │   │       │   ├── IOrderNumberGenerator.cs                                  │
│  │   │       │   ├── IPaymentProcessor.cs                                      │
│  │   │       │   └── IOrderPricingCalculator.cs                                │
│  │   │       ├── Repositories/                                                  │
│  │   │       │   ├── IOrderRepository.cs                                       │
│  │   │       │   └── ICustomerRepository.cs                                    │
│  │   │       └── Errors/                                                        │
│  │   │           └── OrderingErrors.cs                                         │
│  │   │                                                                           │
│  │   ├── Qaflaty.Application/               # APPLICATION LAYER                │
│  │   │   ├── Common/                                                            │
│  │   │   │   ├── Interfaces/                                                    │
│  │   │   │   │   ├── IUnitOfWork.cs                                            │
│  │   │   │   │   ├── ICurrentUserService.cs                                    │
│  │   │   │   │   └── ITenantContext.cs                                         │
│  │   │   │   ├── Behaviors/                 # MediatR Pipeline Behaviors       │
│  │   │   │   │   ├── ValidationBehavior.cs                                     │
│  │   │   │   │   ├── LoggingBehavior.cs                                        │
│  │   │   │   │   └── TransactionBehavior.cs                                    │
│  │   │   │   └── Mappings/                                                      │
│  │   │   │       └── MappingProfile.cs                                         │
│  │   │   │                                                                       │
│  │   │   ├── Identity/                      # Identity Use Cases               │
│  │   │   │   ├── Commands/                                                      │
│  │   │   │   │   ├── Register/                                                  │
│  │   │   │   │   │   ├── RegisterCommand.cs                                    │
│  │   │   │   │   │   ├── RegisterCommandHandler.cs                             │
│  │   │   │   │   │   └── RegisterCommandValidator.cs                           │
│  │   │   │   │   ├── Login/                                                     │
│  │   │   │   │   ├── RefreshToken/                                             │
│  │   │   │   │   └── ChangePassword/                                           │
│  │   │   │   └── Queries/                                                       │
│  │   │   │       └── GetCurrentMerchant/                                       │
│  │   │   │                                                                       │
│  │   │   ├── Catalog/                       # Catalog Use Cases                │
│  │   │   │   ├── Stores/                                                        │
│  │   │   │   │   ├── Commands/                                                  │
│  │   │   │   │   │   ├── CreateStore/                                          │
│  │   │   │   │   │   ├── UpdateStore/                                          │
│  │   │   │   │   │   └── DeleteStore/                                          │
│  │   │   │   │   └── Queries/                                                   │
│  │   │   │   │       ├── GetStoreById/                                         │
│  │   │   │   │       ├── GetStoreBySlug/                                       │
│  │   │   │   │       └── GetMerchantStores/                                    │
│  │   │   │   ├── Products/                                                      │
│  │   │   │   │   ├── Commands/                                                  │
│  │   │   │   │   └── Queries/                                                   │
│  │   │   │   └── Categories/                                                    │
│  │   │   │       ├── Commands/                                                  │
│  │   │   │       └── Queries/                                                   │
│  │   │   │                                                                       │
│  │   │   └── Ordering/                      # Ordering Use Cases               │
│  │   │       ├── Orders/                                                        │
│  │   │       │   ├── Commands/                                                  │
│  │   │       │   │   ├── PlaceOrder/                                           │
│  │   │       │   │   ├── ConfirmOrder/                                         │
│  │   │       │   │   ├── ShipOrder/                                            │
│  │   │       │   │   └── CancelOrder/                                          │
│  │   │       │   └── Queries/                                                   │
│  │   │       │       ├── GetOrderById/                                         │
│  │   │       │       ├── GetStoreOrders/                                       │
│  │   │       │       └── TrackOrder/                                           │
│  │   │       ├── Customers/                                                     │
│  │   │       └── Payments/                                                      │
│  │   │                                                                           │
│  │   ├── Qaflaty.Infrastructure/            # INFRASTRUCTURE LAYER             │
│  │   │   ├── Persistence/                                                       │
│  │   │   │   ├── QaflatyDbContext.cs                                           │
│  │   │   │   ├── UnitOfWork.cs                                                 │
│  │   │   │   ├── Configurations/            # EF Core Configurations           │
│  │   │   │   │   ├── Identity/                                                  │
│  │   │   │   │   │   └── MerchantConfiguration.cs                              │
│  │   │   │   │   ├── Catalog/                                                   │
│  │   │   │   │   │   ├── StoreConfiguration.cs                                 │
│  │   │   │   │   │   ├── ProductConfiguration.cs                               │
│  │   │   │   │   │   └── CategoryConfiguration.cs                              │
│  │   │   │   │   └── Ordering/                                                  │
│  │   │   │   │       ├── OrderConfiguration.cs                                 │
│  │   │   │   │       └── CustomerConfiguration.cs                              │
│  │   │   │   ├── Repositories/                                                  │
│  │   │   │   │   ├── MerchantRepository.cs                                     │
│  │   │   │   │   ├── StoreRepository.cs                                        │
│  │   │   │   │   ├── ProductRepository.cs                                      │
│  │   │   │   │   ├── OrderRepository.cs                                        │
│  │   │   │   │   └── ...                                                        │
│  │   │   │   ├── Migrations/                                                    │
│  │   │   │   └── Seeders/                                                       │
│  │   │   │       └── DatabaseSeeder.cs                                         │
│  │   │   │                                                                       │
│  │   │   ├── Services/                      # External Services                │
│  │   │   │   ├── Identity/                                                      │
│  │   │   │   │   ├── PasswordHasher.cs                                         │
│  │   │   │   │   ├── JwtTokenGenerator.cs                                      │
│  │   │   │   │   └── CurrentUserService.cs                                     │
│  │   │   │   ├── Catalog/                                                       │
│  │   │   │   │   └── SlugGenerator.cs                                          │
│  │   │   │   └── Ordering/                                                      │
│  │   │   │       ├── OrderNumberGenerator.cs                                   │
│  │   │   │       └── MockPaymentProcessor.cs                                   │
│  │   │   │                                                                       │
│  │   │   ├── Caching/                                                           │
│  │   │   │   └── MemoryCacheService.cs                                         │
│  │   │   │                                                                       │
│  │   │   └── DependencyInjection.cs                                            │
│  │   │                                                                           │
│  │   └── Qaflaty.Api/                       # PRESENTATION LAYER               │
│  │       ├── Controllers/                                                       │
│  │       │   ├── Identity/                                                      │
│  │       │   │   └── AuthController.cs                                         │
│  │       │   ├── Catalog/                                                       │
│  │       │   │   ├── StoresController.cs                                       │
│  │       │   │   ├── ProductsController.cs                                     │
│  │       │   │   └── CategoriesController.cs                                   │
│  │       │   ├── Ordering/                                                      │
│  │       │   │   ├── OrdersController.cs                                       │
│  │       │   │   └── CustomersController.cs                                    │
│  │       │   └── Storefront/                # Public Storefront API            │
│  │       │       ├── StorefrontController.cs                                   │
│  │       │       └── StorefrontOrdersController.cs                             │
│  │       │                                                                       │
│  │       ├── Middleware/                                                        │
│  │       │   ├── TenantMiddleware.cs                                           │
│  │       │   ├── ExceptionMiddleware.cs                                        │
│  │       │   └── RequestLoggingMiddleware.cs                                   │
│  │       │                                                                       │
│  │       ├── Filters/                                                           │
│  │       │   └── ValidationFilter.cs                                           │
│  │       │                                                                       │
│  │       └── Program.cs                                                         │
│  │                                                                               │
│  └── tests/                                                                      │
│      ├── Qaflaty.Domain.Tests/                                                  │
│      ├── Qaflaty.Application.Tests/                                             │
│      ├── Qaflaty.Infrastructure.Tests/                                          │
│      └── Qaflaty.Api.IntegrationTests/                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          LAYER DEPENDENCIES                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                                                                                  │
│                    ┌───────────────────────────────────┐                        │
│                    │                                   │                        │
│                    │        PRESENTATION LAYER         │                        │
│                    │          (Qaflaty.Api)            │                        │
│                    │                                   │                        │
│                    │  • Controllers                    │                        │
│                    │  • Middleware                     │                        │
│                    │  • Filters                        │                        │
│                    │  • Request/Response Models        │                        │
│                    │                                   │                        │
│                    └───────────────┬───────────────────┘                        │
│                                    │                                             │
│                                    │ depends on                                  │
│                                    ▼                                             │
│                    ┌───────────────────────────────────┐                        │
│                    │                                   │                        │
│                    │       APPLICATION LAYER           │                        │
│                    │      (Qaflaty.Application)        │                        │
│                    │                                   │                        │
│                    │  • Commands (Write Operations)    │                        │
│                    │  • Queries (Read Operations)      │                        │
│                    │  • Command/Query Handlers         │                        │
│                    │  • Validators                     │                        │
│                    │  • DTOs                           │                        │
│                    │  • Application Services           │                        │
│                    │  • Interfaces for Infrastructure  │                        │
│                    │                                   │                        │
│                    └───────────────┬───────────────────┘                        │
│                                    │                                             │
│                                    │ depends on                                  │
│                                    ▼                                             │
│                    ┌───────────────────────────────────┐                        │
│                    │                                   │                        │
│                    │          DOMAIN LAYER             │                        │
│                    │        (Qaflaty.Domain)           │                        │
│                    │                                   │                        │
│                    │  • Entities                       │                        │
│                    │  • Aggregate Roots                │                        │
│                    │  • Value Objects                  │                        │
│                    │  • Domain Events                  │                        │
│                    │  • Domain Services (Interfaces)   │                        │
│                    │  • Repository Interfaces          │                        │
│                    │  • Domain Errors                  │                        │
│                    │  • Specifications                 │                        │
│                    │                                   │                        │
│                    │  *** NO EXTERNAL DEPENDENCIES *** │                        │
│                    │                                   │                        │
│                    └───────────────────────────────────┘                        │
│                                    ▲                                             │
│                                    │                                             │
│                                    │ implements                                  │
│                                    │                                             │
│                    ┌───────────────┴───────────────────┐                        │
│                    │                                   │                        │
│                    │      INFRASTRUCTURE LAYER         │                        │
│                    │    (Qaflaty.Infrastructure)       │                        │
│                    │                                   │                        │
│                    │  • DbContext (EF Core)            │                        │
│                    │  • Repository Implementations     │                        │
│                    │  • External Service Clients       │                        │
│                    │  • Caching                        │                        │
│                    │  • File Storage                   │                        │
│                    │  • Email/SMS Services             │                        │
│                    │                                   │                        │
│                    └───────────────────────────────────┘                        │
│                                                                                  │
│                                                                                  │
│  DEPENDENCY RULE:                                                               │
│  ─────────────────                                                              │
│  Dependencies point INWARD. Domain layer has NO dependencies.                  │
│  Infrastructure implements interfaces defined in Domain/Application.           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Aggregate Details

### Order Aggregate (Most Complex)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ORDER AGGREGATE                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     ORDER (Aggregate Root)                               │   │
│  │                                                                          │   │
│  │  Invariants (Business Rules):                                            │   │
│  │  ─────────────────────────────                                          │   │
│  │  1. Order must have at least one item                                   │   │
│  │  2. All items must belong to the same store                             │   │
│  │  3. Order total must equal sum of item totals + delivery fee            │   │
│  │  4. Status transitions must follow valid state machine                  │   │
│  │  5. Cannot modify items after order is confirmed                        │   │
│  │  6. Payment must be processed before shipping                           │   │
│  │                                                                          │   │
│  │  Methods (Behavior):                                                     │   │
│  │  ─────────────────────                                                   │   │
│  │  + static Create(customerId, storeId, items, delivery): Order           │   │
│  │  + AddItem(product, quantity): void                                     │   │
│  │  + RemoveItem(productId): void                                          │   │
│  │  + UpdateItemQuantity(productId, quantity): void                        │   │
│  │  + Confirm(): void                                                      │   │
│  │  + MarkAsProcessing(): void                                             │   │
│  │  + Ship(trackingInfo): void                                             │   │
│  │  + Deliver(): void                                                      │   │
│  │  + Cancel(reason): void                                                 │   │
│  │  + ProcessPayment(paymentResult): void                                  │   │
│  │  + RecalculateTotals(): void                                            │   │
│  │                                                                          │   │
│  │  Domain Events Raised:                                                   │   │
│  │  ─────────────────────                                                   │   │
│  │  • OrderPlacedEvent (on Create)                                         │   │
│  │  • OrderConfirmedEvent (on Confirm)                                     │   │
│  │  • OrderShippedEvent (on Ship)                                          │   │
│  │  • OrderDeliveredEvent (on Deliver)                                     │   │
│  │  • OrderCancelledEvent (on Cancel)                                      │   │
│  │  • PaymentProcessedEvent (on ProcessPayment)                            │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  STATE MACHINE:                                                                 │
│  ──────────────                                                                 │
│                                                                                  │
│       ┌──────────┐                                                              │
│       │          │                                                              │
│       │ PENDING  │◄─────────────────────────────────────┐                      │
│       │          │                                      │                      │
│       └────┬─────┘                                      │                      │
│            │                                            │                      │
│            │ confirm()                                  │                      │
│            ▼                                            │                      │
│       ┌──────────┐                                      │                      │
│       │          │                                      │                      │
│       │CONFIRMED │                                      │ cancel()             │
│       │          │                                      │ (from any state      │
│       └────┬─────┘                                      │  except Delivered)   │
│            │                                            │                      │
│            │ markAsProcessing()                         │                      │
│            ▼                                            │                      │
│       ┌──────────┐                                      │                      │
│       │          │                                      │                      │
│       │PROCESSING│──────────────────────────────────────┤                      │
│       │          │                                      │                      │
│       └────┬─────┘                                      │                      │
│            │                                            │                      │
│            │ ship()                                     │                      │
│            ▼                                            │                      │
│       ┌──────────┐                                      │                      │
│       │          │                                      │                      │
│       │ SHIPPED  │──────────────────────────────────────┘                      │
│       │          │                                                              │
│       └────┬─────┘                                                              │
│            │                                                                     │
│            │ deliver()                                                          │
│            ▼                                                                     │
│       ┌──────────┐         ┌──────────┐                                        │
│       │          │         │          │                                        │
│       │DELIVERED │         │CANCELLED │                                        │
│       │  (final) │         │  (final) │                                        │
│       │          │         │          │                                        │
│       └──────────┘         └──────────┘                                        │
│                                                                                  │
│                                                                                  │
│  AGGREGATE BOUNDARY:                                                            │
│  ───────────────────                                                            │
│                                                                                  │
│         ┌─────────────────────────────────────────┐                            │
│         │              ORDER                       │                            │
│         │           (Aggregate Root)               │                            │
│         │                                          │                            │
│         │  ┌──────────────┐  ┌──────────────┐     │                            │
│         │  │  OrderItem   │  │  OrderItem   │     │   Entities inside          │
│         │  │  (Entity)    │  │  (Entity)    │ ... │   aggregate boundary       │
│         │  └──────────────┘  └──────────────┘     │                            │
│         │                                          │                            │
│         │  ┌──────────────────────────────────┐   │                            │
│         │  │    OrderStatusChange (Entity)     │   │                            │
│         │  │    (Timeline of status changes)   │   │                            │
│         │  └──────────────────────────────────┘   │                            │
│         │                                          │                            │
│         └─────────────────────────────────────────┘                            │
│                     │                    │                                      │
│                     │ references         │ references                           │
│                     ▼                    ▼                                      │
│         ┌──────────────────┐  ┌──────────────────┐                             │
│         │     Customer     │  │      Store       │                             │
│         │ (separate aggr.) │  │ (separate aggr.) │                             │
│         │                  │  │                  │                             │
│         │ Referenced by    │  │ Referenced by    │                             │
│         │ CustomerId only  │  │ StoreId only     │                             │
│         └──────────────────┘  └──────────────────┘                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Domain Events

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DOMAIN EVENTS FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                                                                                  │
│    ┌─────────────┐                                                              │
│    │   Order     │                                                              │
│    │ Aggregate   │                                                              │
│    └──────┬──────┘                                                              │
│           │                                                                      │
│           │ raises                                                               │
│           ▼                                                                      │
│    ┌─────────────────────┐                                                      │
│    │  OrderPlacedEvent   │                                                      │
│    │  ─────────────────  │                                                      │
│    │  • OrderId          │                                                      │
│    │  • StoreId          │                                                      │
│    │  • CustomerId       │                                                      │
│    │  • Items[]          │                                                      │
│    │  • Total            │                                                      │
│    │  • OccurredAt       │                                                      │
│    └──────────┬──────────┘                                                      │
│               │                                                                  │
│               │ published to                                                     │
│               ▼                                                                  │
│    ┌─────────────────────────────────────────────────────────────────┐         │
│    │                     EVENT DISPATCHER                             │         │
│    │                     (MediatR INotification)                      │         │
│    └─────────────────────────────┬───────────────────────────────────┘         │
│                                  │                                              │
│               ┌──────────────────┼──────────────────┐                          │
│               │                  │                  │                          │
│               ▼                  ▼                  ▼                          │
│    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                 │
│    │  Reduce Stock   │ │ Send Customer   │ │  Send Merchant  │                 │
│    │    Handler      │ │ Notification    │ │  Notification   │                 │
│    │                 │ │    Handler      │ │    Handler      │                 │
│    │ Updates product │ │                 │ │                 │                 │
│    │ inventory in    │ │ Sends order     │ │ Notifies store  │                 │
│    │ Catalog context │ │ confirmation    │ │ owner of new    │                 │
│    │                 │ │ to customer     │ │ order           │                 │
│    └─────────────────┘ └─────────────────┘ └─────────────────┘                 │
│                                                                                  │
│                                                                                  │
│  EVENT TYPES BY CONTEXT:                                                        │
│  ───────────────────────                                                        │
│                                                                                  │
│  IDENTITY CONTEXT:                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐          │
│  │ • MerchantRegisteredEvent    → Send welcome email                │          │
│  │ • MerchantVerifiedEvent      → Enable full features              │          │
│  │ • PasswordChangedEvent       → Send security notification        │          │
│  └──────────────────────────────────────────────────────────────────┘          │
│                                                                                  │
│  CATALOG CONTEXT:                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐          │
│  │ • StoreCreatedEvent          → Initialize store settings         │          │
│  │ • ProductCreatedEvent        → Index for search                  │          │
│  │ • ProductPriceChangedEvent   → Update caches                     │          │
│  │ • ProductStockChangedEvent   → Check for low stock alerts        │          │
│  │ • ProductOutOfStockEvent     → Notify merchant                   │          │
│  └──────────────────────────────────────────────────────────────────┘          │
│                                                                                  │
│  ORDERING CONTEXT:                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐          │
│  │ • OrderPlacedEvent           → Reduce stock, send notifications  │          │
│  │ • OrderConfirmedEvent        → Update analytics                  │          │
│  │ • OrderShippedEvent          → Send tracking to customer         │          │
│  │ • OrderDeliveredEvent        → Update customer stats             │          │
│  │ • OrderCancelledEvent        → Restore stock, process refund     │          │
│  │ • PaymentProcessedEvent      → Update order, send receipt        │          │
│  │ • PaymentFailedEvent         → Notify customer, retry logic      │          │
│  └──────────────────────────────────────────────────────────────────┘          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## CQRS Pattern

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CQRS PATTERN                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                           ┌─────────────┐                                       │
│                           │   Client    │                                       │
│                           │  (Angular)  │                                       │
│                           └──────┬──────┘                                       │
│                                  │                                               │
│                    ┌─────────────┴─────────────┐                                │
│                    │                           │                                │
│               WRITE (POST/PUT/DELETE)     READ (GET)                            │
│                    │                           │                                │
│                    ▼                           ▼                                │
│           ┌────────────────┐         ┌────────────────┐                        │
│           │   Controller   │         │   Controller   │                        │
│           └───────┬────────┘         └───────┬────────┘                        │
│                   │                          │                                  │
│                   ▼                          ▼                                  │
│           ┌────────────────┐         ┌────────────────┐                        │
│           │    COMMAND     │         │     QUERY      │                        │
│           │                │         │                │                        │
│           │ PlaceOrder     │         │ GetOrderById   │                        │
│           │ Command        │         │ Query          │                        │
│           └───────┬────────┘         └───────┬────────┘                        │
│                   │                          │                                  │
│                   │ MediatR                  │ MediatR                         │
│                   ▼                          ▼                                  │
│           ┌────────────────┐         ┌────────────────┐                        │
│           │    COMMAND     │         │     QUERY      │                        │
│           │    HANDLER     │         │    HANDLER     │                        │
│           │                │         │                │                        │
│           │ • Validates    │         │ • Optimized    │                        │
│           │ • Loads agg.   │         │   for reading  │                        │
│           │ • Executes     │         │ • Can use      │                        │
│           │   business     │         │   projections  │                        │
│           │   logic        │         │ • Can bypass   │                        │
│           │ • Saves        │         │   domain model │                        │
│           │ • Publishes    │         │                │                        │
│           │   events       │         │                │                        │
│           └───────┬────────┘         └───────┬────────┘                        │
│                   │                          │                                  │
│                   ▼                          ▼                                  │
│           ┌────────────────┐         ┌────────────────┐                        │
│           │   DOMAIN       │         │   READ MODEL   │                        │
│           │   MODEL        │         │   (DTO)        │                        │
│           │                │         │                │                        │
│           │ Rich behavior  │         │ Flat, simple   │                        │
│           │ Aggregates     │         │ Optimized for  │                        │
│           │ Entities       │         │ display        │                        │
│           │ Value Objects  │         │                │                        │
│           └───────┬────────┘         └───────┬────────┘                        │
│                   │                          │                                  │
│                   ▼                          ▼                                  │
│           ┌────────────────────────────────────────────┐                       │
│           │                                            │                       │
│           │              PostgreSQL                    │                       │
│           │                                            │                       │
│           │  (Same database for MVP - can separate     │                       │
│           │   read/write stores later for scaling)     │                       │
│           │                                            │                       │
│           └────────────────────────────────────────────┘                       │
│                                                                                  │
│                                                                                  │
│  EXAMPLE COMMAND:                                                               │
│  ────────────────                                                               │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  public record PlaceOrderCommand(                                        │  │
│  │      Guid StoreId,                                                       │  │
│  │      CustomerInfo Customer,                                              │  │
│  │      List<OrderItemRequest> Items,                                       │  │
│  │      PaymentMethod PaymentMethod                                         │  │
│  │  ) : IRequest<Result<OrderDto>>;                                         │  │
│  │                                                                           │  │
│  │  public class PlaceOrderCommandHandler                                   │  │
│  │      : IRequestHandler<PlaceOrderCommand, Result<OrderDto>>              │  │
│  │  {                                                                        │  │
│  │      public async Task<Result<OrderDto>> Handle(                         │  │
│  │          PlaceOrderCommand request,                                      │  │
│  │          CancellationToken ct)                                           │  │
│  │      {                                                                    │  │
│  │          // 1. Validate products exist and have stock                   │  │
│  │          // 2. Get or create customer                                    │  │
│  │          // 3. Create Order aggregate                                    │  │
│  │          // 4. Process payment                                           │  │
│  │          // 5. Save order                                                │  │
│  │          // 6. Publish OrderPlacedEvent                                  │  │
│  │          // 7. Return DTO                                                │  │
│  │      }                                                                    │  │
│  │  }                                                                        │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│                                                                                  │
│  EXAMPLE QUERY:                                                                 │
│  ──────────────                                                                 │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  public record GetStoreOrdersQuery(                                      │  │
│  │      Guid StoreId,                                                       │  │
│  │      OrderStatus? Status,                                                │  │
│  │      int Page,                                                           │  │
│  │      int PageSize                                                        │  │
│  │  ) : IRequest<PaginatedList<OrderListDto>>;                              │  │
│  │                                                                           │  │
│  │  public class GetStoreOrdersQueryHandler                                 │  │
│  │      : IRequestHandler<GetStoreOrdersQuery, PaginatedList<OrderListDto>> │  │
│  │  {                                                                        │  │
│  │      public async Task<PaginatedList<OrderListDto>> Handle(              │  │
│  │          GetStoreOrdersQuery request,                                    │  │
│  │          CancellationToken ct)                                           │  │
│  │      {                                                                    │  │
│  │          // Direct query to database                                     │  │
│  │          // Project to DTO (no domain model needed)                      │  │
│  │          // Optimized for read performance                               │  │
│  │      }                                                                    │  │
│  │  }                                                                        │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DDD ARCHITECTURE SUMMARY                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  BOUNDED CONTEXTS (3):                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  1. Identity    - Merchants, Authentication, Authorization             │   │
│  │  2. Catalog     - Stores, Products, Categories                         │   │
│  │  3. Ordering    - Orders, Customers, Payments                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  AGGREGATES (6):                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Merchant (Identity)                                                  │   │
│  │  • Store (Catalog)                                                      │   │
│  │  • Product (Catalog)                                                    │   │
│  │  • Category (Catalog)                                                   │   │
│  │  • Order (Ordering)                                                     │   │
│  │  • Customer (Ordering)                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  VALUE OBJECTS (15+):                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Money, Email, PhoneNumber, PersonName, HashedPassword                  │   │
│  │  StoreSlug, StoreBranding, DeliverySettings                             │   │
│  │  ProductPricing, ProductInventory, ProductImage                         │   │
│  │  OrderNumber, OrderPricing, Address, PaymentInfo, DeliveryInfo          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  DOMAIN EVENTS (12+):                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  MerchantRegistered, StoreCreated, ProductCreated, ProductStockChanged  │   │
│  │  OrderPlaced, OrderConfirmed, OrderShipped, OrderDelivered              │   │
│  │  OrderCancelled, PaymentProcessed, PaymentFailed                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  KEY PATTERNS:                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • Clean Architecture (Dependency Inversion)                            │   │
│  │  • CQRS (Command Query Responsibility Segregation)                      │   │
│  │  • Repository Pattern                                                   │   │
│  │  • Unit of Work                                                         │   │
│  │  • Domain Events for cross-aggregate communication                      │   │
│  │  • Strongly Typed IDs                                                   │   │
│  │  • Result Pattern for error handling                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  TECH STACK:                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • .NET 10 / ASP.NET Core                                               │   │
│  │  • Entity Framework Core (PostgreSQL)                                   │   │
│  │  • MediatR (CQRS + Domain Events)                                       │   │
│  │  • FluentValidation                                                     │   │
│  │  • Mapster or AutoMapper                                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

