# Qafilaty Store Builder - Comprehensive Implementation Plan

## Context

Qafilaty is a multi-tenant e-commerce SaaS platform (.NET 10 + Angular 20). Merchants currently can create stores with basic branding (logo + primary color), manage products, and have a minimal storefront. The goal is to build a **full store builder system** that allows merchants to customize their storefront with toggleable pages, features, and component variants — while ensuring SEO, bilingual support (Arabic + English), responsive design, and a great customer experience.

**Approach**: Hybrid page builder — pre-built layouts with customizable/reorderable sections, not full drag-and-drop.

---

## Phase 1: Core Store Builder Foundation

### TODO List

#### 1.1 Backend - StoreConfiguration Aggregate
- [ ] Create `StoreConfigurationId` strongly-typed ID in `Domain/Common/Identifiers/`
- [ ] Create `PageToggles` value object (AboutPage, ContactPage, FaqPage, TermsPage, PrivacyPage, ShippingReturnsPage, CartPage)
- [ ] Create `FeatureToggles` value object (Wishlist, Reviews, PromoCodes, Newsletter, ProductSearch, SocialLinks, Analytics)
- [ ] Create `CustomerAuthSettings` value object (Mode: GuestOnly/Required/Optional, AllowGuestCheckout, RequireEmailVerification)
- [ ] Create `CustomerAuthMode` enum
- [ ] Create `CommunicationSettings` value object (WhatsApp, LiveChat, AiChatbot settings)
- [ ] Create `LocalizationSettings` value object (DefaultLanguage, EnableBilingual, DefaultDirection)
- [ ] Create `SocialLinks` value object (Facebook, Instagram, Twitter, TikTok, Snapchat, YouTube)
- [ ] Create `StoreConfiguration` aggregate root with all value objects
- [ ] Create `StoreConfigurationCreatedEvent` domain event
- [ ] Create `IStoreConfigurationRepository` interface
- [ ] Create `StoreConfigurationRepository` implementation
- [ ] Create `StoreConfigurationConfiguration` EF Core config (table: `store_configurations`)
- [ ] Create EF migration for `store_configurations` table

#### 1.2 Backend - PageConfiguration Aggregate
- [ ] Create `BilingualText` value object (`{ Arabic, English }` → JSONB)
- [ ] Create `PageConfigurationId` strongly-typed ID
- [ ] Create `SectionConfigurationId` strongly-typed ID
- [ ] Create `PageType` enum (Home, Products, ProductDetail, About, Contact, FAQ, Terms, Privacy, ShippingReturns, Cart, Custom)
- [ ] Create `SectionType` enum (Hero, FeaturedProducts, CategoryShowcase, FeatureHighlights, Newsletter, Banner, CustomHtml, ProductCarousel, Testimonials)
- [ ] Create `PageSeoSettings` value object (MetaTitle, MetaDescription, OgImageUrl, NoIndex, NoFollow)
- [ ] Create `SectionConfiguration` entity (SectionType, VariantId, IsEnabled, SortOrder, Content JSONB, Settings JSONB)
- [ ] Create `PageConfiguration` aggregate root with Sections list
- [ ] Create `IPageConfigurationRepository` interface
- [ ] Create `PageConfigurationRepository` implementation
- [ ] Create `PageConfigurationConfiguration` EF Core config (table: `page_configurations`)
- [ ] Create `SectionConfigurationConfiguration` EF Core config (table: `section_configurations`)
- [ ] Create EF migration for page/section tables

#### 1.3 Backend - FAQ Entity
- [ ] Create `FaqItem` entity (StoreId, Question BilingualText, Answer BilingualText, SortOrder, IsPublished)
- [ ] Create `FaqItemConfiguration` EF Core config (table: `faq_items`)
- [ ] Create EF migration for faq_items table

#### 1.4 Backend - Auto-Seeding on Store Creation
- [ ] Create `StoreCreatedEventHandler` that seeds default `StoreConfiguration`
- [ ] Create default `PageConfiguration` entries for all core pages with default sections/variants
- [ ] Define default section layout per page type (e.g., Home: Hero + FeaturedProducts + CategoryShowcase + FeatureHighlights)

#### 1.5 Backend - CQRS Commands (Application Layer)
- [ ] `CreateStoreConfigurationCommand` + Handler
- [ ] `UpdateStoreConfigurationCommand` + Handler + Validator
- [ ] `UpdatePageConfigurationCommand` + Handler + Validator
- [ ] `CreateCustomPageCommand` + Handler + Validator
- [ ] `UpdateCustomPageCommand` + Handler + Validator
- [ ] `DeleteCustomPageCommand` + Handler
- [ ] `ReorderSectionsCommand` + Handler + Validator
- [ ] `UpdateSectionConfigurationCommand` + Handler + Validator
- [ ] `CreateFaqItemCommand` + Handler + Validator
- [ ] `UpdateFaqItemCommand` + Handler + Validator
- [ ] `DeleteFaqItemCommand` + Handler
- [ ] `ReorderFaqItemsCommand` + Handler

#### 1.6 Backend - CQRS Queries (Application Layer)
- [ ] `GetStoreConfigurationQuery` + Handler
- [ ] `GetPageConfigurationsQuery` + Handler
- [ ] `GetPageConfigurationByIdQuery` + Handler
- [ ] `GetStorefrontConfigQuery` + Handler (public, combines store + config)
- [ ] `GetCustomPageQuery` + Handler (public, by slug)
- [ ] `GetFaqItemsQuery` + Handler (public)

#### 1.7 Backend - DTOs
- [ ] `StoreConfigurationDto`
- [ ] `PageConfigurationDto`
- [ ] `SectionConfigurationDto`
- [ ] `FaqItemDto`
- [ ] `StorefrontConfigDto` (public config for storefront consumption)
- [ ] `UpdateStoreConfigurationRequest`
- [ ] `UpdatePageConfigurationRequest`
- [ ] `CreateCustomPageRequest`
- [ ] `UpdateSectionRequest`
- [ ] `CreateFaqItemRequest` / `UpdateFaqItemRequest`

#### 1.8 Backend - API Endpoints
- [ ] `GET /api/stores/{storeId}/configuration` — Get store config
- [ ] `PUT /api/stores/{storeId}/configuration` — Update store config
- [ ] `GET /api/stores/{storeId}/pages` — List page configurations
- [ ] `PUT /api/stores/{storeId}/pages/{pageId}` — Update page config
- [ ] `POST /api/stores/{storeId}/pages/custom` — Create custom page
- [ ] `DELETE /api/stores/{storeId}/pages/{pageId}` — Delete custom page
- [ ] `PUT /api/stores/{storeId}/pages/{pageId}/sections` — Update/reorder sections
- [ ] `GET /api/stores/{storeId}/faq` — List FAQ items (merchant)
- [ ] `POST /api/stores/{storeId}/faq` — Create FAQ item
- [ ] `PUT /api/stores/{storeId}/faq/{id}` — Update FAQ item
- [ ] `DELETE /api/stores/{storeId}/faq/{id}` — Delete FAQ item
- [ ] `PUT /api/stores/{storeId}/faq/reorder` — Reorder FAQ items
- [ ] `GET /api/storefront/config` — Public storefront config
- [ ] `GET /api/storefront/pages/:slug` — Public custom page
- [ ] `GET /api/storefront/faq` — Public FAQ items

#### 1.9 Frontend (Store) - Services
- [ ] Create `config.service.ts` — Fetch and store storefront config as signals
- [ ] Create `feature.service.ts` — Computed signals: `isWishlistEnabled()`, `isReviewsEnabled()`, `authMode()`, `isPageEnabled(pageType)`, etc.
- [ ] Create `seo.service.ts` — Meta tags, title, OG tags management
- [ ] Create `i18n.service.ts` — Language switching, RTL/LTR toggle, `BilingualText` text selection
- [ ] Create `feature-page.guard.ts` — Route guard that redirects to 404 for disabled pages
- [ ] Create `customer-auth.guard.ts` — Route guard for account pages

#### 1.10 Frontend (Store) - Header Variants
- [ ] Create `headers/header-minimal.component.ts` — Logo left, nav center, cart/search right
- [ ] Create `headers/header-full.component.ts` — Top bar + main bar + nav bar (3 rows)
- [ ] Create `headers/header-centered.component.ts` — Logo centered, nav below
- [ ] Create `headers/header-sidebar.component.ts` — Logo + cart in header, nav in off-canvas sidebar

#### 1.11 Frontend (Store) - Hero/Banner Section Variants
- [ ] Create `sections/hero/hero-full-image.component.ts` — Full-width bg image with overlay text + CTA
- [ ] Create `sections/hero/hero-split.component.ts` — 50/50 image + text
- [ ] Create `sections/hero/hero-slider.component.ts` — Multiple auto-rotating slides
- [ ] Create `sections/hero/hero-minimal.component.ts` — Text on solid color, no image

#### 1.12 Frontend (Store) - Product Grid Variants
- [ ] Create `sections/product-grid/grid-standard.component.ts` — 2/3/4 cols
- [ ] Create `sections/product-grid/grid-large.component.ts` — 1/2/3 cols, bigger images
- [ ] Create `sections/product-grid/grid-list.component.ts` — Single column, horizontal cards
- [ ] Create `sections/product-grid/grid-compact.component.ts` — 2/4/5 cols, smaller cards

#### 1.13 Frontend (Store) - Product Card Variants
- [ ] Create `products/card-standard.component.ts` — Image, name, price, add-to-cart
- [ ] Create `products/card-minimal.component.ts` — Image + name only, price on hover
- [ ] Create `products/card-detailed.component.ts` — Image, name, price, description, rating
- [ ] Create `products/card-overlay.component.ts` — Full-bleed image, info on gradient overlay

#### 1.14 Frontend (Store) - Other Section Variants
- [ ] Create `sections/category-showcase/cats-grid.component.ts`
- [ ] Create `sections/category-showcase/cats-slider.component.ts`
- [ ] Create `sections/category-showcase/cats-icons.component.ts`
- [ ] Create `sections/feature-highlights/feat-icons.component.ts`
- [ ] Create `sections/feature-highlights/feat-cards.component.ts`
- [ ] Create `sections/newsletter/news-inline.component.ts`
- [ ] Create `sections/newsletter/news-card.component.ts`
- [ ] Create `sections/banner/banner-strip.component.ts`
- [ ] Create `sections/banner/banner-card.component.ts`
- [ ] Create `sections/product-carousel/carousel-standard.component.ts`
- [ ] Create `sections/testimonials/test-cards.component.ts`
- [ ] Create `sections/testimonials/test-slider.component.ts`
- [ ] Create `sections/custom-html/custom-html.component.ts`

#### 1.15 Frontend (Store) - Footer Variants
- [ ] Create `footers/footer-standard.component.ts` — 3-column layout
- [ ] Create `footers/footer-minimal.component.ts` — Single row
- [ ] Create `footers/footer-centered.component.ts` — Centered layout

#### 1.16 Frontend (Store) - Section Renderer
- [ ] Create `section-renderer.component.ts` — Dynamic component loader by variant ID
- [ ] Create `layout-renderer.component.ts` — Renders header + sections + footer based on page config

#### 1.17 Frontend (Store) - New Pages
- [ ] Create `pages/about/about.component.ts`
- [ ] Create `pages/contact/contact.component.ts`
- [ ] Create `pages/faq/faq.component.ts`
- [ ] Create `pages/legal/terms.component.ts`
- [ ] Create `pages/legal/privacy.component.ts`
- [ ] Create `pages/legal/shipping-returns.component.ts`
- [ ] Create `pages/custom/custom-page.component.ts`
- [ ] Create `pages/cart/cart-page.component.ts`
- [ ] Create `pages/not-found/not-found.component.ts`
- [ ] Create `pages/store-offline/store-offline.component.ts`

#### 1.18 Frontend (Store) - Route Updates
- [ ] Update `app.routes.ts` with all new routes, lazy loading, feature guards
- [ ] Add wildcard `**` route to NotFoundComponent

#### 1.19 Frontend (Store) - Bilingual / RTL Support
- [ ] Implement language switcher component
- [ ] Set `dir` and `lang` attributes on `<html>` based on selected language
- [ ] Add Tailwind `rtl:` variant styles where needed
- [ ] Create translation map for static UI text (buttons, labels, etc.)

#### 1.20 Frontend (Store) - Responsive Design
- [ ] Implement mobile hamburger menu for all header variants
- [ ] Optional bottom navigation bar component (toggleable)
- [ ] Ensure all section variants are responsive (mobile → tablet → desktop)
- [ ] Apply `NgOptimizedImage` with `srcset` for all product/hero images
- [ ] Test all breakpoints: 0, 640, 768, 1024, 1280px

#### 1.21 Frontend (Merchant) - Store Builder UI
- [ ] Create `store-builder/builder-layout.component.ts` — Main builder page
- [ ] Create `store-builder/configuration-panel.component.ts` — Feature/page toggles
- [ ] Create `store-builder/page-editor.component.ts` — Section list with reorder/toggle/variant select
- [ ] Create `store-builder/section-editor.component.ts` — Section content editing form
- [ ] Create `store-builder/custom-page-editor.component.ts` — Custom page creator/editor
- [ ] Create `store-builder/faq-manager.component.ts` — FAQ CRUD + reorder
- [ ] Create `store-builder/services/builder.service.ts` — API calls
- [ ] Add store builder routes to merchant app
- [ ] Add store builder navigation link to merchant sidebar

#### 1.22 Shared Models
- [ ] Add `StoreConfigurationDto` to shared library
- [ ] Add `PageConfigurationDto` to shared library
- [ ] Add `SectionConfigurationDto` to shared library
- [ ] Add `FaqItemDto` to shared library
- [ ] Add all request/response types to shared library

---

## Phase 2: Customer Auth + Cart + Product Variants

### TODO List

#### 2.1 Backend - Customer Auth
- [ ] Create `StoreCustomerId` strongly-typed ID
- [ ] Create `StoreCustomer` aggregate (email, phone, passwordHash, storeId, isVerified, isBlocked, addresses)
- [ ] Create `CustomerAddress` value object
- [ ] Create `IStoreCustomerRepository` interface + implementation
- [ ] Create `StoreCustomerConfiguration` EF Core config (table: `store_customers`)
- [ ] Create EF migration
- [ ] Create `RegisterStoreCustomerCommand` + Handler + Validator
- [ ] Create `LoginStoreCustomerCommand` + Handler (returns JWT with role=customer, storeId)
- [ ] Create `UpdateCustomerProfileCommand` + Handler
- [ ] Create `AddCustomerAddressCommand` + Handler
- [ ] Create `RemoveCustomerAddressCommand` + Handler
- [ ] Create `GetCustomerProfileQuery` + Handler
- [ ] Create `GetCustomerOrdersQuery` + Handler
- [ ] Add storefront auth endpoints: `POST register`, `POST login`, `POST logout`, `GET/PUT profile`
- [ ] Add customer auth middleware (separate from merchant JWT validation)

#### 2.2 Backend - Product Variants
- [ ] Create `VariantOption` value object (name: string, values: string[])
- [ ] Create `ProductVariant` entity (child of Product aggregate) with attributes JSONB, SKU, price override, quantity, allowBackorder
- [ ] Create `InventoryMovement` entity (variantId, movementType, quantity, reason, timestamp)
- [ ] Update `Product` aggregate to include `VariantOptions` list and `Variants` collection
- [ ] Update `ProductConfiguration` EF Core config for variants
- [ ] Create `InventoryMovementConfiguration` EF Core config
- [ ] Create EF migration
- [ ] Create `AddProductVariantCommand` + Handler
- [ ] Create `UpdateProductVariantCommand` + Handler
- [ ] Create `DeleteProductVariantCommand` + Handler
- [ ] Create `RecordInventoryMovementCommand` + Handler
- [ ] Create `GetProductWithVariantsQuery` + Handler
- [ ] Create `GetInventoryHistoryQuery` + Handler
- [ ] Create `LowStockAlertEvent` domain event
- [ ] Add variant management endpoints to products controller
- [ ] Update storefront product endpoints to include variant data

#### 2.3 Backend - Wishlist
- [ ] Create `Wishlist` / `WishlistItem` entities
- [ ] Create `IWishlistRepository` + implementation
- [ ] Create `AddToWishlistCommand`, `RemoveFromWishlistCommand`
- [ ] Create `GetCustomerWishlistQuery`
- [ ] Add wishlist endpoints: `GET/POST/DELETE /api/storefront/wishlist`

#### 2.4 Backend - Cart Sync
- [ ] Create `SyncCartCommand` + Handler (merge guest cart with server-side)
- [ ] Add `POST /api/storefront/cart/sync` endpoint

#### 2.5 Frontend (Store) - Account Pages
- [ ] Create `pages/account/login.component.ts`
- [ ] Create `pages/account/register.component.ts`
- [ ] Create `pages/account/profile.component.ts`
- [ ] Create `pages/account/order-history.component.ts`
- [ ] Create `pages/account/order-detail.component.ts`
- [ ] Create `pages/account/wishlist.component.ts`
- [ ] Create `pages/account/addresses.component.ts`
- [ ] Create `account.routes.ts` lazy-loaded route children
- [ ] Create `customer-auth.service.ts` (login, register, token management, signals)
- [ ] Create `wishlist.service.ts`

#### 2.6 Frontend (Store) - Variant UI
- [ ] Create variant selector component (color swatches, size buttons, dropdowns)
- [ ] Update product detail page to use variant selector
- [ ] Update cart items to show selected variant attributes
- [ ] Update checkout to include variant info in order

#### 2.7 Frontend (Merchant) - Variant Management
- [ ] Add variant management section to product form
- [ ] Create variant option editor (define options like Color, Size)
- [ ] Create variant grid/table for managing individual variant SKUs, prices, stock
- [ ] Create inventory history view
- [ ] Create low-stock alerts notification

---

## Phase 3: Communication System

### TODO List

#### 3.1 WhatsApp Integration
- [ ] Add WhatsApp config fields to `CommunicationSettings` (already in Phase 1 value object)
- [ ] Create `whatsapp-button.component.ts` — Floating WhatsApp button
- [ ] Add WhatsApp link to contact page, product detail, order confirmation
- [ ] Generate `wa.me` links with pre-filled messages

#### 3.2 Live Chat (Backend)
- [ ] Create Communication bounded context folder structure
- [ ] Create `ChatConversation` aggregate (storeId, customerId/guestSessionId, status, startedAt)
- [ ] Create `ChatMessage` entity (conversationId, senderType [Customer/Merchant/Bot], content, sentAt, readAt)
- [ ] Create `IChatRepository` + implementation
- [ ] Create EF configs + migration (tables: `chat_conversations`, `chat_messages`)
- [ ] Create `StartConversationCommand` + Handler
- [ ] Create `SendChatMessageCommand` + Handler
- [ ] Create `MarkMessagesAsReadCommand` + Handler
- [ ] Create `CloseConversationCommand` + Handler
- [ ] Create `GetConversationsQuery` (merchant) + Handler
- [ ] Create `GetConversationMessagesQuery` + Handler
- [ ] Create `GetActiveConversationQuery` (storefront) + Handler
- [ ] Set up SignalR Hub `/hubs/chat`
- [ ] Add chat API endpoints (storefront + merchant)

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
- [ ] Create `faq-manager.component.ts` — FAQ CRUD + drag reorder
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
