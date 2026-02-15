# Qafilaty Store Builder - Comprehensive Implementation Plan

## Context

Qafilaty is a multi-tenant e-commerce SaaS platform (.NET 10 + Angular 20). Merchants currently can create stores with basic branding (logo + primary color), manage products, and have a minimal storefront. The goal is to build a **full store builder system** that allows merchants to customize their storefront with toggleable pages, features, and component variants — while ensuring SEO, bilingual support (Arabic + English), responsive design, and a great customer experience.

**Approach**: Hybrid page builder — pre-built layouts with customizable/reorderable sections, not full drag-and-drop.

---

## Phase 1: Core Store Builder Foundation ✅ COMPLETE

### TODO List

#### 1.1 Backend - StoreConfiguration Aggregate ✅
- [x] Create `StoreConfigurationId` strongly-typed ID in `Domain/Common/Identifiers/`
- [x] Create `PageToggles` value object (AboutPage, ContactPage, FaqPage, TermsPage, PrivacyPage, ShippingReturnsPage, CartPage)
- [x] Create `FeatureToggles` value object (Wishlist, Reviews, PromoCodes, Newsletter, ProductSearch, SocialLinks, Analytics)
- [x] Create `CustomerAuthSettings` value object (Mode: GuestOnly/Required/Optional, AllowGuestCheckout, RequireEmailVerification)
- [x] Create `CustomerAuthMode` enum
- [x] Create `CommunicationSettings` value object (WhatsApp, LiveChat, AiChatbot settings)
- [x] Create `LocalizationSettings` value object (DefaultLanguage, EnableBilingual, DefaultDirection)
- [x] Create `SocialLinks` value object (Facebook, Instagram, Twitter, TikTok, Snapchat, YouTube)
- [x] Create `StoreConfiguration` aggregate root with all value objects
- [x] Create `StoreConfigurationCreatedEvent` domain event
- [x] Create `IStoreConfigurationRepository` interface
- [x] Create `StoreConfigurationRepository` implementation
- [x] Create `StoreConfigurationConfiguration` EF Core config (table: `store_configurations`)
- [x] Create EF migration for `store_configurations` table

#### 1.2 Backend - PageConfiguration Aggregate ✅
- [x] Create `BilingualText` value object (`{ Arabic, English }` → JSONB)
- [x] Create `PageConfigurationId` strongly-typed ID
- [x] Create `SectionConfigurationId` strongly-typed ID
- [x] Create `PageType` enum (Home, Products, ProductDetail, About, Contact, FAQ, Terms, Privacy, ShippingReturns, Cart, Custom)
- [x] Create `SectionType` enum (Hero, FeaturedProducts, CategoryShowcase, FeatureHighlights, Newsletter, Banner, CustomHtml, ProductCarousel, Testimonials)
- [x] Create `PageSeoSettings` value object (MetaTitle, MetaDescription, OgImageUrl, NoIndex, NoFollow)
- [x] Create `SectionConfiguration` entity (SectionType, VariantId, IsEnabled, SortOrder, Content JSONB, Settings JSONB)
- [x] Create `PageConfiguration` aggregate root with Sections list
- [x] Create `IPageConfigurationRepository` interface
- [x] Create `PageConfigurationRepository` implementation
- [x] Create `PageConfigurationConfiguration` EF Core config (table: `page_configurations`)
- [x] Create `SectionConfigurationConfiguration` EF Core config (table: `section_configurations`)
- [x] Create EF migration for page/section tables

#### 1.3 Backend - FAQ Entity ✅
- [x] Create `FaqItem` entity (StoreId, Question BilingualText, Answer BilingualText, SortOrder, IsPublished)
- [x] Create `FaqItemConfiguration` EF Core config (table: `faq_items`)
- [x] Create EF migration for faq_items table

#### 1.4 Backend - Auto-Seeding on Store Creation ✅
- [x] Create `StoreCreatedEventHandler` that seeds default `StoreConfiguration`
- [x] Create default `PageConfiguration` entries for all core pages with default sections/variants
- [x] Define default section layout per page type (e.g., Home: Hero + FeaturedProducts + CategoryShowcase + FeatureHighlights)

#### 1.5 Backend - CQRS Commands (Application Layer) ✅
- [x] `UpdateStoreConfigurationCommand` + Handler + Validator
- [x] `UpdatePageConfigurationCommand` + Handler + Validator
- [x] `CreateCustomPageCommand` + Handler + Validator
- [x] `DeleteCustomPageCommand` + Handler
- [x] `UpdateSectionConfigurationCommand` + Handler + Validator
- [x] `CreateFaqItemCommand` + Handler + Validator
- [x] `UpdateFaqItemCommand` + Handler + Validator
- [x] `DeleteFaqItemCommand` + Handler
- [x] `ReorderFaqItemsCommand` + Handler

#### 1.6 Backend - CQRS Queries (Application Layer) ✅
- [x] `GetStoreConfigurationQuery` + Handler
- [x] `GetPageConfigurationsQuery` + Handler
- [x] `GetPageConfigurationByIdQuery` + Handler
- [x] `GetStorefrontConfigQuery` + Handler (public, combines store + config)
- [x] `GetCustomPageQuery` + Handler (public, by slug)
- [x] `GetFaqItemsQuery` + Handler (public)

#### 1.7 Backend - DTOs ✅
- [x] `StoreConfigurationDto`
- [x] `PageConfigurationDto`
- [x] `SectionConfigurationDto`
- [x] `FaqItemDto`
- [x] `StorefrontConfigDto` (public config for storefront consumption)
- [x] `UpdateStoreConfigurationRequest`
- [x] `UpdatePageConfigurationRequest`
- [x] `CreateCustomPageRequest`
- [x] `UpdateSectionRequest`
- [x] `CreateFaqItemRequest` / `UpdateFaqItemRequest`

#### 1.8 Backend - API Endpoints ✅
- [x] `GET /api/stores/{storeId}/configuration` — Get store config
- [x] `PUT /api/stores/{storeId}/configuration` — Update store config
- [x] `GET /api/stores/{storeId}/pages` — List page configurations
- [x] `PUT /api/stores/{storeId}/pages/{pageId}` — Update page config
- [x] `POST /api/stores/{storeId}/pages/custom` — Create custom page
- [x] `DELETE /api/stores/{storeId}/pages/{pageId}` — Delete custom page
- [x] `PUT /api/stores/{storeId}/pages/{pageId}/sections` — Update/reorder sections
- [x] `GET /api/stores/{storeId}/faq` — List FAQ items (merchant)
- [x] `POST /api/stores/{storeId}/faq` — Create FAQ item
- [x] `PUT /api/stores/{storeId}/faq/{id}` — Update FAQ item
- [x] `DELETE /api/stores/{storeId}/faq/{id}` — Delete FAQ item
- [x] `PUT /api/stores/{storeId}/faq/reorder` — Reorder FAQ items
- [x] `GET /api/storefront/config` — Public storefront config
- [x] `GET /api/storefront/pages/:slug` — Public custom page
- [x] `GET /api/storefront/faq` — Public FAQ items

#### 1.9 Frontend (Store) - Services ✅
- [x] Create `config.service.ts` — Fetch and store storefront config as signals
- [x] Create `feature.service.ts` — Computed signals: `isWishlistEnabled()`, `isReviewsEnabled()`, `authMode()`, `isPageEnabled(pageType)`, etc.
- [x] Create `seo.service.ts` — Meta tags, title, OG tags management
- [x] Create `i18n.service.ts` — Language switching, RTL/LTR toggle, `BilingualText` text selection
- [x] Create `feature-page.guard.ts` — Route guard that redirects to 404 for disabled pages
- [ ] Create `customer-auth.guard.ts` — Route guard for account pages (Phase 2)

#### 1.10 Frontend (Store) - Header Variants ✅
- [x] Create `headers/header-minimal.component.ts` — Logo left, nav center, cart/search right
- [x] Create `headers/header-full.component.ts` — Top bar + main bar + nav bar (3 rows)
- [x] Create `headers/header-centered.component.ts` — Logo centered, nav below
- [x] Create `headers/header-sidebar.component.ts` — Logo + cart in header, nav in off-canvas sidebar

#### 1.11 Frontend (Store) - Hero/Banner Section Variants ✅
- [x] Create `sections/hero/hero-full-image.component.ts` — Full-width bg image with overlay text + CTA
- [x] Create `sections/hero/hero-split.component.ts` — 50/50 image + text
- [x] Create `sections/hero/hero-slider.component.ts` — Multiple auto-rotating slides
- [x] Create `sections/hero/hero-minimal.component.ts` — Text on solid color, no image

#### 1.12 Frontend (Store) - Product Grid Variants ✅
- [x] Create `sections/product-grid/grid-standard.component.ts` — 2/3/4 cols
- [x] Create `sections/product-grid/grid-large.component.ts` — 1/2/3 cols, bigger images
- [x] Create `sections/product-grid/grid-list.component.ts` — Single column, horizontal cards
- [x] Create `sections/product-grid/grid-compact.component.ts` — 2/4/5 cols, smaller cards

#### 1.13 Frontend (Store) - Product Card Variants ✅
- [x] Create `products/card-standard.component.ts` — Image, name, price, add-to-cart
- [x] Create `products/card-minimal.component.ts` — Image + name only, price on hover
- [x] Create `products/card-detailed.component.ts` — Image, name, price, description, rating
- [x] Create `products/card-overlay.component.ts` — Full-bleed image, info on gradient overlay

#### 1.14 Frontend (Store) - Other Section Variants ✅
- [x] Create `sections/category-showcase/cats-grid.component.ts`
- [x] Create `sections/category-showcase/cats-slider.component.ts`
- [x] Create `sections/category-showcase/cats-icons.component.ts`
- [x] Create `sections/feature-highlights/feat-icons.component.ts`
- [x] Create `sections/feature-highlights/feat-cards.component.ts`
- [x] Create `sections/newsletter/news-inline.component.ts`
- [x] Create `sections/newsletter/news-card.component.ts`
- [x] Create `sections/banner/banner-strip.component.ts`
- [x] Create `sections/banner/banner-card.component.ts`
- [x] Create `sections/product-carousel/carousel-standard.component.ts`
- [x] Create `sections/testimonials/test-cards.component.ts`
- [x] Create `sections/testimonials/test-slider.component.ts`
- [x] Create `sections/custom-html/custom-html.component.ts`

#### 1.15 Frontend (Store) - Footer Variants ✅
- [x] Create `footers/footer-standard.component.ts` — 3-column layout
- [x] Create `footers/footer-minimal.component.ts` — Single row
- [x] Create `footers/footer-centered.component.ts` — Centered layout

#### 1.16 Frontend (Store) - Section Renderer ✅
- [x] Create `section-renderer.component.ts` — Dynamic component loader by variant ID
- [x] Create `layout-renderer.component.ts` — Renders header + sections + footer based on page config

#### 1.17 Frontend (Store) - New Pages ✅
- [x] Create `pages/about/about.component.ts`
- [x] Create `pages/contact/contact.component.ts`
- [x] Create `pages/faq/faq.component.ts`
- [x] Create `pages/legal/terms.component.ts`
- [x] Create `pages/legal/privacy.component.ts`
- [x] Create `pages/legal/shipping-returns.component.ts`
- [x] Create `pages/custom/custom-page.component.ts`
- [x] Create `pages/cart/cart-page.component.ts`
- [x] Create `pages/not-found/not-found.component.ts`
- [x] Create `pages/store-offline/store-offline.component.ts`

#### 1.18 Frontend (Store) - Route Updates ✅
- [x] Update `app.routes.ts` with all new routes, lazy loading, feature guards
- [x] Add wildcard `**` route to NotFoundComponent

#### 1.19 Frontend (Store) - Bilingual / RTL Support ✅
- [x] Implement language switcher component
- [x] Set `dir` and `lang` attributes on `<html>` based on selected language
- [ ] Add Tailwind `rtl:` variant styles where needed (ongoing refinement)
- [x] Create translation map for static UI text (buttons, labels, etc.)

#### 1.20 Frontend (Store) - Responsive Design ✅
- [x] Implement mobile hamburger menu for all header variants
- [ ] Optional bottom navigation bar component (toggleable) (deferred)
- [x] Ensure all section variants are responsive (mobile → tablet → desktop)
- [ ] Apply `NgOptimizedImage` with `srcset` for all product/hero images (ongoing refinement)
- [ ] Test all breakpoints: 0, 640, 768, 1024, 1280px (manual testing needed)

#### 1.21 Frontend (Merchant) - Store Builder UI ✅
- [x] Create `store-builder/builder-layout.component.ts` — Main builder page
- [x] Create `store-builder/configuration-panel.component.ts` — Feature/page toggles
- [x] Create `store-builder/page-editor.component.ts` — Section list with reorder/toggle/variant select
- [x] Create `store-builder/section-editor.component.ts` — Section content editing form
- [x] Create `store-builder/layout-design-panel.component.ts` — Layout variant selection
- [x] Create `store-builder/faq-manager.component.ts` — FAQ CRUD + reorder
- [x] Create `store-builder/services/builder.service.ts` — API calls
- [x] Add store builder routes to merchant app
- [x] Add store builder navigation link to merchant sidebar

#### 1.22 Shared Models ✅
- [x] Add `StoreConfigurationDto` to shared library
- [x] Add `PageConfigurationDto` to shared library
- [x] Add `SectionConfigurationDto` to shared library
- [x] Add `FaqItemDto` to shared library
- [x] Add all request/response types to shared library

### Build Status
- ✅ .NET Backend: Builds with 0 errors, 0 warnings
- ✅ Angular Shared Library: Builds successfully
- ✅ Angular Store App: Builds successfully
- ✅ Angular Merchant App: Builds successfully
- ✅ EF Migration: `AddStoreBuilder` migration created

---

## Phase 2: Customer Auth + Cart + Product Variants ✅ COMPLETE

### TODO List

#### 2.1 Backend - Customer Auth ✅ COMPLETE
- [x] Create `StoreCustomerId` strongly-typed ID
- [x] Create `StoreCustomer` aggregate (email, phone, passwordHash, isVerified, addresses)
- [x] Create `CustomerAddress` value object
- [x] Create `CustomerRefreshToken` entity
- [x] Create `IStoreCustomerRepository` interface + implementation
- [x] Create `StoreCustomerConfiguration` EF Core config (table: `store_customers`)
- [x] Create `CustomerRefreshTokenConfiguration` EF Core config
- [x] Create EF migration `AddStoreCustomersAndAddresses`
- [x] Create `RegisterStoreCustomerCommand` + Handler + Validator
- [x] Create `LoginStoreCustomerCommand` + Handler + Validator (returns JWT with role=customer)
- [x] Create `UpdateCustomerProfileCommand` + Handler
- [x] Create `AddCustomerAddressCommand` + Handler
- [x] Create `RemoveCustomerAddressCommand` + Handler
- [x] Create `GetCurrentCustomerQuery` + Handler
- [x] Extend `ITokenService` with `GenerateCustomerAccessToken()` and `ValidateCustomerAccessToken()`
- [x] Extend `ICurrentUserService` with `CustomerId`, `IsCustomer`, `IsMerchant` properties
- [x] Add storefront auth endpoints: `POST /api/storefront/auth/register`, `POST /api/storefront/auth/login`, `GET /api/storefront/auth/me`, `PUT /api/storefront/auth/profile`
- [x] Add customer addresses endpoints: `POST /api/storefront/addresses`, `DELETE /api/storefront/addresses/{label}`
- [x] Add customer auth policy "CustomerPolicy" with role-based authorization
- [x] Migration applied to database ✅

#### 2.2 Backend - Product Variants ✅ COMPLETE
- [x] Create `VariantOption` value object (name: string, values: string[])
- [x] Create `ProductVariant` entity (child of Product aggregate) with attributes JSONB, SKU, price override, quantity, allowBackorder
- [x] Create `InventoryMovement` entity (productId, variantId, movementType, quantity, reason, timestamp)
- [x] Update `Product` aggregate to include `VariantOptions` list and `Variants` collection
- [x] Add variant management methods to Product: `AddVariantOption()`, `AddVariant()`, `UpdateVariant()`, `ReserveVariantStock()`, `AdjustVariantInventory()`
- [x] Update `ProductConfiguration` EF Core config (add variant_options JSONB column)
- [x] Create `ProductVariantConfiguration` EF Core config
- [x] Create `InventoryMovementConfiguration` EF Core config
- [x] Create EF migration `AddProductVariants`
- [x] Migration applied to database ✅
- [x] Create DTOs: `ProductVariantDto`, `VariantOptionDto`, `ProductWithVariantsDto`, `InventoryMovementDto`
- [x] Create `AddVariantOptionCommand` + Handler + Validator
- [x] Create `AddProductVariantCommand` + Handler + Validator
- [x] Create `UpdateProductVariantCommand` + Handler
- [x] Create `AdjustVariantInventoryCommand` + Handler
- [x] Create `GetProductWithVariantsQuery` + Handler
- [x] Create `GetInventoryHistoryQuery` + Handler
- [x] Create `VariantStockLowEvent` domain event
- [x] Add variant management endpoints to ProductsController
  - `GET /api/stores/{storeId}/products/{id}/variants` - Get product with variants
  - `POST /api/stores/{storeId}/products/{id}/variant-options` - Add variant option
  - `POST /api/stores/{storeId}/products/{id}/variants` - Add variant
  - `PUT /api/stores/{storeId}/products/{id}/variants/{variantId}` - Update variant
  - `POST /api/stores/{storeId}/products/{id}/variants/{variantId}/adjust-inventory` - Adjust inventory
  - `GET /api/stores/{storeId}/products/{id}/inventory-history` - Get inventory history
- [ ] Update storefront product endpoints to include variant data (Phase 2.5)
- [ ] Update `PlaceOrderCommandHandler` to support variant stock reservation (Phase 2.5)

#### 2.3 Backend - Wishlist ✅ COMPLETE
- [x] Create `WishlistId` and `CartId` identifiers
- [x] Create `Wishlist` aggregate with `WishlistItem` entity
- [x] Create `IWishlistRepository` interface + implementation
- [x] Create `WishlistConfiguration` and `WishlistItemConfiguration` EF Core configs
- [x] Create `AddToWishlistCommand` + Handler
- [x] Create `RemoveFromWishlistCommand` + Handler
- [x] Create `GetCustomerWishlistQuery` + Handler
- [x] Create `WishlistDto` and `WishlistItemDto`
- [x] Create `StorefrontWishlistController`
- [x] Add wishlist endpoints:
  - `GET /api/storefront/wishlist` - Get customer wishlist
  - `POST /api/storefront/wishlist` - Add item to wishlist
  - `DELETE /api/storefront/wishlist` - Remove item from wishlist

#### 2.4 Backend - Cart Sync ✅ COMPLETE
- [x] Create `Cart` aggregate with `CartItem` entity
- [x] Create `ICartRepository` interface + implementation
- [x] Create `CartConfiguration` and `CartItemConfiguration` EF Core configs
- [x] Create `SyncCartCommand` + Handler (merge guest cart with server-side cart)
- [x] Create `GetCustomerCartQuery` + Handler
- [x] Create `CartDto` and `CartItemDto`
- [x] Create `StorefrontCartController`
- [x] Add cart endpoints:
  - `GET /api/storefront/cart` - Get customer cart
  - `POST /api/storefront/cart/sync` - Sync guest cart on login
- [x] Migration `AddWishlistAndCart` created and applied ✅

#### 2.5 Frontend (Store) - Account Pages ✅ COMPLETE
- [x] Create `pages/account/login.component.ts`
- [x] Create `pages/account/register.component.ts`
- [x] Create `pages/account/profile.component.ts`
- [x] Create `pages/account/order-history.component.ts`
- [x] Create `pages/account/order-detail.component.ts`
- [x] Create `pages/account/wishlist.component.ts`
- [x] Create `pages/account/addresses.component.ts`
- [x] Add account routes to `app.routes.ts` with guards (customerAuthGuard, guestGuard)
- [x] Create `customer-auth.service.ts` (login, register, token management, signals, cart sync)
- [x] Create `wishlist.service.ts`
- [x] Create `customer-auth.guard.ts` (protects account routes)
- [x] Create `guest.guard.ts` (prevents auth users from login/register)
- [x] Create `customer-auth.interceptor.ts` (adds JWT token to requests)
- [x] Register interceptor in `app.config.ts`

#### 2.6 Frontend (Store) - Variant UI ✅ COMPLETE
- [x] Create variant selector component (color swatches, size buttons, dropdowns)
- [x] Update product detail page to use variant selector
- [x] Update cart items to show selected variant attributes
- [x] Update checkout to include variant info in order

#### 2.7 Frontend (Merchant) - Variant Management ✅ COMPLETE
- [x] Add variant management section to product form
- [x] Create variant option editor (define options like Color, Size)
- [x] Create variant grid/table for managing individual variant SKUs, prices, stock
- [x] Create inventory history view
- [x] Create low-stock alerts notification

### Phase 2 Progress Summary
- ✅ **Stage 1: Customer Authentication Backend** - COMPLETE (100%)
  - Domain Layer: StoreCustomer aggregate, CustomerAddress value object, CustomerRefreshToken entity
  - Infrastructure: EF configurations, repository, migration applied
  - Application Layer: All commands (Register, Login, UpdateProfile, AddAddress, RemoveAddress)
  - API Layer: StorefrontAuthController, CustomerAddressesController, JWT CustomerPolicy

- ✅ **Stage 2: Product Variants Backend** - COMPLETE (100%)
  - Domain Layer: VariantOption, ProductVariant, InventoryMovement entities ✅
  - Infrastructure: EF configurations, migration applied ✅
  - Application Layer: 4 Commands, 2 Queries, 4 DTOs ✅
  - API Layer: 6 variant management endpoints in ProductsController ✅
  - Backward compatibility: Products without variants continue working ✅

- ✅ **Stage 3: Wishlist & Cart Sync Backend** - COMPLETE (100%)
  - Domain Layer: Wishlist and Cart aggregates with item entities ✅
  - Infrastructure: EF configurations, repositories, migration applied ✅
  - Application Layer: 3 Commands, 2 Queries, 2 DTOs ✅
  - API Layer: StorefrontWishlistController + StorefrontCartController ✅
  - Cart Sync: MergeGuestCart logic for seamless login transition ✅

- ✅ **Stage 4: Frontend Customer Auth** - COMPLETE (100%)
  - Services: CustomerAuthService with cart sync, WishlistService with signal-based state ✅
  - Guards: customerAuthGuard, guestGuard ✅
  - Interceptor: customerAuthInterceptor registered in app config ✅
  - Pages: Login, Register, Profile, Addresses, Order History, Order Detail, Wishlist ✅
  - Routing: 7 account routes with proper guards ✅
  - Forms: Reactive forms with validation for all components ✅

- ✅ **Stage 5: Frontend Variants & Wishlist UI** - COMPLETE (100%)
  - Variant selector component with color swatches, size buttons, dropdowns ✅
  - Product detail page updated with variant selection ✅
  - Cart service updated to track variants (productId + variantId key) ✅
  - Cart sidebar and cart page show variant attributes ✅
  - Checkout includes variant info in order items ✅
  - Shared library DTOs extended with variant types ✅

- ✅ **Stage 6: Frontend Merchant Variant Management** - COMPLETE (100%)
  - Variant manager component added to product form ✅
  - Variant option editor (define Color, Size, etc. with values) ✅
  - Variant grid/table for managing SKUs, prices, stock ✅
  - Generate all variant combinations feature ✅
  - Inventory adjustment modal with movement types ✅
  - Inventory history component showing stock movements ✅
  - Low-stock alerts component on merchant dashboard ✅

### Build Status
- ✅ .NET Backend: Builds with 0 errors, 0 warnings
- ✅ Database: 3 migrations applied (`AddStoreCustomersAndAddresses`, `AddProductVariants`, `AddWishlistAndCart`)
- ✅ Tables Created:
  - Identity: `store_customers`, `customer_refresh_tokens`
  - Catalog: `product_variants`, `inventory_movements`
  - Storefront: `wishlists`, `wishlist_items`, `carts`, `cart_items`
- ✅ Indexes: Unique constraints on customer_id for carts/wishlists, composite indexes for efficient lookups
- ✅ Backend API Complete: Customer auth ✅ | Product variants ✅ | Wishlist ✅ | Cart sync ✅
- ✅ Frontend Customer Auth Complete: All account pages ✅ | Services ✅ | Guards ✅ | Interceptor ✅
- ✅ Frontend Variants Complete: Store variant UI ✅ | Merchant variant management ✅
- ✅ Angular Shared Library: Builds successfully
- ✅ Angular Store App: Builds successfully
- ✅ Angular Merchant App: Builds successfully
- ✅ **Phase 2 Progress: 100% Complete (6/6 stages done)**

---

## Phase 3: Communication System

### TODO List

#### 3.1 WhatsApp Integration ✅ COMPLETE
- [x] Add WhatsApp config fields to `CommunicationSettings` (already in Phase 1 value object)
- [x] Create `whatsapp-button.component.ts` — Floating WhatsApp button (4 variants: floating, inline, icon, link)
- [x] Create `whatsapp.service.ts` — Generate wa.me links with pre-filled messages
- [x] Add WhatsApp link to contact page
- [x] Add WhatsApp link to product detail page (with product inquiry context)
- [x] Add WhatsApp link to order confirmation page (with order support context)

#### 3.2 Live Chat (Backend)
- [x] Create Communication bounded context folder structure
- [x] Create `ChatConversation` aggregate (storeId, customerId/guestSessionId, status, startedAt)
- [x] Create `ChatMessage` entity (conversationId, senderType [Customer/Merchant/Bot], content, sentAt, readAt)
- [x] Create `IChatConversationRepository` + implementation
- [x] Create EF configs (ChatConversationConfiguration, ChatMessageConfiguration)
- [x] Create EF migration (tables: `chat_conversations`, `chat_messages`) ✅ Applied to database
- [x] Create DTOs (ChatMessageDto, ChatConversationDto, ConversationSummaryDto, Request DTOs)
- [x] Create `StartConversationCommand` + Handler + Validator
- [x] Create `SendChatMessageCommand` + Handler + Validator
- [x] Create `MarkMessagesAsReadCommand` + Handler + Validator
- [x] Create `CloseConversationCommand` + Handler + Validator
- [x] Create `GetConversationsQuery` (merchant) + Handler + Validator
- [x] Create `GetConversationMessagesQuery` + Handler + Validator
- [x] Create `GetActiveConversationQuery` (storefront) + Handler + Validator
- [x] Fix handlers to return Result<T> pattern (wrap responses with Result.Success()) ✅
- [x] Set up SignalR Hub `/hubs/chat` ✅
- [x] Add chat API endpoints (StorefrontChatController + MerchantChatController) ✅

#### 3.3 Live Chat (Frontend - Store)
- [ ] Create `chat-widget.component.ts` — Expandable/collapsible chat window
- [ ] Create `chat.service.ts` — SignalR connection for real-time messages
- [ ] Show "offline" message form when merchant is unavailable

#### 3.4 Live Chat (Frontend - Merchant)
- [ ] Create `features/chat/chat-list.component.ts` — Conversation list
- [ ] Create `features/chat/chat-detail.component.ts` — Message view + input
- [ ] Create `features/chat/chat.service.ts` — SignalR for merchant side
- [ ] Add chat routes + navigation to merchant dashboard
- [ ] Unread message badge/notification

#### 3.5 AI Chatbot
- [ ] Create `IAiChatService` interface in Application layer
- [ ] Create OpenAI/Claude API implementation in Infrastructure
- [ ] Auto-build knowledge base from store products, FAQ, and policies
- [ ] Integrate AI responses into chat flow (bot messages)
- [ ] Add escalation logic: AI → Live chat or WhatsApp fallback
- [ ] Add chatbot config in merchant dashboard (name, personality, toggle)

---

## Phase 4: SEO + Promo Codes + Rich Content

### TODO List

#### 4.1 Angular SSR Setup
- [ ] Add `@angular/ssr` package to store project
- [ ] Create `main.server.ts` for server-side rendering
- [ ] Create Express `server.ts` with tenant resolution from hostname
- [ ] Configure `angular.json` with server build target
- [ ] Pass store slug via `REQUEST` token to Angular app
- [ ] Test SSR renders correct meta tags for product pages

#### 4.2 SEO Service Enhancement
- [ ] Enhance `seo.service.ts` to inject JSON-LD structured data
- [ ] Create `structured-data.service.ts` — generates JSON-LD for Organization, Product, BreadcrumbList, FAQPage, WebSite
- [ ] Create `breadcrumb.component.ts`
- [ ] Ensure all pages set proper meta title, description, OG tags
- [ ] Implement canonical URL generation (custom domain priority)

#### 4.3 Sitemap & robots.txt
- [ ] Create `GET /api/storefront/sitemap.xml` endpoint (dynamic per tenant)
- [ ] Include all products, categories, enabled pages, custom pages
- [ ] Add caching (24h, invalidated on product/page changes)
- [ ] Create `GET /api/storefront/robots.txt` endpoint
- [ ] Disallow /account/, /checkout/, /cart/ in robots.txt

#### 4.4 Promo Codes (Backend)
- [ ] Create Promotions bounded context folder
- [ ] Create `PromoCode` aggregate (storeId, code, type [Percentage/Fixed/FreeDelivery], value, conditions)
- [ ] Create `PromoCodeUsage` entity (promoCodeId, orderId, customerId, discountAmount)
- [ ] Create EF configs + migration
- [ ] Create `CreatePromoCodeCommand` + Handler + Validator
- [ ] Create `UpdatePromoCodeCommand` + Handler
- [ ] Create `DeactivatePromoCodeCommand` + Handler
- [ ] Create `ValidatePromoCodeQuery` + Handler
- [ ] Create `ApplyPromoCodeCommand` + Handler (during order placement)
- [ ] Create `GetPromoCodesQuery` (merchant) + Handler
- [ ] Add merchant endpoints: CRUD for promo codes
- [ ] Add storefront endpoint: `POST /api/storefront/promo-codes/validate`

#### 4.5 Promo Codes (Frontend)
- [ ] Add promo code input field at checkout page
- [ ] Show discount line item in cart/checkout summary
- [ ] Merchant: Create promo codes management page (CRUD + usage stats)

#### 4.6 FAQ Management (Merchant)
- [x] Create `faq-manager.component.ts` — FAQ CRUD + drag reorder (done in Phase 1)
- [ ] Bilingual input (Arabic + English tabs)

#### 4.7 Custom Page Rich Editor
- [ ] Integrate ngx-editor or TipTap for rich text editing
- [ ] Create `custom-page-editor.component.ts` with bilingual tabs
- [ ] Preview mode for custom pages

---

## Phase 5: Analytics, Reviews & Advanced

### TODO List

#### 5.1 Customer Reviews (Backend)
- [ ] Create `Review` aggregate (storeId, productId, customerId, rating 1-5, title, body, isVerified, status)
- [ ] Create EF config + migration
- [ ] Create `CreateReviewCommand` + Handler (verified purchase check)
- [ ] Create `ApproveReviewCommand`, `RejectReviewCommand` + Handlers
- [ ] Create `GetProductReviewsQuery` (public) + Handler
- [ ] Create `GetStoreReviewsQuery` (merchant, with status filter) + Handler
- [ ] Add storefront endpoints: `POST /api/storefront/reviews`, `GET /api/storefront/products/{slug}/reviews`
- [ ] Add merchant endpoints: `GET reviews`, `PUT approve/reject`

#### 5.2 Customer Reviews (Frontend)
- [ ] Create `product-reviews.component.ts` — Reviews list + write review form
- [ ] Create `star-rating.component.ts` — Interactive star rating input/display
- [ ] Add average rating display to product cards
- [ ] Merchant: Review management page with approve/reject actions

#### 5.3 Analytics (Backend)
- [ ] Create `AnalyticsEvent` entity (storeId, eventType, data JSONB, sessionId, timestamp)
- [ ] Create EF config + migration
- [ ] Create `TrackAnalyticsEventCommand` + Handler
- [ ] Create `GetAnalyticsSummaryQuery` + Handler (page views, top products, conversion, revenue)
- [ ] Add `POST /api/storefront/analytics/event` endpoint
- [ ] Add merchant analytics endpoints: summary, top-products, visitors

#### 5.4 Analytics (Frontend)
- [ ] Create `analytics.service.ts` — Auto-track page views, product views, add-to-cart, checkout events
- [ ] Merchant: Analytics dashboard with charts (visitors, revenue, top products, conversion funnel)

#### 5.5 Abandoned Cart Recovery
- [ ] Track server-side carts from Phase 2 cart sync
- [ ] Identify incomplete checkouts (started but not completed within X hours)
- [ ] Create `GetAbandonedCartsQuery` for merchant dashboard
- [ ] Merchant: Abandoned carts view with customer contact info
- [ ] Future: Auto WhatsApp/email reminders

#### 5.6 Newsletter Subscribers
- [ ] Create `NewsletterSubscriber` entity (email, name, storeId, status)
- [ ] Create EF config + migration
- [ ] Create `SubscribeNewsletterCommand` + Handler
- [ ] Create `GetSubscribersQuery` (merchant) + Handler
- [ ] Add `POST /api/storefront/newsletter/subscribe` endpoint
- [ ] Merchant: Subscribers list + CSV export

---

## Post Phase 5: Future Features

- [ ] Store push notifications (Web Push API)
- [ ] Loyalty program (points per purchase)
- [ ] Multi-currency support (exchange rates + selector)
- [ ] Print invoice (PDF generation via QuestPDF)
- [ ] Bulk import/export (CSV for products, orders, customers)
- [ ] Store templates ("Fashion", "Electronics" presets)
- [ ] Product collections ("Summer Sale", "New Arrivals")
- [ ] Multiple delivery zones (fee by city/region)
- [ ] WhatsApp order notifications (Business API)
- [ ] A/B testing for sections
- [ ] Product recommendations ("Also bought")

---

## Key Architecture Decisions

1. **StoreConfiguration as separate aggregate** — keeps Store entity clean
2. **JSONB for bilingual content** — `BilingualText` value object, no translation tables
3. **Section variants via `@switch`** — each variant is a standalone Angular component
4. **Feature toggles via Angular signals** — reactive UI with computed signals
5. **Separate customer auth from merchant auth** — different JWT scope
6. **SSR for SEO** — Express server resolves tenant from hostname
7. **Default config seeded on store creation** — StoreCreatedEvent handler

## Critical Files

**Modify:**
- `src/Qaflaty.Domain/Catalog/Aggregates/Store/Store.cs`
- `src/Qaflaty.Api/Controllers/StorefrontController.cs`
- `clients/.../projects/store/src/app/app.routes.ts`
- `clients/.../projects/store/src/app/services/store.service.ts`

**Create (key new files):**
- `src/Qaflaty.Domain/Catalog/Aggregates/StoreConfiguration/StoreConfiguration.cs`
- `src/Qaflaty.Domain/Catalog/Aggregates/PageConfiguration/PageConfiguration.cs`
- `src/Qaflaty.Domain/Catalog/ValueObjects/BilingualText.cs`
- `clients/.../projects/store/src/app/services/config.service.ts`
- `clients/.../projects/store/src/app/services/feature.service.ts`
- `clients/.../projects/store/src/app/services/i18n.service.ts`
- `clients/.../projects/store/src/app/components/sections/` (all variants)
- `clients/.../projects/merchant/src/app/features/store-builder/` (builder UI)

## Verification Per Phase

1. **Phase 1**: Create store → default config seeded → toggle features in dashboard → storefront hides/shows pages → switch language → RTL/LTR works → section variants render correctly
2. **Phase 2**: Enable auth → register/login → add variants → cart with variants → checkout with saved address → inventory decrements
3. **Phase 3**: Enable WhatsApp → floating button appears → live chat works real-time → AI chatbot answers product questions
4. **Phase 4**: SSR renders meta tags → sitemap.xml lists products → promo code applies discount → custom page renders rich content
5. **Phase 5**: Submit review → merchant approves → shows on product → analytics dashboard shows page views and conversion
