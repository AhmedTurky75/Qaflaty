# Merchant App Redesign — Plan & Checklist (Phase 0)

Direction C ("Confident Console"). Presentation-layer only, incremental, non-breaking.
Scope: `clients/qaflaty-workspace/projects/merchant` only. `store` and `landing` untouched.

## Decisions (confirmed with owner)

1. **i18n → Add Transloco now.** Install `@jsverse/transloco`, wire EN/AR JSON dictionaries,
   set up `dir` switching. Extract user-facing strings to keys *as each screen is touched*
   (not a big-bang extraction). Arabic RTL is a first-class target.
2. **Nav IA → 6-item rail** (Home, Orders, Products, Customers, Stores, Settings). Everything
   else — Returns, Reviews, Promo Codes, Live Chat, Store Builder, Team, **Ads Management**,
   **Live**, Active Carts — folds under a Settings **"More"** hub. **All routes stay unchanged.**
3. **Store Builder → full re-layout** (not just re-skin). Treated as its own multi-commit
   sub-plan (P13); screen-by-screen breakdown proposed when we reach it.

## Hard constraints (recap)

- App compiles & runs after every phase; work page-by-page.
- Presentation only — no changes to API/services/DTOs/models/guards/interceptors/routes/data flow.
- Keep every feature & route. No feature deleted.
- One component = `.ts` + `.html` + `.scss` (add missing `.scss`, split every inline component).
- Tailwind only; no Material/PrimeNG. Standalone + signals + `@if/@for`.
- A11y: visible focus ring, semantic HTML, `aria-label` on icon buttons, WCAG AA, ≥44px targets.

## Baseline metrics

- ~3,370 hard-coded color-class occurrences to migrate to tokens.
- 42 components with inline templates to split (list below).
- No theme system, no dark mode, no i18n today.

---

## Screen → Component checklist

Legend: **[inline-t]** inline template · **[inline-s]** inline styles · **[+scss]** has html but no scss (add one) · **[split]** already 3 files.

### P1 Foundations (theme + i18n + fonts) — ✅ DONE
- [x] `theme.css` — `:root` + `[data-theme=…]` for all 9 palettes (Blue default, Light, Slate/dark, Grey, Purple, Amber, Green, Teal, Rose). Hex copied verbatim from Design System §02/§05, as space-separated RGB channels. → `projects/merchant/src/styles/theme.css`
- [x] IBM Plex Sans + IBM Plex Sans Arabic wired (Google Fonts `<link>` in index.html; `--font-sans` on body in styles.scss — not via shared Tailwind config, to avoid changing store/landing fonts).
- [x] `tailwind.config.js` colors read CSS vars (§05 snippet): canvas, surface(+elevated), border, text(+muted), primary(DEFAULT/hover/tint), success, warning, danger + full rail set. **Numbered `primary-50..900` scale preserved** so store/landing + un-migrated merchant classes keep working.
- [x] `ThemeService` (localStorage, sets `data-theme` on `<html>`) + `DirectionService` (en/ar → ltr/rtl, drives Transloco active lang + sets `dir`/`lang`). Both `providedIn:'root'`, initialised in `App` constructor.
- [x] Transloco installed (`@jsverse/transloco` ^8.4); HTTP loader + EN/AR dictionaries in `public/i18n/`; provided in `app.config.ts`.
- [x] Proof widget in `app.html` (temporary, token-styled) demonstrates instant theme + dir swaps. **Remove in a later phase** when the real Settings theme picker + topbar controls land.
- Note: `ng build merchant` succeeds (exit 0). Requires `ng build shared` first (pre-existing: `shared` → `dist/shared`). Soft budget **warning** only: initial bundle 524 kB vs 500 kB (+~24 kB from Transloco); non-blocking, `angular.json` left pristine.

### P2 Shell & Navigation
- [ ] `RailComponent` (new) — coloured rail, brand, 6 core items w/ line-icon + text, active `--rail-active`, user block foot. Replace emoji icons with line-icon set / tiny icon component.
- [ ] `StoreSwitcherComponent` `shared/components/store-switcher` **[inline-t]** → split; store brand colour chip; dropdown + "Create new store".
- [ ] `TopbarComponent` (new) — breadcrumb + active-store chip + notifications + user menu + mobile hamburger.
- [ ] `BreadcrumbComponent` (new) — router/route-data driven; collapse >4 levels; 2nd crumb = active store; mobile = back-chevron + current. `<nav aria-label="Breadcrumb">`.
- [ ] `BottomNavComponent` (new, mobile) — 4 items + More; slide-in drawer.
- [ ] `ShellComponent` `shared/components/shell` **[split]** — recompose to use rail/topbar/bottom-nav; wire new IA (Ads/Live/etc under More).
- [ ] Responsive: desktop rail+content, tablet rail+single-col, mobile bottom-nav+drawer.

### P3 Auth & Onboarding
- [ ] `login` `auth/login` **[split]** → tokens (credentials→OTP styling).
- [ ] `register` `auth/register` **[split]** → tokens.
- [ ] `store-select` `auth/store-select` **[inline-t]** → split + tokens.
- [ ] `access-denied` `access-denied` **[inline-t]** → split + tokens.
- [ ] `setup-guide` `setup-guide` **[+scss]** → first-run wizard (create store → add product → sell) w/ step tracker + locked-currency warning up front. Reconcile with existing setup-guide.

### P4 Dashboard
- [ ] `dashboard` `dashboard` **[+scss]** → tokens.
- [ ] `stats-card` **[inline-t]** → split + tokens.
- [ ] `sales-chart` **[inline-t]** → split + tokens.
- [ ] `recent-orders` **[inline-t]** → split + tokens.
- [ ] `quick-actions` **[inline-t]** → split + tokens.
- [ ] `top-products` **[inline-t]** → split + tokens.
- [ ] `low-stock-alerts` **[inline-t]** → split + tokens.
- [ ] `most-wishlisted` **[inline-t]** → split + tokens.

### P5 Orders (priority)
- [ ] `order-list` **[split]** → real table, status chips (New/Packing/Shipped/Delivered/Cancelled), search, status+date filters.
- [ ] `order-detail` **[split]** → items+totals, shipping, plain-language status timeline, prominent "Update status".
- [ ] `order-card` **[split]** · `order-statistics` **[split]** · `order-timeline` **[split]** → tokens.
- [ ] `status-badge` **[inline-t]** → split + tokens.

### P6 Products (core)
- [ ] `product-list` **[split]** → photo-first cards, stock+status badges, search+filters.
- [ ] `product-form` **[split]** → grouped Basic/Images/Organization/Variants, sticky save-cancel.
- [ ] `product-card` **[split]** · `image-upload` **[split]** → tokens.

### P7 Products (advanced)
- [ ] `category-management` **[split]** · `category-tree` **[split]** → tokens.
- [ ] `variant-manager` **[inline-t, 717L]** → split + tokens.
- [ ] `inventory-history` **[inline-t]** → split + tokens.
- [ ] `landing-page-panel` **[inline-t]** → split + tokens.
- [ ] `related-products` **[split]** · `cross-sell` **[split]** · `upsell` **[split]** · `downsell` **[split]** → tokens.

### P8 Stores
- [ ] `store-list` **[split]** → store cards (brand colour, address, counts, manage) + "Add store" card.
- [ ] `create-store` **[split]** → name, address/slug, currency (irreversible flagged).
- [ ] `store-details` **[split]** → tokens.
- [ ] `store-card` **[split]** · `color-picker` **[split]** · `slug-input` **[split]** → tokens.
- [ ] `team` `stores/team` **[inline-t, 530L]** → split + tokens (folds into More).

### P9 Customers
- [ ] `customer-list` **[split]** · `customer-detail` **[split]** → tokens.

### P10 Realtime & Chat (secondary, under More)
- [ ] `chat-list` **[inline-t, inline-s]** → split + tokens.
- [ ] `chat-detail` **[inline-t, inline-s, 505L]** → split + tokens.
- [ ] `active-carts` **[inline-t]** → split + tokens.
- [ ] `live` **[inline-t]** → split + tokens.

### P11 Commerce secondary (under More)
- [ ] `returns` **[split]** · `reviews` **[split]** · `promo-codes` **[split]** → tokens.

### P12 Settings + theme picker + "More" hub
- [ ] `settings-layout` **[+scss]** → tokens; add "More" section linking all secondary features (routes unchanged).
- [ ] Theme picker — 9 named palettes as live mini-previews + tick on active (no hex, no sliders); language toggle; text-size control.
- [ ] `profile-settings` **[+scss]** · `password-settings` **[+scss]** · `store-settings` **[+scss]** · `notification-preferences` **[+scss]** → tokens + scss files.

### P13 Store Builder (full re-layout — own sub-plan) + Ads
Store Builder (~7,000L, 33 components, all **[inline-t]** — incl. `section-editor` 2,705L):
- [ ] `builder-layout` · `builder-hub` · `configuration-panel` · `layout-design-panel` · `delivery-zones-panel`
      · `faq-manager` · `page-editor` · `product-properties-panel` · `rich-text-editor` **[inline-s]** · `section-editor`
- [ ] pages: `general-settings` · `layout-design` · `payment-methods` · `search-settings` · `communication`
      · `social-links` · `ai-assistant` · `pages-manager` · `page-sections` · `faq` · `delivery-zones` · `product-properties`
- Ads (layout + 7 screens, **[+scss]** — already split, need tokens):
- [ ] `ads-layout` · `ads-dashboard` · `ads-integrations` · `ads-diagnostics` · `ads-event-timeline`
      · `ads-test-center` · `ads-logs` · `ads-monitoring`

### P14 Sweep & polish
- [ ] Audit every screen: residual hard-coded colors, missing focus states, RTL bugs, <44px targets, unsplit inline components.
- [ ] Verify all 9 themes + RTL on every page.

---

## Open items / risks
- Store Builder full re-layout (P13) is the largest, highest-risk area — recommend its own review gate before starting.
- Transloco string extraction is incremental per phase; a residual English-string sweep belongs in P14.
- No data-shape changes identified; any that arise will be raised as a question before implementing.
