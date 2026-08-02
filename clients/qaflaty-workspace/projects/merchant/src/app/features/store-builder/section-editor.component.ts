import { Component, Input, Output, EventEmitter, signal, computed, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  PageConfigurationDto, SectionConfigurationDto, PageSeoSettings,
  SectionContentSource, SectionSettings
} from 'shared';
import { ProductService } from '../products/services/product.service';
import { SectionLibraryComponent } from './section-library/section-library.component';
import { SectionCanvasComponent } from './section-canvas/section-canvas.component';
import { BuilderDragStateService } from './section-canvas/builder-drag-state.service';
import { SectionPreviewDataService } from './section-preview/section-preview-data.service';
import { SectionFieldsComponent } from './section-settings/section-fields.component';
import { readSettings, setBilingualValue, setContentValue, setSettingsValue } from './section-settings/section-content';
import {
  PAGE_TEMPLATES, PageTemplate, SECTION_TYPES, SectionVariant,
  createSectionInstance, findSectionType, sectionTypeLabel, variantsFor
} from './section-preview/section-catalog';

/**
 * The page builder: a library of ready-made sections on the left, the page
 * canvas in the middle, and an optional settings modal behind each section's
 * pencil. What a section's settings offer comes from its schema
 * (`section-settings/section-schema.ts`), not from markup in here.
 */
@Component({
  selector: 'app-section-editor',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DragDropModule,
    SectionLibraryComponent, SectionCanvasComponent, SectionFieldsComponent
  ],
  template: `
    <div class="bg-surface rounded-lg shadow">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-border transition-opacity" [class.opacity-60]="dragState.dragging()">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-text">{{ page?.title?.english }}</h3>
            <p class="text-sm text-text-muted mt-1">
              @if (isLayoutGroup()) {
                This is what wraps every page of your store. Drag sections in, and open one with the pencil to change its wording.
              } @else {
                Drag sections onto the page. Open one with the pencil only if you want to change its wording.
              }
            </p>
          </div>
          <div class="flex items-center gap-2">
            @if (!isLayoutGroup()) {
              <button type="button" (click)="showTemplateModal.set(true)"
                class="rounded-md border border-border px-3 py-2 text-sm font-medium text-text hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40">
                Start from a template
              </button>
            }
            <button type="button" (click)="onClose()"
              class="rounded p-1.5 text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="Close the page builder">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Sections panel + page canvas, connected as one drop-list group -->
      <div cdkDropListGroup class="relative flex gap-4 p-4">
        @if (librarySheetOpen()) {
          <button type="button" (click)="librarySheetOpen.set(false)" aria-label="Close the sections panel"
            class="fixed inset-0 z-30 bg-black/40 lg:hidden"></button>
        }

        <aside
          class="fixed inset-x-0 bottom-0 z-40 flex h-[70vh] flex-col rounded-t-2xl border border-border bg-surface shadow-2xl lg:static lg:z-auto lg:h-[620px] lg:w-[290px] lg:shrink-0 lg:rounded-xl lg:shadow-none"
          [ngClass]="{ 'max-lg:hidden': !librarySheetOpen() }"
        >
          <div class="flex items-center justify-between border-b border-border px-4 py-2 lg:hidden">
            <span class="text-sm font-semibold text-text">Sections</span>
            <button type="button" (click)="librarySheetOpen.set(false)"
              class="rounded p-1 text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="Close the sections panel">✕</button>
          </div>
          <div class="min-h-0 flex-1">
            <app-section-library [scope]="scope()" (add)="onLibraryAdd($event)" />
          </div>
        </aside>

        <div class="min-w-0 flex-1">
          <button type="button" (click)="librarySheetOpen.set(true)"
            class="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-2.5 text-sm font-medium text-text-muted hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 lg:hidden">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add a section
          </button>

          <div class="h-[620px]">
            <app-section-canvas
              [sections]="localSections()"
              (sectionsChange)="onCanvasChange($event)"
              (editSection)="openSettings($event)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Section settings. Optional by design: a section dropped and never opened
         still saves and renders with its defaults plus your real store data. -->
    @if (editingSection(); as section) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        (click)="closeSettings()" (document:keydown.escape)="closeSettings()">
        <div class="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-surface shadow-xl"
          role="dialog" aria-modal="true" [attr.aria-label]="'Settings for ' + typeLabel(section.sectionType)"
          (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 class="text-base font-semibold text-text">{{ typeLabel(section.sectionType) }}</h3>
              <p class="mt-0.5 text-xs text-text-muted">Your changes show on the page straight away.</p>
            </div>
            <button type="button" (click)="closeSettings()"
              class="rounded p-1.5 text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="Close section settings">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            @if (variantsFor(section.sectionType).length > 1) {
              <div>
                <label class="mb-1 block text-xs font-medium text-text" [attr.for]="'variant-' + section.id">Layout</label>
                <select
                  [id]="'variant-' + section.id"
                  #variantSelect
                  [value]="section.variantId"
                  (change)="setVariant(section, variantSelect.value)"
                  class="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  @for (variant of variantsFor(section.sectionType); track variant.id) {
                    <option [value]="variant.id">{{ variant.label }}</option>
                  }
                </select>
              </div>
            }

            <!-- What this section pulls from the catalogue -->
            @if (dataSourceKind(section); as kind) {
              <div class="rounded-lg border border-border bg-surface-elevated p-3 space-y-3">
                <p class="text-xs font-semibold text-text">
                  {{ kind === 'products' ? 'Which products to show' : 'Which categories to show' }}
                </p>

                @if (kind === 'products') {
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="mb-1 block text-xs font-medium text-text" [attr.for]="'source-mode-' + section.id">Choose products by</label>
                      <select
                        [id]="'source-mode-' + section.id"
                        #sourceMode
                        [value]="sourceOf(section).mode || 'newest'"
                        (change)="setSourceMode(section, sourceMode.value)"
                        class="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="newest">Newest first</option>
                        <option value="priceAsc">Price: low to high</option>
                        <option value="priceDesc">Price: high to low</option>
                        <option value="nameAsc">Name: A to Z</option>
                        <option value="category">Everything in one category</option>
                        <option value="manual">Products I pick myself</option>
                      </select>
                    </div>
                    <div>
                      <label class="mb-1 block text-xs font-medium text-text" [attr.for]="'source-limit-' + section.id">How many to show</label>
                      <input
                        type="number" min="1" max="24"
                        [id]="'source-limit-' + section.id"
                        #sourceLimit
                        [value]="sourceLimitOf(section)"
                        (input)="setSourceField(section, 'limit', +sourceLimit.value)"
                        class="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  @if (sourceOf(section).mode === 'category') {
                    <div>
                      <label class="mb-1 block text-xs font-medium text-text" [attr.for]="'source-cat-' + section.id">Category</label>
                      <select
                        [id]="'source-cat-' + section.id"
                        #sourceCat
                        [value]="sourceOf(section).categoryId || ''"
                        (change)="setSourceField(section, 'categoryId', sourceCat.value)"
                        class="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="">Choose a category…</option>
                        @for (category of categoryOptions(); track category.id) {
                          <option [value]="category.id">{{ category.name }}</option>
                        }
                      </select>
                    </div>
                  }

                  @if (sourceOf(section).mode === 'manual') {
                    <div>
                      <p class="mb-1 text-xs font-medium text-text">
                        Pick products
                        <span class="font-normal text-text-muted">— they appear in the order you tick them ({{ pickedSlugs(section).length }} chosen)</span>
                      </p>
                      <div class="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-surface p-2">
                        @for (product of productOptions(); track product.slug) {
                          <label class="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-text hover:bg-surface-elevated">
                            <input
                              type="checkbox"
                              class="h-4 w-4 rounded text-primary focus:ring-2 focus:ring-primary/40"
                              [checked]="isPicked(section, product.slug)"
                              (change)="togglePickedProduct(section, product.slug)"
                            />
                            <span class="truncate">{{ product.name }}</span>
                          </label>
                        } @empty {
                          <p class="px-1 py-2 text-xs text-text-muted">This store has no products yet. Add one first, then come back to pick it.</p>
                        }
                      </div>
                    </div>
                  }
                } @else {
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="mb-1 block text-xs font-medium text-text" [attr.for]="'cat-mode-' + section.id">Show</label>
                      <select
                        [id]="'cat-mode-' + section.id"
                        #catMode
                        [value]="pickedCategoryIds(section).length ? 'chosen' : 'all'"
                        (change)="setCategoryMode(section, catMode.value)"
                        class="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="all">All my categories</option>
                        <option value="chosen">Only the ones I pick</option>
                      </select>
                    </div>
                    <div>
                      <label class="mb-1 block text-xs font-medium text-text" [attr.for]="'cat-limit-' + section.id">How many to show</label>
                      <input
                        type="number" min="1" max="12"
                        [id]="'cat-limit-' + section.id"
                        #catLimit
                        [value]="sourceLimitOf(section)"
                        (input)="setSourceField(section, 'limit', +catLimit.value)"
                        class="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  @if (pickedCategoryIds(section).length) {
                    <div class="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border bg-surface p-2">
                      @for (category of categoryOptions(); track category.id) {
                        <label class="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-text hover:bg-surface-elevated">
                          <input
                            type="checkbox"
                            class="h-4 w-4 rounded text-primary focus:ring-2 focus:ring-primary/40"
                            [checked]="isCategoryPicked(section, category.id)"
                            (change)="togglePickedCategory(section, category.id)"
                          />
                          <span class="truncate">{{ category.name }}</span>
                        </label>
                      }
                    </div>
                  }
                }
              </div>
            }

            <!-- Everything else this section type offers, straight from its schema -->
            <app-section-fields
              [section]="section"
              [storeId]="page?.storeId ?? null"
              [productOptions]="productOptions()"
              [idPrefix]="'sec-' + section.id"
              (sectionChange)="onSectionEdited($event)"
            />
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
            <button type="button" (click)="closeSettings()"
              class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/40">
              Done
            </button>
          </div>
        </div>
      </div>
    }

    <div class="bg-surface rounded-lg shadow mt-4 transition-opacity" [class.opacity-60]="dragState.dragging()">
      <!-- How this page appears in search results. A header or footer is not a
           page shoppers land on, so it has nothing to say to search engines. -->
      <div class="px-6 py-5 bg-surface-elevated rounded-t-lg" [class.hidden]="isLayoutGroup()">
        <h4 class="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          How this page appears in search results
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-text mb-1" for="seo-title-en">
              Page title (EN)
              <span class="ms-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-success/10 text-success" title="This is what search engines show">SEO</span>
            </label>
            <input id="seo-title-en" type="text" [(ngModel)]="localSeoSettings.metaTitle.english"
              placeholder="Page title for search engines"
              class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
          <div>
            <label class="block text-xs font-medium text-text mb-1" for="seo-title-ar">
              Page title (AR)
              <span class="ms-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-success/10 text-success" title="This is what search engines show">SEO</span>
            </label>
            <input id="seo-title-ar" type="text" dir="rtl" [(ngModel)]="localSeoSettings.metaTitle.arabic"
              placeholder="عنوان الصفحة لمحركات البحث"
              class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
          <div>
            <label class="block text-xs font-medium text-text mb-1" for="seo-desc-en">
              Description (EN)
              <span class="ms-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-success/10 text-success" title="This is what search engines show">SEO</span>
            </label>
            <textarea id="seo-desc-en" rows="2" [(ngModel)]="localSeoSettings.metaDescription.english"
              placeholder="A short summary of this page (150–160 characters works best)"
              class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-text mb-1" for="seo-desc-ar">
              Description (AR)
              <span class="ms-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-success/10 text-success" title="This is what search engines show">SEO</span>
            </label>
            <textarea id="seo-desc-ar" rows="2" dir="rtl" [(ngModel)]="localSeoSettings.metaDescription.arabic"
              placeholder="وصف مختصر للصفحة"
              class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"></textarea>
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-text mb-1" for="seo-og">Sharing image</label>
            <input id="seo-og" type="text" [(ngModel)]="localSeoSettings.ogImageUrl"
              placeholder="https://… — shown when the page is shared on social media"
              class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="localSeoSettings.noIndex" class="h-4 w-4 text-primary rounded" />
              <span class="text-xs font-medium text-text">Keep out of search results</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="localSeoSettings.noFollow" class="h-4 w-4 text-primary rounded" />
              <span class="text-xs font-medium text-text">Don't follow links on this page</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <button type="button" (click)="exportJson()"
            class="px-3 py-2 text-sm bg-surface-elevated text-text rounded-md hover:bg-border/40 flex items-center gap-1.5"
            title="Download this page's sections as a file you can reuse">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Export
          </button>
          <label class="px-3 py-2 text-sm bg-surface-elevated text-text rounded-md hover:bg-border/40 flex items-center gap-1.5 cursor-pointer"
            title="Load sections from a file — this replaces the page, and is not saved until you choose Save changes">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            Import
            <input type="file" accept="application/json,.json" class="hidden" (change)="onImportFile($event)" />
          </label>
          @if (importErr()) {
            <span class="text-xs text-danger">{{ importErr() }}</span>
          }
        </div>
        <div class="flex items-center gap-3">
          <button type="button" (click)="onClose()"
            class="px-4 py-2 bg-surface-elevated text-text rounded-md hover:bg-border/40 focus:outline-none focus:ring-2 focus:ring-border">
            Discard and go back
          </button>
          <button type="button" (click)="onSave()"
            class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/40">
            Save changes
          </button>
        </div>
      </div>
    </div>

    <!-- Page templates: a whole starting layout in one click -->
    @if (showTemplateModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        (click)="showTemplateModal.set(false)" (document:keydown.escape)="showTemplateModal.set(false)">
        <div class="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-6 shadow-xl"
          role="dialog" aria-modal="true" aria-label="Start from a template" (click)="$event.stopPropagation()">
          <h3 class="text-base font-semibold text-text">Start from a template</h3>
          <p class="mb-4 mt-1 text-xs text-text-muted">
            A template replaces everything currently on the page. Nothing is saved until you choose Save changes.
          </p>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            @for (tpl of pageTemplates; track tpl.key) {
              <button type="button" (click)="applyPageTemplate(tpl)"
                class="rounded-lg border-2 border-border p-3 text-start transition-colors hover:border-primary hover:bg-primary-tint focus:outline-none focus:ring-2 focus:ring-primary/40">
                <div class="text-sm font-medium text-text">{{ tpl.label }}</div>
                <div class="mt-0.5 text-xs text-text-muted">{{ tpl.description }}</div>
              </button>
            }
          </div>

          <div class="mt-6 flex justify-end">
            <button type="button" (click)="showTemplateModal.set(false)"
              class="rounded-md bg-surface-elevated px-4 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40">
              Cancel
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class SectionEditorComponent implements OnInit {
  @Input() page: PageConfigurationDto | null = null;
  @Output() save = new EventEmitter<{ sections: SectionConfigurationDto[]; seoSettings: PageSeoSettings }>();
  @Output() close = new EventEmitter<void>();
  /** Emits the current (unsaved) section list on every edit, to drive the live preview. */
  @Output() sectionsChange = new EventEmitter<SectionConfigurationDto[]>();

  /**
   * The working section list. Held as a signal, and every edit swaps in a new
   * array (and a new object for the section that changed) so the canvas
   * miniatures repaint the moment something changes.
   */
  localSections = signal<SectionConfigurationDto[]>([]);
  localSeoSettings: PageSeoSettings = {
    metaTitle: { arabic: '', english: '' },
    metaDescription: { arabic: '', english: '' },
    ogImageUrl: '',
    noIndex: false,
    noFollow: false
  };

  showTemplateModal = signal(false);
  librarySheetOpen = signal(false);
  importErr = signal<string | null>(null);

  /** Products offered by the product pickers (Order form / Bundle / Sticky bar). */
  productOptions = signal<{ slug: string; name: string }[]>([]);

  /** Id of the section whose settings modal is open, if any. */
  private editingSectionId = signal<string | null>(null);
  editingSection = computed<SectionConfigurationDto | null>(() => {
    const id = this.editingSectionId();
    return id === null ? null : this.localSections().find(s => s.id === id) ?? null;
  });

  private canvas = viewChild(SectionCanvasComponent);

  readonly dragState = inject(BuilderDragStateService);
  readonly pageTemplates = PAGE_TEMPLATES;

  /**
   * Header and footer groups offer layout sections; pages offer page sections.
   * A plain method, not a computed: `page` is a static input set once by the host.
   */
  scope(): 'page' | 'layout' {
    return this.isLayoutGroup() ? 'layout' : 'page';
  }

  isLayoutGroup(): boolean {
    return this.page?.pageType === 'Header' || this.page?.pageType === 'Footer';
  }

  private productService = inject(ProductService);
  private previewData = inject(SectionPreviewDataService);

  /** Serialized state as last loaded or saved, for the unsaved-changes guard. */
  private baseline = '';

  ngOnInit(): void {
    if (this.page?.sections) {
      const sections: SectionConfigurationDto[] = JSON.parse(JSON.stringify(this.page.sections));
      sections.sort((a, b) => a.sortOrder - b.sortOrder);
      this.localSections.set(sections);
    }
    if (this.page?.seoSettings) {
      this.localSeoSettings = JSON.parse(JSON.stringify(this.page.seoSettings));
    }
    this.loadProductOptions();
    this.previewData.load(this.page?.storeId);
    this.baseline = this.snapshot();
  }

  private loadProductOptions(): void {
    const storeId = this.page?.storeId;
    if (!storeId) return;
    this.productService.getProducts(storeId, { limit: 200 }).subscribe({
      next: (res) => this.productOptions.set(res.items.map(p => ({ slug: p.slug, name: p.name }))),
      error: () => { /* the pickers simply show no options */ }
    });
  }

  private snapshot(): string {
    return JSON.stringify({ sections: this.localSections(), seo: this.localSeoSettings });
  }

  /** True when the page differs from what was last loaded or saved. */
  hasUnsavedChanges(): boolean {
    return this.snapshot() !== this.baseline;
  }

  /** Called by the host once a save round-trip has succeeded. */
  markSaved(): void {
    this.baseline = this.snapshot();
  }

  /** Notify listeners (live preview) that the working section list changed. */
  notifyChange(): void {
    this.sectionsChange.emit([...this.localSections()]);
  }

  typeLabel(sectionType: string): string {
    return sectionTypeLabel(sectionType);
  }

  variantsFor(sectionType: string): SectionVariant[] {
    return variantsFor(sectionType);
  }

  // ── Canvas & library plumbing ──────────────────────────────────────────

  /** The canvas owns ordering and per-section actions; it hands the list back. */
  onCanvasChange(sections: SectionConfigurationDto[]): void {
    this.localSections.set(sections);
    this.notifyChange();
  }

  /** Keyboard / click path from the library — appends to the end of the page. */
  onLibraryAdd(typeKey: string): void {
    this.canvas()?.addSection(typeKey);
    this.librarySheetOpen.set(false);
  }

  openSettings(section: SectionConfigurationDto): void {
    this.editingSectionId.set(section.id);
  }

  closeSettings(): void {
    this.editingSectionId.set(null);
  }

  /** A settings edit arrives as the whole updated section. */
  onSectionEdited(updated: SectionConfigurationDto): void {
    this.localSections.set(this.localSections().map(s => s.id === updated.id ? updated : s));
    this.notifyChange();
  }

  setVariant(section: SectionConfigurationDto, variantId: string): void {
    this.onSectionEdited({ ...section, variantId });
  }

  /** Programmatic content edit, used by the host and by tests. */
  setContentField(section: SectionConfigurationDto, key: string, value: unknown): void {
    this.onSectionEdited(setContentValue(this.currentSection(section), key, value));
  }

  setContentBilingual(section: SectionConfigurationDto, key: string, lang: 'en' | 'ar', value: string): void {
    this.onSectionEdited(setBilingualValue(this.currentSection(section), key, lang, value));
  }

  /**
   * Callers can hold a section object from before the last edit; look it up by
   * id so a second write in the same turn still sees the first one.
   */
  private currentSection(section: SectionConfigurationDto): SectionConfigurationDto {
    return this.localSections().find(s => s.id === section.id) ?? section;
  }

  // ── "What should this section show?" ───────────────────────────────────

  /** 'products' / 'categories' for catalogue-driven sections, null otherwise. */
  dataSourceKind(section: SectionConfigurationDto): 'products' | 'categories' | null {
    return findSectionType(section.sectionType)?.dataSource ?? null;
  }

  categoryOptions(): { id: string; name: string }[] {
    return this.previewData.categories();
  }

  sourceOf(section: SectionConfigurationDto): SectionContentSource {
    const settings = readSettings(this.currentSection(section)) as SectionSettings;
    return settings.source ?? {};
  }

  /** Falls back to the legacy `pageSize` so an older section shows its real number. */
  sourceLimitOf(section: SectionConfigurationDto): number {
    const settings = readSettings(this.currentSection(section)) as SectionSettings;
    const legacy = typeof settings['pageSize'] === 'number' ? settings['pageSize'] as number : undefined;
    return this.sourceOf(section).limit ?? legacy ?? 8;
  }

  setSourceField<K extends keyof SectionContentSource>(
    section: SectionConfigurationDto,
    field: K,
    value: SectionContentSource[K]
  ): void {
    const source: SectionContentSource = { ...this.sourceOf(section), [field]: value };

    // Drop the settings that belong to a mode the merchant just left, so the
    // stored source never describes two different selections at once.
    if (field === 'mode') {
      if (value !== 'category') delete source.categoryId;
      if (value !== 'manual') delete source.productSlugs;
    }

    this.onSectionEdited(setSettingsValue(this.currentSection(section), 'source', source));
  }

  /** Narrows the raw `<select>` value onto the union the source accepts. */
  setSourceMode(section: SectionConfigurationDto, mode: string): void {
    const allowed: SectionContentSource['mode'][] = ['newest', 'priceAsc', 'priceDesc', 'nameAsc', 'category', 'manual'];
    const next = allowed.find(m => m === mode) ?? 'newest';
    this.setSourceField(section, 'mode', next);
  }

  pickedSlugs(section: SectionConfigurationDto): string[] {
    return this.sourceOf(section).productSlugs ?? [];
  }

  isPicked(section: SectionConfigurationDto, slug: string): boolean {
    return this.pickedSlugs(section).includes(slug);
  }

  /** Ticking appends, so the chosen order is the order they appear on the page. */
  togglePickedProduct(section: SectionConfigurationDto, slug: string): void {
    const current = this.pickedSlugs(section);
    const next = current.includes(slug) ? current.filter(s => s !== slug) : [...current, slug];
    this.setSourceField(section, 'productSlugs', next);
  }

  pickedCategoryIds(section: SectionConfigurationDto): string[] {
    return this.sourceOf(section).categoryIds ?? [];
  }

  isCategoryPicked(section: SectionConfigurationDto, id: string): boolean {
    return this.pickedCategoryIds(section).includes(id);
  }

  togglePickedCategory(section: SectionConfigurationDto, id: string): void {
    const current = this.pickedCategoryIds(section);
    const next = current.includes(id) ? current.filter(c => c !== id) : [...current, id];
    this.setSourceField(section, 'categoryIds', next);
  }

  /** "All" clears the selection; "chosen" seeds it with the first category. */
  setCategoryMode(section: SectionConfigurationDto, mode: string): void {
    if (mode === 'all') {
      this.setSourceField(section, 'categoryIds', []);
      return;
    }
    const first = this.categoryOptions()[0];
    this.setSourceField(section, 'categoryIds', first ? [first.id] : []);
  }

  // ── Page templates ─────────────────────────────────────────────────────

  applyPageTemplate(tpl: PageTemplate): void {
    const current = this.localSections();
    if (current.length > 0 &&
        !confirm(`Replace the ${current.length} section(s) on this page with "${tpl.label}"? Nothing is saved until you choose Save changes.`)) {
      return;
    }

    const sections = tpl.sections
      .map(s => createSectionInstance(s.sectionType, {
        variantId: s.variantId,
        content: s.content,
        settings: s.settings
      }))
      .filter((s): s is SectionConfigurationDto => s !== null);

    sections.forEach((section, index) => { section.sortOrder = index + 1; });
    this.localSections.set(sections);
    this.showTemplateModal.set(false);
    this.notifyChange();
  }

  // ── Export / import ────────────────────────────────────────────────────

  exportJson(): void {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      sections: this.localSections().map(({ sectionType, variantId, isEnabled, sortOrder, contentJson, settingsJson }) =>
        ({ sectionType, variantId, isEnabled, sortOrder, contentJson, settingsJson })),
      seoSettings: this.localSeoSettings
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const name = (this.page?.slug || this.page?.title?.english || 'page').toString().replace(/[^a-z0-9-_]+/gi, '-');
    a.href = url;
    a.download = `qaflaty-${name}-sections.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onImportFile(event: Event): void {
    this.importErr.set(null);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.applyImported(JSON.parse(String(reader.result)));
      } catch {
        this.importErr.set('That file is not valid JSON.');
      }
      input.value = '';
    };
    reader.onerror = () => {
      this.importErr.set('The file could not be read.');
      input.value = '';
    };
    reader.readAsText(file);
  }

  private applyImported(parsed: any): void {
    const rawSections = Array.isArray(parsed?.sections) ? parsed.sections : null;
    if (!rawSections) {
      this.importErr.set('That file has no "sections" list in it.');
      return;
    }

    const validTypes = new Set(SECTION_TYPES.map(t => t.key));
    const imported: SectionConfigurationDto[] = [];
    for (const s of rawSections) {
      if (!s || typeof s.sectionType !== 'string' || typeof s.variantId !== 'string') {
        this.importErr.set('One or more sections are missing a type or a layout.');
        return;
      }
      if (!validTypes.has(s.sectionType)) {
        this.importErr.set(`This file uses a section this store does not have: ${s.sectionType}.`);
        return;
      }
      imported.push({
        id: crypto.randomUUID(),
        sectionType: s.sectionType,
        variantId: s.variantId,
        isEnabled: s.isEnabled !== false,
        sortOrder: imported.length + 1,
        contentJson: typeof s.contentJson === 'string' ? s.contentJson : undefined,
        settingsJson: typeof s.settingsJson === 'string' ? s.settingsJson : undefined
      });
    }

    imported.forEach((section, index) => { section.sortOrder = index + 1; });
    this.localSections.set(imported);

    const seo = parsed?.seoSettings;
    if (seo && seo.metaTitle && seo.metaDescription) {
      this.localSeoSettings = {
        metaTitle: { english: seo.metaTitle.english || '', arabic: seo.metaTitle.arabic || '' },
        metaDescription: { english: seo.metaDescription.english || '', arabic: seo.metaDescription.arabic || '' },
        ogImageUrl: seo.ogImageUrl || '',
        noIndex: seo.noIndex === true,
        noFollow: seo.noFollow === true
      };
    }

    this.notifyChange();
  }

  onSave(): void {
    this.save.emit({ sections: this.localSections(), seoSettings: this.localSeoSettings });
  }

  onClose(): void {
    this.close.emit();
  }
}
