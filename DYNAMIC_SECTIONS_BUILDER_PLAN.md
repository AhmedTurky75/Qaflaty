# Dynamic Sections Builder — Upgrade Plan (Drag-and-Drop, New Section Types, Live Preview)

## Goal

Bring the existing section-based store builder up to the level of the EasyOrders landing-page
builder shown in the reference video: **drag-and-drop section management, per-section style
settings, a richer library of section types, a live WYSIWYG preview, templates (export/import),
a responsive preview toggle, and (later) A/B testing.**

## Guiding principle

We are **extending**, not rewriting. The current architecture is already correct:
- Each section is a self-contained Angular component keyed by `variantId` (video advice #1 "component-based, JSON-driven" — already true here).
- Sections already persist as `SectionConfiguration` rows with `ContentJson` + `SettingsJson` JSONB.
- The renderer already switches on `variantId`.

The main missing pieces are: (a) **applying** `SettingsJson`, (b) **drag-and-drop + duplicate**,
(c) **a live preview surface**, and (d) **more section types**.

---

## Current State (verified in code)

| Area | Status |
|------|--------|
| `SectionConfiguration` with `ContentJson` + `SettingsJson` (JSONB) | ✅ exists |
| `PageConfiguration.ReorderSections / AddSection / RemoveSection / ClearSections` | ✅ exists |
| `SectionType` enum (15 types) | ✅ exists |
| `ProductLanding` page type + product landing page | ✅ exists |
| Merchant editor: content forms, variant select, enable toggle, add/delete | ✅ exists |
| Merchant editor: **reorder** | ⚠️ move up/down buttons only (no DnD) |
| Merchant editor: **duplicate section** | ❌ missing |
| `SettingsJson` applied on storefront (bg/padding/radius/device visibility) | ❌ stored but never rendered |
| **Live preview** during editing | ❌ missing (form-only editor) |
| Section types: Slider, YouTube, Announcement Bar, Countdown, Rich Text, Order Form | ❌ missing |
| Templates / export-import JSON | ❌ missing |
| A/B testing | ❌ missing |

Key files:
- Domain: `src/Qaflaty.Domain/Catalog/Aggregates/PageConfiguration/{PageConfiguration,SectionConfiguration}.cs`
- Enum: `src/Qaflaty.Domain/Catalog/Enums/SectionType.cs`
- DTO: `src/Qaflaty.Application/Catalog/DTOs/PageConfigurationDto.cs`
- Merchant editor: `clients/.../merchant/src/app/features/store-builder/section-editor.component.ts`
- Storefront renderer: `clients/.../store/src/app/components/sections/section-renderer.component.ts`
- Section components: `clients/.../store/src/app/components/sections/**`

---

## Phase A — Section Style Settings (foundation) 🥇

**Why first:** every other feature (preview, new sections, DnD polish) benefits from a real
settings model. `SettingsJson` already exists on the entity/DTO but is never applied.

### A.1 Define the settings contract (shared)
- Add `SectionSettings` interface to the **shared** lib (single source of truth for merchant + store):
  ```ts
  interface SectionSettings {
    backgroundColor?: string;      // hex / css var
    backgroundImageUrl?: string;
    textColor?: string;
    paddingY?: 'none'|'sm'|'md'|'lg'|'xl';
    paddingX?: 'none'|'sm'|'md'|'lg';
    maxWidth?: 'full'|'wide'|'narrow';
    borderRadius?: 'none'|'sm'|'md'|'lg'|'2xl';
    visibility?: 'all'|'desktop'|'mobile'; // device-specific visibility
    anchorId?: string;             // for in-page CTA links
  }
  ```
- This is serialized into the existing `SettingsJson` string. **No DB migration needed.**

### A.2 Apply settings on the storefront
- Create `SectionWrapperComponent` (store) that reads `settingsJson`, maps to Tailwind classes /
  inline styles, and wraps the rendered variant:
  ```
  <app-section-wrapper [settings]="section.settingsJson">
     <!-- existing @switch variant component -->
  </app-section-wrapper>
  ```
- Refactor `section-renderer.component.ts` to wrap each `@case` in `<app-section-wrapper>`.
- Device visibility → responsive `hidden md:block` / `md:hidden` classes (real CSS, so it works
  in SSR and for SEO, not just JS).

### A.3 Settings UI in the merchant editor
- Add a **"Design" tab** to each expanded section (alongside the existing "Content" fields):
  color pickers (bg/text), padding selector, max-width, radius, device-visibility toggle.
- Writes through a new `setSettingsField()` path (the editor already has `getSettings()` /
  `setSettingsField()` helpers — extend them).

**Deliverable:** merchants can style any existing section; storefront honors it. Ship independently.

---

## Phase B — Drag-and-Drop + Duplicate 🥈

### B.1 Angular CDK DragDrop
- Add `@angular/cdk` (if not present) and `DragDropModule`.
- Replace the up/down button column in `section-editor.component.ts` with `cdkDropList` +
  `cdkDrag` handles. On `cdkDropListDropped`, reorder `localSections` and re-assign `sortOrder`.
- Keep the existing save flow (`UpdateSectionsRequest` already sends the full ordered array).

### B.2 Duplicate section
- Add a "Duplicate" button per section → deep-clone the `SectionConfigurationDto` with a new
  temporary id, inserted right below the source, `sortOrder` recomputed.
- Backend: `UpdateSectionConfigurationCommand` already replaces the whole set, so duplication is
  purely client-side until save. Confirm the command **upserts by re-creating** the section list
  (check `UpdateSectionConfigurationCommandHandler` — if it matches by id, generate new ids for
  clones so they persist as new rows).

### B.3 Collapse/expand + drag polish
- Auto-collapse other sections while dragging; show a compact drag preview (type + variant label).

**Deliverable:** reorder by dragging, duplicate in one click. No backend changes beyond verifying
the upsert semantics.

---

## Phase C — Live Preview 🥉 (the headline feature)

**Approach: side-by-side iframe preview** (best isolation, reuses the real storefront rendering,
avoids duplicating section components in the merchant app).

### C.1 Preview route in the store app
- Add a route in the **store** app, e.g. `/__preview` that:
  - Reads a `postMessage` payload (`{ sections, settings, pageType, productSlug }`) from the
    parent (merchant) window instead of fetching from the API.
  - Renders via the existing `SectionRendererComponent` + `SectionWrapperComponent` (Phase A).
- Guard it so it only accepts messages from the merchant origin.

### C.2 Preview pane in the merchant builder
- Split the builder into **left = editor, right = live iframe** (`<iframe src="{storeUrl}/__preview">`).
- On every content/settings/order change (debounced ~150ms), `postMessage` the current
  `localSections` to the iframe → instant re-render. No save required to preview.
- **Responsive toggle**: buttons for Desktop / Tablet / Mobile that set the iframe width
  (e.g. 1280 / 768 / 390) — mirrors the video's mobile-preview feature.
- **Click-to-select**: iframe posts back the clicked section id → editor scrolls to / expands that
  section (nice-to-have, second iteration).

### C.3 Fallback for local dev
- Resolve the store preview URL from store slug + env (reuse how the storefront URL is already
  derived). If cross-origin blocks iframe messaging in some setups, fall back to opening preview
  in a new tab with a "refresh to preview" button.

**Deliverable:** WYSIWYG editing — change a field, see it live on the right, switch device sizes.

---

## Phase D — New Section Types

Each new type = (1) enum value, (2) editor content form + entry in `sectionTypes`/`sectionVariants`,
(3) storefront component + `@case` in the renderer. All content lives in `ContentJson` — **no DB
migration** (enum stored as string; confirm the EF config maps `SectionType` as string, else add a
migration for the new enum values).

Priority order (matches the video's conversion focus):

| # | Section | Content model (JSON) | Notes |
|---|---------|----------------------|-------|
| D.1 | **Image Slider / Gallery** | `{ slides: [{imageUrl, link, alt}], autoplay, interval }` | Reuse existing hero-slider carousel logic |
| D.2 | **YouTube / Video** | `{ videoId, autoplay, aspectRatio }` | Lazy-load iframe (facade for perf) |
| D.3 | **Announcement Bar** | `{ text:{en,ar}, link, bg, dismissible }` | Renders at very top; can be page- or store-level |
| D.4 | **Countdown Timer** | `{ endsAt, labels:{en,ar}, expiredBehavior }` | Client-side ticking; urgency driver |
| D.5 | **Rich Text (WYSIWYG)** | `{ html:{en,ar} }` | Integrate TipTap/ngx-editor; **sanitize** on render (already flagged for CustomHtml) |
| D.6 | **Order Form (embeddable)** | `{ fields, productId, buttonText }` | For `ProductLanding` pages — inline buy box as a movable section |
| D.7 | **CTA Button (standalone)** | `{ text:{en,ar}, link, style, anchor }` | Lightweight; `anchorId` from Phase A enables "scroll to order form" |
| D.8 | **Store Benefits / Trust badges** | already exists as `Benefits` — add icon-strip variant |

**Editor scaling note:** the current editor is one giant `@switch` in a 1,100-line template.
Before adding 6 more cases, **extract each section's content form into its own child component**
(`<app-hero-form>`, `<app-slider-form>`, …) driven by a common `[(content)]` model. This keeps the
file maintainable and makes D.1–D.7 additive.

---

## Phase E — Templates & Export/Import

### E.1 Export / Import JSON
- Merchant editor: **Export** button → download `{ sections, seoSettings }` as JSON.
- **Import** button → validate against the shared DTO shape, load into `localSections` (unsaved).
- Pure client-side; reuses existing save flow to persist.

### E.2 Section presets ("blocks")
- Ship a small library of pre-filled section presets (hero + benefits + FAQ + CTA combos).
- "Add from template" in the Add-Section modal inserts a preset with sensible default content.

### E.3 Full-page templates (optional)
- A few starter page layouts (e.g. "Product Landing — Conversion", "Simple Store Home") that
  populate the whole section list.

---

## Phase F — A/B Testing (advanced, later)

Largest new surface; do last.

### F.1 Backend
- New `PageVariant` concept: a `PageConfiguration` can have alternative section sets (variant A/B)
  with a traffic split. New aggregate or a `Variant`/`Weight` field on page config + child
  section sets.
- Storefront resolves a variant per visitor (sticky by cookie/session), records impression.
- Tie into existing analytics events (see `STORE_BUILDER_PLAN.md` Phase 5.3) for
  conversions/sales per variant.

### F.2 Merchant
- Create/edit variants, set split %, dashboard comparing views / add-to-cart / orders / revenue.

**Note:** requires the analytics pipeline from the main plan's Phase 5. Sequence F after that.

---

## Suggested sequencing

```
A (settings) → B (drag/duplicate) → C (live preview) → D (new sections) → E (templates) → F (A/B)
```

A, B, D, E are each independently shippable. C (preview) is the biggest UX win and depends on A.
F depends on analytics and should follow the main plan's Phase 5.

## What needs a DB migration

- **None for A, B, C, E.** (`SettingsJson`/`ContentJson` are already JSONB strings.)
- **D:** only if `SectionType` is persisted as an int enum — new enum values then need no
  migration, but **verify the EF config** (`SectionConfigurationEntityConfiguration`) stores it as
  string; if int, no migration needed for values, just code. If any new section needs a dedicated
  column, avoid it — keep everything in `ContentJson`.
- **F:** yes — new page-variant tables + analytics linkage.

(Per project practice: feature code is written here; **the user applies migrations / git / DB**.)

## Cross-cutting requirements to preserve

- **Bilingual (en/ar) + RTL** for every new section's text content (match existing pattern).
- **SEO**: device visibility via CSS (not JS) so content stays crawlable; keep the SEO badges.
- **Sanitize** all Rich Text / Custom HTML on render.
- **Result<T>** pattern for any new backend command/query; register via MediatR auto-scan.
- **Shared DTO** is the single contract between merchant and store apps.

## Verification per phase

- **A:** set bg/padding/hide-on-mobile on a section → storefront reflects it; mobile hides it via CSS.
- **B:** drag to reorder + duplicate → save → reload → order/clone persisted.
- **C:** edit a field → right-side iframe updates live; device toggle resizes; no save needed.
- **D:** add each new section type → renders on storefront with real content.
- **E:** export a page → import into another → identical layout.
- **F:** split traffic → two variants render → dashboard shows per-variant conversion.
