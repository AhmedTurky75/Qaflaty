# Store Builder Pages — Full Dynamic Page Config Plan

## Context

The store builder already has a complete backend (PageConfiguration + SectionConfiguration entities, seeded defaults, CRUD endpoints), and the store app has 20+ section components with a `SectionRendererComponent`. However:
- The store app's **Home page is hardcoded** and never reads page config
- `ConfigService.loadPages()` calls `GET /api/storefront/pages` which **doesn't exist** on the backend
- The section editor uses **wrong PascalCase variantIds** (e.g., `"FullWidthImage"`) while the renderer and seeder use kebab-case (e.g., `"hero-full-image"`) — critical mismatch bug
- No way to **add or delete sections** in the editor
- No **content/settings editing** per section type
- No **SEO field indicators** in the editor UI

---

## TODO List

### 1. Backend: Add `GET /api/storefront/pages` Endpoint
- [ ] Create `GetStorefrontPagesQuery(StoreId)` record in `src/Qaflaty.Application/Catalog/Queries/GetStorefrontPages/`
- [ ] Create handler that returns all **enabled** pages for the store (reuse `IPageConfigurationRepository.GetByStoreIdAsync`)
- [ ] Add `[HttpGet("pages")]` action in `src/Qaflety.Api/Controllers/StorefrontController.cs`

### 2. Store App: Wire Home Page to Page Config
- [ ] Update `HomeComponent` (`clients/.../store/src/app/pages/home/home.component.ts`):
  - Inject `ConfigService` + `SeoService`
  - On init: call `configService.getPageBySlug('home')`
  - If page has sections → render with `SectionRendererComponent` (replace hardcoded HTML)
  - If no sections/page not found → show graceful fallback (current hardcoded layout)
  - Apply SEO meta from `page.seoSettings` via `SeoService`
- [ ] Update `home.component.html` to use `<app-section-renderer [sections]="sections()" />` when config-driven
- [ ] Import `SectionRendererComponent` in home component imports array

### 3. Fix Section Editor VariantId Mismatch (Critical Bug)
Update `section-editor.component.ts` variantId values to match renderer kebab-case:
```
Hero:             hero-full-image, hero-split, hero-slider, hero-minimal
FeaturedProducts: grid-standard, grid-large, grid-list, grid-compact
CategoryShowcase: cats-grid, cats-slider, cats-icons
FeatureHighlights:feat-icons, feat-cards
Newsletter:       news-inline, news-card
Banner:           banner-strip, banner-card
ProductCarousel:  carousel-standard
Testimonials:     test-cards, test-slider
CustomHtml:       custom-html
```
Also fix display labels to be human-readable (e.g., `hero-full-image` → "Full Width Image").

### 4. Section Editor: Add "Add Section" Functionality
- [ ] Add an "+ Add Section" button at the bottom of the sections list
- [ ] Show a section-type picker modal (9 types: Hero, FeaturedProducts, CategoryShowcase, FeatureHighlights, Newsletter, Banner, ProductCarousel, Testimonials, CustomHtml)
- [ ] On selection, push a new `SectionConfigurationDto` with default variantId, `isEnabled: true`, next `sortOrder`
- [ ] No backend changes needed — section IDs can be `crypto.randomUUID()` for new unsaved sections; backend `UpdateSectionConfigurationCommand` already does a full replace

### 5. Section Editor: Add "Delete Section" Functionality
- [ ] Add a delete (trash) button per section row
- [ ] On click: splice section from `localSections` array

### 6. Section Editor: Per-Section Content Editing (Expand/Collapse)
- [ ] Add expand/collapse toggle per section card
- [ ] When expanded, show type-specific form fields that write to `section.contentJson` and `section.settingsJson`

**ContentJson schema per type** (stored as JSON string):

| Section Type | contentJson fields |
|---|---|
| Hero | `title`, `subtitle`, `buttonText`, `buttonLink`, `imageUrl` |
| FeaturedProducts | `title`, `subtitle` |
| CategoryShowcase | `title`, `subtitle` |
| FeatureHighlights | `title`; `features[]` → `{icon, title, description}` |
| Newsletter | `title`, `subtitle`, `placeholder`, `buttonText` |
| Banner | `title`, `subtitle`, `buttonText`, `buttonLink`, `imageUrl` |
| ProductCarousel | `title`, `subtitle` |
| Testimonials | `title`; `testimonials[]` → `{name, role, text}` |
| CustomHtml | `html` (textarea) |

**settingsJson schema per type:**

| Section Type | settingsJson fields |
|---|---|
| FeaturedProducts | `pageSize` (number, default 8) |
| ProductCarousel | `pageSize` (number, default 8) |

- [ ] Use `getContent(section)` / `setContent(section, field, value)` helper methods for JSON parse/stringify
- [ ] Bilingual text fields (title, subtitle): show EN + AR tabs or side-by-side inputs

### 7. Section Editor: SEO Field Indicators
- [ ] Add a green `SEO` badge next to the following fields:
  - Hero: `title`, `imageUrl` (alt text for images)
  - Page-level: Meta Title, Meta Description, OG Image URL
- [ ] Add a tooltip: "This field impacts search engine rankings"

### 8. Section Editor: Page-Level SEO Settings Tab
- [ ] Add a "Page SEO" tab/section in the editor (alongside or below sections list)
- [ ] Fields with SEO badge: Meta Title EN/AR, Meta Description EN/AR, OG Image URL
- [ ] Fields: noIndex (checkbox), noFollow (checkbox)
- [ ] On save, emit both sections AND updated SEO settings
- [ ] Update parent (`BuilderLayoutComponent`) to call `UpdatePageConfigurationCommand` (existing `builderService.updatePageConfig()`) for SEO + call existing `UpdateSectionConfigurationCommand` for sections

### 9. Store App: SEO Integration for All Config-Driven Pages
- [ ] The `AboutComponent`, `TermsComponent` etc. already call `configService.getPageBySlug(slug)` — verify they pass `seoSettings` to `SeoService.setPageSeo()` (check and fix if missing)

---

## Critical Files to Modify

| File | Change |
|---|---|
| `src/Qaflety.Api/Controllers/StorefrontController.cs` | Add `GET /api/storefront/pages` action |
| `src/Qaflety.Application/Catalog/Queries/GetStorefrontPages/` | New query + handler (reuse `IPageConfigurationRepository`) |
| `clients/.../store/src/app/pages/home/home.component.ts` | Inject ConfigService, fetch page config, use SectionRenderer |
| `clients/.../store/src/app/pages/home/home.component.html` | Replace hardcoded sections with `<app-section-renderer>` |
| `clients/.../merchant/src/app/features/store-builder/section-editor.component.ts` | Fix variantIds, add/delete sections, content forms, SEO indicators, SEO settings tab |

## Reusable Existing Code

- `SectionRendererComponent` — `clients/.../store/src/app/components/sections/section-renderer.component.ts` — just pass `sections` signal input
- `SeoService` — already used in `CustomPageComponent`, import same pattern
- `IPageConfigurationRepository.GetByStoreIdAsync` — reuse in new `GetStorefrontPagesQuery` handler
- `UpdatePageConfigurationCommand` — already handles SEO updates via `builderService.updatePageConfig()`
- `UpdateSectionConfigurationCommand` — already handles full section replace via `builderService.updateSections()`
- `configService.getPageBySlug(slug)` — already works in `CustomPageComponent` / `AboutComponent`

---

## Verification

1. **Start backend**: `dotnet run --project src/Qaflety.Api`
2. **Start store app**: `npm run start:store` (port 4201)
3. **Start merchant app**: `npm run start:merchant` (port 4202)
4. **Test flow**:
   - Go to store builder → Pages → "Edit Sections" on Home page
   - Verify variantId dropdown shows readable names + correct kebab-case values
   - Add a new Hero section, set content (title, subtitle, image), click Save
   - Navigate to `http://localhost:4201` → verify home page renders the configured sections dynamically
   - Check browser DevTools → `<title>` and meta description should reflect SEO settings
   - Add another FeaturedProducts section, reorder, delete one, save → verify live preview updates
   - Check `GET /api/storefront/pages` returns all enabled pages
