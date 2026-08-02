import { Component, Input, Output, EventEmitter, signal, computed, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PageConfigurationDto, SectionConfigurationDto, PageSeoSettings } from 'shared';
import { MediaService } from '../products/services/media.service';
import { ProductService } from '../products/services/product.service';
import { RichTextEditorComponent } from './rich-text-editor.component';
import { SectionLibraryComponent } from './section-library/section-library.component';
import { SectionCanvasComponent } from './section-canvas/section-canvas.component';
import { BuilderDragStateService } from './section-canvas/builder-drag-state.service';
import { SectionPreviewDataService } from './section-preview/section-preview-data.service';
import {
  PAGE_TEMPLATES, PageTemplate, SECTION_TYPES, SectionVariant,
  createSectionInstance, sectionTypeLabel, variantsFor
} from './section-preview/section-catalog';

@Component({
  selector: 'app-section-editor',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DragDropModule, RichTextEditorComponent,
    SectionLibraryComponent, SectionCanvasComponent
  ],
  template: `
    <div class="bg-surface rounded-lg shadow">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-border transition-opacity" [class.opacity-60]="dragState.dragging()">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-text">
              {{ page?.title?.english }}
            </h3>
            <p class="text-sm text-text-muted mt-1">
              Drag sections onto the page. Open one with the pencil only if you want to change its wording.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" (click)="showTemplateModal.set(true)"
              class="rounded-md border border-border px-3 py-2 text-sm font-medium text-text hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40">
              Start from a template
            </button>
            <button type="button" (click)="onClose()" class="p-1.5 text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/40 rounded" aria-label="Close the page builder">
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
            <app-section-library (add)="onLibraryAdd($event)" />
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

                @switch (section.sectionType) {
                  @case ('Hero') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">
                          Title (EN)
                          <span class="ms-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-success/10 text-success" title="This field impacts search engine rankings">SEO</span>
                        </label>
                        <input #heroTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', heroTitleEn.value)" placeholder="Welcome to Our Store" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                        <input #heroTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', heroTitleAr.value)" placeholder="أهلاً بكم" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (EN)</label>
                        <input #heroSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.subtitle?.en || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'en', heroSubEn.value)" placeholder="Discover our amazing collection" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (AR)</label>
                        <input #heroSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.subtitle?.ar || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'ar', heroSubAr.value)" placeholder="اكتشف مجموعتنا" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Button Text</label>
                        <input #heroBtn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.buttonText || ''"
                          (input)="setContentField(section, 'buttonText', heroBtn.value)" placeholder="Shop Now" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Button Link</label>
                        <input #heroBtnLink type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.buttonLink || ''"
                          (input)="setContentField(section, 'buttonLink', heroBtnLink.value)" placeholder="/products" />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-text mb-1">
                          Background Image
                          <span class="ms-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-success/10 text-success" title="Image alt text impacts search engine rankings">SEO</span>
                        </label>
                        <div class="flex gap-2">
                          <input #heroImg type="text" class="flex-1 text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                            [value]="getContent(section)?.imageUrl || ''"
                            (input)="setContentField(section, 'imageUrl', heroImg.value)" placeholder="Paste image URL or upload →" />
                          <label class="cursor-pointer flex-shrink-0 px-3 py-1.5 bg-surface-elevated hover:bg-surface-elevated rounded-md text-xs text-text flex items-center gap-1.5 transition-colors"
                            [class.opacity-50]="uploadingField() === section.id + ':imageUrl'">
                            @if (uploadingField() === section.id + ':imageUrl') {
                              <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                              Uploading...
                            } @else {
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                              </svg>
                              Upload
                            }
                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden"
                              [disabled]="!!uploadingField()"
                              (change)="uploadImage(section, 'imageUrl', $event)" />
                          </label>
                        </div>
                        @if (getContent(section)?.imageUrl) {
                          <img [src]="getContent(section).imageUrl" class="mt-2 h-24 w-full object-cover rounded-md border border-border" alt="Preview" />
                        }
                      </div>
                    </div>
                  }
                  @case ('FeaturedProducts') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                        <input #fpTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', fpTitleEn.value)" placeholder="Featured Products" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                        <input #fpTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', fpTitleAr.value)" placeholder="المنتجات المميزة" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (EN)</label>
                        <input #fpSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.subtitle?.en || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'en', fpSubEn.value)" placeholder="Check out our top picks" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (AR)</label>
                        <input #fpSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.subtitle?.ar || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'ar', fpSubAr.value)" placeholder="اكتشف أفضل منتجاتنا" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Products to Show</label>
                        <input #fpPageSize type="number" min="4" max="24" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getSettings(section)?.pageSize || 8"
                          (input)="setSettingsField(section, 'pageSize', +fpPageSize.value)" />
                      </div>
                    </div>
                  }
                  @case ('CategoryShowcase') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                        <input #csTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', csTitleEn.value)" placeholder="Shop by Category" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                        <input #csTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', csTitleAr.value)" placeholder="تسوق حسب الفئة" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (EN)</label>
                        <input #csSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.subtitle?.en || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'en', csSubEn.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (AR)</label>
                        <input #csSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.subtitle?.ar || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'ar', csSubAr.value)" />
                      </div>
                    </div>
                  }
                  @case ('FeatureHighlights') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                        <input #fhTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', fhTitleEn.value)" placeholder="Why Choose Us" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                        <input #fhTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', fhTitleAr.value)" placeholder="لماذا تختارنا" />
                      </div>
                    </div>
                    <p class="text-xs text-text-muted">Feature items can be managed through the store builder API.</p>
                  }
                  @case ('Newsletter') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                        <input #nlTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', nlTitleEn.value)" placeholder="Stay in the Loop" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                        <input #nlTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', nlTitleAr.value)" placeholder="ابق على اطلاع" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (EN)</label>
                        <input #nlSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.subtitle?.en || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'en', nlSubEn.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (AR)</label>
                        <input #nlSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.subtitle?.ar || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'ar', nlSubAr.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Input Placeholder</label>
                        <input #nlPlaceholder type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.placeholder || ''"
                          (input)="setContentField(section, 'placeholder', nlPlaceholder.value)" placeholder="Enter your email" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Button Text</label>
                        <input #nlBtn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.buttonText || ''"
                          (input)="setContentField(section, 'buttonText', nlBtn.value)" placeholder="Subscribe" />
                      </div>
                    </div>
                  }
                  @case ('Banner') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                        <input #banTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', banTitleEn.value)" placeholder="Special Offer" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                        <input #banTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', banTitleAr.value)" placeholder="عرض خاص" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (EN)</label>
                        <input #banSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.subtitle?.en || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'en', banSubEn.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (AR)</label>
                        <input #banSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.subtitle?.ar || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'ar', banSubAr.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Button Text</label>
                        <input #banBtn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.buttonText || ''"
                          (input)="setContentField(section, 'buttonText', banBtn.value)" placeholder="Shop Now" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Button Link</label>
                        <input #banBtnLink type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.buttonLink || ''"
                          (input)="setContentField(section, 'buttonLink', banBtnLink.value)" placeholder="/products" />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-text mb-1">Banner Image</label>
                        <div class="flex gap-2">
                          <input #banImg type="text" class="flex-1 text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                            [value]="getContent(section)?.imageUrl || ''"
                            (input)="setContentField(section, 'imageUrl', banImg.value)" placeholder="Paste image URL or upload →" />
                          <label class="cursor-pointer flex-shrink-0 px-3 py-1.5 bg-surface-elevated hover:bg-surface-elevated rounded-md text-xs text-text flex items-center gap-1.5 transition-colors"
                            [class.opacity-50]="uploadingField() === section.id + ':imageUrl'">
                            @if (uploadingField() === section.id + ':imageUrl') {
                              <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                              Uploading...
                            } @else {
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                              </svg>
                              Upload
                            }
                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden"
                              [disabled]="!!uploadingField()"
                              (change)="uploadImage(section, 'imageUrl', $event)" />
                          </label>
                        </div>
                        @if (getContent(section)?.imageUrl) {
                          <img [src]="getContent(section).imageUrl" class="mt-2 h-24 w-full object-cover rounded-md border border-border" alt="Preview" />
                        }
                      </div>
                    </div>
                  }
                  @case ('ProductCarousel') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                        <input #pcTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', pcTitleEn.value)" placeholder="Popular Products" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                        <input #pcTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', pcTitleAr.value)" placeholder="المنتجات الشائعة" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Products to Show</label>
                        <input #pcPageSize type="number" min="4" max="24" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getSettings(section)?.pageSize || 8"
                          (input)="setSettingsField(section, 'pageSize', +pcPageSize.value)" />
                      </div>
                    </div>
                  }
                  @case ('Testimonials') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                        <input #testTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', testTitleEn.value)" placeholder="What Our Customers Say" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                        <input #testTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', testTitleAr.value)" placeholder="ماذا يقول عملاؤنا" />
                      </div>
                    </div>
                    <p class="text-xs text-text-muted">Individual testimonial items can be added through the API.</p>
                  }
                  @case ('CustomHtml') {
                    <div>
                      <label class="block text-xs font-medium text-text mb-1">Custom HTML</label>
                      <textarea #customHtml rows="6" class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 font-mono"
                        [value]="getContent(section)?.html || ''"
                        (input)="setContentField(section, 'html', customHtml.value)"
                        placeholder="<div>Your custom HTML here...</div>">
                      </textarea>
                      <p class="mt-1 text-xs text-warning">HTML is rendered as-is. Ensure content is safe.</p>
                    </div>
                  }
                  @case ('MediaText') {
                    <div class="space-y-4">
                      @for (item of getContentArray(section, 'items'); track $index; let i = $index) {
                        <div class="border border-border rounded-md p-3 space-y-2 bg-surface">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-text-muted">Row {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'items', i)" class="text-xs text-danger hover:text-danger">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                              <input #mtTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.title?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'title', 'en', mtTitleEn.value)" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                              <input #mtTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.title?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'title', 'ar', mtTitleAr.value)" />
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-text mb-1">Text (EN)</label>
                              <textarea #mtTextEn rows="2" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.text?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'text', 'en', mtTextEn.value)"></textarea>
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-text mb-1">Text (AR)</label>
                              <textarea #mtTextAr rows="2" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.text?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'text', 'ar', mtTextAr.value)"></textarea>
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-text mb-1">Image (leave blank to use a product photo)</label>
                              <div class="flex gap-2">
                                <input #mtImg type="text" class="flex-1 text-sm px-2 py-1.5 border border-border rounded-md"
                                  [value]="item.imageUrl || ''" (input)="updateArrayItemField(section, 'items', i, 'imageUrl', mtImg.value)" placeholder="Paste image URL or upload →" />
                                <label class="cursor-pointer flex-shrink-0 px-3 py-1.5 bg-surface-elevated hover:bg-surface-elevated rounded-md text-xs text-text"
                                  [class.opacity-50]="uploadingField() === section.id + ':items:' + i + ':imageUrl'">
                                  Upload
                                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden"
                                    [disabled]="!!uploadingField()" (change)="uploadArrayItemImage(section, 'items', i, 'imageUrl', $event)" />
                                </label>
                              </div>
                              @if (item.imageUrl) {
                                <img [src]="item.imageUrl" class="mt-2 h-20 w-full object-cover rounded-md border border-border" alt="Preview" />
                              }
                            </div>

                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-text mb-1">Text Position</label>
                              <div class="flex gap-2">
                                <button type="button" (click)="updateArrayItemField(section, 'items', i, 'layout', 'side')"
                                  class="flex-1 text-xs px-2 py-1.5 rounded-md border" [class.border-primary]="(item.layout || 'side') === 'side'"
                                  [class.bg-primary-tint]="(item.layout || 'side') === 'side'" [class.border-border]="(item.layout || 'side') !== 'side'">Beside Image</button>
                                <button type="button" (click)="updateArrayItemField(section, 'items', i, 'layout', 'below')"
                                  class="flex-1 text-xs px-2 py-1.5 rounded-md border" [class.border-primary]="item.layout === 'below'"
                                  [class.bg-primary-tint]="item.layout === 'below'" [class.border-border]="item.layout !== 'below'">Below Image</button>
                                <button type="button" (click)="updateArrayItemField(section, 'items', i, 'layout', 'overlay')"
                                  class="flex-1 text-xs px-2 py-1.5 rounded-md border" [class.border-primary]="item.layout === 'overlay'"
                                  [class.bg-primary-tint]="item.layout === 'overlay'" [class.border-border]="item.layout !== 'overlay'">Over Image</button>
                              </div>
                            </div>

                            @if ((item.layout || 'side') === 'side') {
                              <label class="col-span-2 flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" [checked]="item.reverse" (change)="updateArrayItemField(section, 'items', i, 'reverse', !item.reverse)" class="h-4 w-4 text-primary rounded" />
                                <span class="text-xs font-medium text-text">Image on the right</span>
                              </label>
                            }
                            @if (item.layout === 'below') {
                              <label class="col-span-2 flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" [checked]="item.reverse" (change)="updateArrayItemField(section, 'items', i, 'reverse', !item.reverse)" class="h-4 w-4 text-primary rounded" />
                                <span class="text-xs font-medium text-text">Text above the image</span>
                              </label>
                            }

                            @if (item.layout === 'overlay') {
                              <div class="col-span-2 space-y-3 border-t border-border pt-3">
                                <div>
                                  <label class="block text-xs font-medium text-text mb-1">Text Area</label>
                                  <div class="grid grid-cols-5 gap-1 w-48">
                                    @for (pos of overlayPositions; track pos) {
                                      <button type="button" (click)="selectOverlayCell(section, i, pos)"
                                        class="h-8 rounded-md border flex items-center justify-center transition-colors"
                                        [class.bg-success/20]="isOverlayEndpoint(item, pos)"
                                        [class.border-success]="isOverlayEndpoint(item, pos)"
                                        [class.bg-success/10]="isInOverlaySpan(item, pos) && !isOverlayEndpoint(item, pos)"
                                        [class.border-success/40]="isInOverlaySpan(item, pos) && !isOverlayEndpoint(item, pos)"
                                        [class.border-border]="!isInOverlaySpan(item, pos)"
                                        [title]="pos">
                                        <span class="w-1.5 h-1.5 rounded-full" [class.bg-success]="isInOverlaySpan(item, pos)" [class.bg-border]="!isInOverlaySpan(item, pos)"></span>
                                      </button>
                                    }
                                  </div>
                                  <p class="text-[11px] text-text-muted mt-1">Click a cell to start, then click another to size the box (a row, column, or rectangle) — or click it again for a small box. On phones this collapses to the nearest 2×2 corner so text doesn't crowd a small screen.</p>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                  <div>
                                    <label class="block text-xs font-medium text-text mb-1">Readability Overlay</label>
                                    <select #mtScrim class="w-full text-sm px-2 py-1.5 border border-border rounded-md bg-surface"
                                      [value]="item.scrim || 'dark'" (change)="updateArrayItemField(section, 'items', i, 'scrim', mtScrim.value)">
                                      <option value="dark">Dark</option>
                                      <option value="light">Light</option>
                                      <option value="none">None</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label class="block text-xs font-medium text-text mb-1">Text Color</label>
                                    <input #mtColor type="color" class="h-8 w-full rounded border border-border cursor-pointer p-0.5"
                                      [value]="item.textColor || '#ffffff'" (input)="updateArrayItemField(section, 'items', i, 'textColor', mtColor.value)" />
                                  </div>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'items', { imageUrl: '', title: { en: '', ar: '' }, text: { en: '', ar: '' }, reverse: false, layout: 'side' })"
                        class="text-xs font-medium text-primary hover:text-primary">+ Add Row</button>
                    </div>
                  }
                  @case ('Benefits') {
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                          <input #benfTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', benfTitleEn.value)" placeholder="Why You'll Love It" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                          <input #benfTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', benfTitleAr.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'items'); track $index; let i = $index) {
                        <div class="border border-border rounded-md p-3 space-y-2 bg-surface">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-text-muted">Benefit {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'items', i)" class="text-xs text-danger hover:text-danger">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-text mb-1">Icon (emoji)</label>
                              <input #benIcon type="text" class="w-20 text-sm px-2 py-1.5 border border-border rounded-md text-center"
                                [value]="item.icon || ''" (input)="updateArrayItemField(section, 'items', i, 'icon', benIcon.value)" placeholder="⭐" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                              <input #benTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.title?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'title', 'en', benTitleEn.value)" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                              <input #benTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.title?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'title', 'ar', benTitleAr.value)" />
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-text mb-1">Text (EN)</label>
                              <textarea #benTextEn rows="2" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.text?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'text', 'en', benTextEn.value)"></textarea>
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-text mb-1">Text (AR)</label>
                              <textarea #benTextAr rows="2" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.text?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'text', 'ar', benTextAr.value)"></textarea>
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'items', { icon: '⭐', title: { en: '', ar: '' }, text: { en: '', ar: '' } })"
                        class="text-xs font-medium text-primary hover:text-primary">+ Add Benefit</button>
                    </div>
                  }
                  @case ('Faq') {
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                          <input #faqTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', faqTitleEn.value)" placeholder="Frequently Asked Questions" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                          <input #faqTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', faqTitleAr.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'items'); track $index; let i = $index) {
                        <div class="border border-border rounded-md p-3 space-y-2 bg-surface">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-text-muted">Question {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'items', i)" class="text-xs text-danger hover:text-danger">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Question (EN)</label>
                              <input #faqQEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.question?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'question', 'en', faqQEn.value)" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Question (AR)</label>
                              <input #faqQAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.question?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'question', 'ar', faqQAr.value)" />
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-text mb-1">Answer (EN)</label>
                              <textarea #faqAEn rows="2" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.answer?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'answer', 'en', faqAEn.value)"></textarea>
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-text mb-1">Answer (AR)</label>
                              <textarea #faqAAr rows="2" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.answer?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'answer', 'ar', faqAAr.value)"></textarea>
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'items', { question: { en: '', ar: '' }, answer: { en: '', ar: '' } })"
                        class="text-xs font-medium text-primary hover:text-primary">+ Add Question</button>
                    </div>
                  }
                  @case ('Guarantee') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Icon (emoji)</label>
                        <input #gIcon type="text" class="w-20 text-sm px-2 py-1.5 border border-border rounded-md text-center"
                          [value]="getContent(section)?.icon || ''" (input)="setContentField(section, 'icon', gIcon.value)" placeholder="🛡️" />
                      </div>
                      <div></div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                        <input #gTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', gTitleEn.value)" placeholder="Satisfaction Guaranteed" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                        <input #gTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', gTitleAr.value)" />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-text mb-1">Text (EN)</label>
                        <textarea #gTextEn rows="2" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.text?.en || ''" (input)="setContentBilingual(section, 'text', 'en', gTextEn.value)"></textarea>
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-text mb-1">Text (AR)</label>
                        <textarea #gTextAr rows="2" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.text?.ar || ''" (input)="setContentBilingual(section, 'text', 'ar', gTextAr.value)"></textarea>
                      </div>
                    </div>
                  }
                  @case ('CallToAction') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                        <input #ctaTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', ctaTitleEn.value)" placeholder="Ready to get yours?" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                        <input #ctaTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', ctaTitleAr.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (EN)</label>
                        <input #ctaSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.subtitle?.en || ''" (input)="setContentBilingual(section, 'subtitle', 'en', ctaSubEn.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Subtitle (AR)</label>
                        <input #ctaSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.subtitle?.ar || ''" (input)="setContentBilingual(section, 'subtitle', 'ar', ctaSubAr.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Button Text (EN)</label>
                        <input #ctaBtnEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.buttonText?.en || ''" (input)="setContentBilingual(section, 'buttonText', 'en', ctaBtnEn.value)" placeholder="Shop Now" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Button Text (AR)</label>
                        <input #ctaBtnAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.buttonText?.ar || ''" (input)="setContentBilingual(section, 'buttonText', 'ar', ctaBtnAr.value)" />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-text mb-1">Button Link</label>
                        <input #ctaBtnLink type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.buttonLink || ''" (input)="setContentField(section, 'buttonLink', ctaBtnLink.value)" placeholder="/products, https://…, or leave empty to scroll to the buy box" />
                        <p class="text-[11px] text-text-muted mt-1">Leave empty on a product page to scroll to the buy box. On other pages, set where the button should go (e.g. /products).</p>
                      </div>
                    </div>
                  }
                  @case ('ReviewsShowcase') {
                    <p class="text-[11px] text-warning mb-2">Shows real customer reviews for the product — only appears on product landing pages. For a home or custom page, use the “Testimonials” section instead.</p>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                        <input #rsTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', rsTitleEn.value)" placeholder="What Customers Say" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                        <input #rsTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                          [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', rsTitleAr.value)" />
                      </div>
                    </div>
                  }
                  @case ('Slider') {
                    <div class="space-y-4">
                      <div class="flex items-center gap-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" [checked]="getContent(section)?.autoplay !== false"
                            (change)="setContentField(section, 'autoplay', !(getContent(section)?.autoplay !== false))"
                            class="h-4 w-4 text-primary rounded" />
                          <span class="text-xs font-medium text-text">Autoplay</span>
                        </label>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Interval (ms)</label>
                          <input #slInterval type="number" min="1500" step="500" class="w-28 text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.interval || 5000" (input)="setContentField(section, 'interval', +slInterval.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'slides'); track $index; let i = $index) {
                        <div class="border border-border rounded-md p-3 space-y-2 bg-surface">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-text-muted">Slide {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'slides', i)" class="text-xs text-danger hover:text-danger">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-text mb-1">Image</label>
                              <div class="flex gap-2">
                                <input #slImg type="text" class="flex-1 text-sm px-2 py-1.5 border border-border rounded-md"
                                  [value]="item.imageUrl || ''" (input)="updateArrayItemField(section, 'slides', i, 'imageUrl', slImg.value)" placeholder="Image URL or upload →" />
                                <label class="px-2 py-1.5 text-xs bg-surface-elevated rounded-md cursor-pointer hover:bg-surface-elevated whitespace-nowrap">
                                  Upload
                                  <input type="file" accept="image/*" class="hidden" (change)="uploadArrayItemImage(section, 'slides', i, 'imageUrl', $event)" />
                                </label>
                              </div>
                              @if (item.imageUrl) {
                                <img [src]="item.imageUrl" class="mt-2 h-20 w-full object-cover rounded-md border border-border" alt="Preview" />
                              }
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Link</label>
                              <input #slLink type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.link || ''" (input)="updateArrayItemField(section, 'slides', i, 'link', slLink.value)" placeholder="/products" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Alt text</label>
                              <input #slAlt type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.alt || ''" (input)="updateArrayItemField(section, 'slides', i, 'alt', slAlt.value)" />
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'slides', { imageUrl: '', link: '', alt: '' })"
                        class="text-xs font-medium text-primary hover:text-primary">+ Add Slide</button>
                    </div>
                  }
                  @case ('Video') {
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Video Source</label>
                        <select #vidSrc class="w-full text-sm px-2 py-1.5 border border-border rounded-md bg-surface"
                          [value]="getContent(section)?.source || 'youtube'" (change)="setContentField(section, 'source', vidSrc.value)">
                          <option value="youtube">YouTube</option>
                          <option value="upload">Upload a video</option>
                        </select>
                      </div>
                      @if ((getContent(section)?.source || 'youtube') === 'upload') {
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Video File (MP4/WebM, max 20 MB)</label>
                          <div class="flex items-center gap-2">
                            <label class="px-3 py-1.5 text-xs bg-surface-elevated rounded-md cursor-pointer hover:bg-surface-elevated"
                              [class.opacity-50]="uploadingField() === section.id + ':videoUrl'">
                              @if (uploadingField() === section.id + ':videoUrl') { Uploading… } @else { Choose Video }
                              <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" class="hidden"
                                [disabled]="!!uploadingField()" (change)="uploadVideo(section, $event)" />
                            </label>
                            @if (getContent(section)?.videoUrl) {
                              <span class="text-xs text-success">Video uploaded ✓</span>
                              <button type="button" (click)="setContentField(section, 'videoUrl', '')" class="text-xs text-text-muted hover:text-danger">Remove</button>
                            }
                          </div>
                          @if (videoUploadError()) {
                            <p class="text-xs text-danger mt-1">{{ videoUploadError() }}</p>
                          }
                          @if (getContent(section)?.videoUrl) {
                            <video [src]="getContent(section).videoUrl" class="mt-2 w-full max-h-40 rounded-md border border-border bg-black" controls></video>
                          }
                        </div>
                      } @else {
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">YouTube Video ID or URL</label>
                          <input #vidId type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.videoId || ''" (input)="setContentField(section, 'videoId', vidId.value)" placeholder="dQw4w9WgXcQ or https://youtu.be/…" />
                        </div>
                      }
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Aspect Ratio</label>
                          <select #vidAr class="w-full text-sm px-2 py-1.5 border border-border rounded-md bg-surface"
                            [value]="getContent(section)?.aspectRatio || '16 / 9'" (change)="setContentField(section, 'aspectRatio', vidAr.value)">
                            <option value="16 / 9">16:9 (widescreen)</option>
                            <option value="4 / 3">4:3</option>
                            <option value="1 / 1">1:1 (square)</option>
                            <option value="9 / 16">9:16 (vertical)</option>
                          </select>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer mt-6">
                          <input type="checkbox" [checked]="getContent(section)?.autoplay === true"
                            (change)="setContentField(section, 'autoplay', !(getContent(section)?.autoplay === true))"
                            class="h-4 w-4 text-primary rounded" />
                          <span class="text-xs font-medium text-text" title="Browsers only allow autoplay when muted">Autoplay when opened (muted)</span>
                        </label>
                      </div>
                    </div>
                  }
                  @case ('AnnouncementBar') {
                    <div class="space-y-3">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Text (EN)</label>
                          <input #anEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.text?.en || ''" (input)="setContentBilingual(section, 'text', 'en', anEn.value)" placeholder="Free shipping on orders over 500!" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Text (AR)</label>
                          <input #anAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.text?.ar || ''" (input)="setContentBilingual(section, 'text', 'ar', anAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Link (optional)</label>
                          <input #anLink type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.link || ''" (input)="setContentField(section, 'link', anLink.value)" placeholder="/products" />
                        </div>
                        <div class="flex gap-3">
                          <div>
                            <label class="block text-xs font-medium text-text mb-1">Background</label>
                            <input #anBg type="color" class="h-8 w-12 rounded border border-border cursor-pointer p-0"
                              [value]="getContent(section)?.bg || '#111827'" (input)="setContentField(section, 'bg', anBg.value)" />
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-text mb-1">Text Color</label>
                            <input #anTc type="color" class="h-8 w-12 rounded border border-border cursor-pointer p-0"
                              [value]="getContent(section)?.textColor || '#ffffff'" (input)="setContentField(section, 'textColor', anTc.value)" />
                          </div>
                        </div>
                      </div>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" [checked]="getContent(section)?.dismissible === true"
                          (change)="setContentField(section, 'dismissible', !(getContent(section)?.dismissible === true))"
                          class="h-4 w-4 text-primary rounded" />
                        <span class="text-xs font-medium text-text">Allow visitors to dismiss</span>
                      </label>
                    </div>
                  }
                  @case ('Countdown') {
                    <div class="space-y-3">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                          <input #cdTEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', cdTEn.value)" placeholder="Hurry, offer ends in" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                          <input #cdTAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', cdTAr.value)" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Timer Type</label>
                          <select #cdMode class="w-full text-sm px-2 py-1.5 border border-border rounded-md bg-surface"
                            [value]="getContent(section)?.mode || 'fixed'" (change)="setContentField(section, 'mode', cdMode.value)">
                            <option value="fixed">Fixed date</option>
                            <option value="evergreen">Evergreen (per visitor)</option>
                          </select>
                        </div>
                        @if ((getContent(section)?.mode || 'fixed') === 'evergreen') {
                          <div>
                            <label class="block text-xs font-medium text-text mb-1">Duration (minutes)</label>
                            <input #cdDur type="number" min="1" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                              [value]="getContent(section)?.durationMinutes || 60" (input)="setContentField(section, 'durationMinutes', +cdDur.value)" />
                          </div>
                        } @else {
                          <div>
                            <label class="block text-xs font-medium text-text mb-1">Ends At</label>
                            <input #cdEnds type="datetime-local" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                              [value]="getContent(section)?.endsAt || ''" (input)="setContentField(section, 'endsAt', cdEnds.value)" />
                          </div>
                        }
                      </div>
                      @if ((getContent(section)?.mode || 'fixed') === 'evergreen') {
                        <p class="text-[11px] text-text-muted">Evergreen: each visitor's timer starts on their first visit and counts down the set duration.</p>
                      }
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">When expired</label>
                        <select #cdExp class="w-full text-sm px-2 py-1.5 border border-border rounded-md bg-surface"
                          [value]="getContent(section)?.expiredBehavior || 'message'" (change)="setContentField(section, 'expiredBehavior', cdExp.value)">
                          <option value="message">Show a message</option>
                          <option value="hide">Hide the section</option>
                        </select>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Expired Text (EN)</label>
                          <input #cdExEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.expiredText?.en || ''" (input)="setContentBilingual(section, 'expiredText', 'en', cdExEn.value)" placeholder="Offer ended" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Expired Text (AR)</label>
                          <input #cdExAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.expiredText?.ar || ''" (input)="setContentBilingual(section, 'expiredText', 'ar', cdExAr.value)" />
                        </div>
                      </div>
                    </div>
                  }
                  @case ('RichText') {
                    <div class="space-y-3">
                      <p class="text-xs text-text-muted">Format text with the toolbar — no HTML needed. Content is sanitized on render.</p>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Content (EN)</label>
                        <app-rich-text-editor
                          [value]="getContent(section)?.html?.en || ''"
                          placeholder="Write your content…"
                          (valueChange)="setContentBilingual(section, 'html', 'en', $event)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Content (AR)</label>
                        <app-rich-text-editor
                          dir="rtl"
                          [value]="getContent(section)?.html?.ar || ''"
                          placeholder="اكتب المحتوى…"
                          (valueChange)="setContentBilingual(section, 'html', 'ar', $event)" />
                      </div>
                    </div>
                  }
                  @case ('CtaButton') {
                    <div class="space-y-3">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Button Text (EN)</label>
                          <input #cbEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.text?.en || ''" (input)="setContentBilingual(section, 'text', 'en', cbEn.value)" placeholder="Buy Now" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Button Text (AR)</label>
                          <input #cbAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.text?.ar || ''" (input)="setContentBilingual(section, 'text', 'ar', cbAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Style</label>
                          <select #cbStyle class="w-full text-sm px-2 py-1.5 border border-border rounded-md bg-surface"
                            [value]="getContent(section)?.style || 'primary'" (change)="setContentField(section, 'style', cbStyle.value)">
                            <option value="primary">Primary (filled)</option>
                            <option value="outline">Outline</option>
                            <option value="dark">Dark</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Action</label>
                          <select #cbAction class="w-full text-sm px-2 py-1.5 border border-border rounded-md bg-surface"
                            [value]="getContent(section)?.action || 'link'" (change)="setContentField(section, 'action', cbAction.value)">
                            <option value="link">Go to link</option>
                            <option value="anchor">Scroll to section</option>
                            <option value="whatsapp">Open WhatsApp</option>
                            <option value="phone">Call phone</option>
                          </select>
                        </div>
                        @switch (getContent(section)?.action || 'link') {
                          @case ('whatsapp') {
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">WhatsApp Number</label>
                              <input #cbWa type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="getContent(section)?.whatsapp || ''" (input)="setContentField(section, 'whatsapp', cbWa.value)" placeholder="201000000000 (country code, no +)" />
                            </div>
                            <div class="col-span-2 grid grid-cols-2 gap-3">
                              <div>
                                <label class="block text-xs font-medium text-text mb-1">Prefilled Message (EN)</label>
                                <input #cbMsgEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                  [value]="getContent(section)?.message?.en || ''" (input)="setContentBilingual(section, 'message', 'en', cbMsgEn.value)" placeholder="I'd like to order…" />
                              </div>
                              <div>
                                <label class="block text-xs font-medium text-text mb-1">Prefilled Message (AR)</label>
                                <input #cbMsgAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                  [value]="getContent(section)?.message?.ar || ''" (input)="setContentBilingual(section, 'message', 'ar', cbMsgAr.value)" />
                              </div>
                            </div>
                          }
                          @case ('phone') {
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Phone Number</label>
                              <input #cbPhone type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="getContent(section)?.phone || ''" (input)="setContentField(section, 'phone', cbPhone.value)" placeholder="+20 100 000 0000" />
                            </div>
                          }
                          @case ('anchor') {
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Scroll-to Anchor ID</label>
                              <input #cbAnchor type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="getContent(section)?.anchor || ''" (input)="setContentField(section, 'anchor', cbAnchor.value)" placeholder="order-form" />
                            </div>
                          }
                          @default {
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Link</label>
                              <input #cbLink type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="getContent(section)?.link || ''" (input)="setContentField(section, 'link', cbLink.value)" placeholder="/products" />
                            </div>
                          }
                        }
                      </div>
                    </div>
                  }
                  @case ('Stats') {
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                          <input #stTEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', stTEn.value)" placeholder="Trusted by thousands" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                          <input #stTAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', stTAr.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'items'); track $index; let i = $index) {
                        <div class="border border-border rounded-md p-3 space-y-2 bg-surface">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-text-muted">Stat {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'items', i)" class="text-xs text-danger hover:text-danger">Remove</button>
                          </div>
                          <div class="grid grid-cols-3 gap-2">
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Prefix</label>
                              <input #stPre type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.prefix || ''" (input)="updateArrayItemField(section, 'items', i, 'prefix', stPre.value)" placeholder="+" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Value</label>
                              <input #stVal type="number" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.value || 0" (input)="updateArrayItemField(section, 'items', i, 'value', +stVal.value)" placeholder="10000" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Suffix</label>
                              <input #stSuf type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.suffix || ''" (input)="updateArrayItemField(section, 'items', i, 'suffix', stSuf.value)" placeholder="+" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Label (EN)</label>
                              <input #stLEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.label?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'label', 'en', stLEn.value)" placeholder="Happy customers" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Label (AR)</label>
                              <input #stLAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.label?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'label', 'ar', stLAr.value)" />
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'items', { prefix: '', value: 0, suffix: '+', label: { en: '', ar: '' } })"
                        class="text-xs font-medium text-primary hover:text-primary">+ Add Stat</button>
                    </div>
                  }
                  @case ('Comparison') {
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                          <input #cmTEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', cmTEn.value)" placeholder="Why choose us" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                          <input #cmTAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', cmTAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Our Column (EN)</label>
                          <input #cmUsEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.usLabel?.en || ''" (input)="setContentBilingual(section, 'usLabel', 'en', cmUsEn.value)" placeholder="Us" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Their Column (EN)</label>
                          <input #cmThEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.themLabel?.en || ''" (input)="setContentBilingual(section, 'themLabel', 'en', cmThEn.value)" placeholder="Others" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Our Column (AR)</label>
                          <input #cmUsAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.usLabel?.ar || ''" (input)="setContentBilingual(section, 'usLabel', 'ar', cmUsAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Their Column (AR)</label>
                          <input #cmThAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.themLabel?.ar || ''" (input)="setContentBilingual(section, 'themLabel', 'ar', cmThAr.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'rows'); track $index; let i = $index) {
                        <div class="border border-border rounded-md p-3 space-y-2 bg-surface">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-text-muted">Row {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'rows', i)" class="text-xs text-danger hover:text-danger">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-2">
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Feature (EN)</label>
                              <input #cmFEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.feature?.en || ''" (input)="updateArrayItemBilingual(section, 'rows', i, 'feature', 'en', cmFEn.value)" placeholder="Free delivery" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Feature (AR)</label>
                              <input #cmFAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.feature?.ar || ''" (input)="updateArrayItemBilingual(section, 'rows', i, 'feature', 'ar', cmFAr.value)" />
                            </div>
                          </div>
                          <div class="flex items-center gap-4">
                            <label class="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" [checked]="item.us !== false" (change)="updateArrayItemField(section, 'rows', i, 'us', !(item.us !== false))" class="h-4 w-4 text-primary rounded" />
                              <span class="text-xs text-text-muted">We have it</span>
                            </label>
                            <label class="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" [checked]="item.them === true" (change)="updateArrayItemField(section, 'rows', i, 'them', !(item.them === true))" class="h-4 w-4 text-primary rounded" />
                              <span class="text-xs text-text-muted">They have it</span>
                            </label>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'rows', { feature: { en: '', ar: '' }, us: true, them: false })"
                        class="text-xs font-medium text-primary hover:text-primary">+ Add Row</button>
                    </div>
                  }
                  @case ('BeforeAfter') {
                    <div class="space-y-3">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Before Image</label>
                          <div class="flex gap-2">
                            <input #baBefore type="text" class="flex-1 text-sm px-2 py-1.5 border border-border rounded-md"
                              [value]="getContent(section)?.beforeUrl || ''" (input)="setContentField(section, 'beforeUrl', baBefore.value)" placeholder="Before URL" />
                            <label class="px-2 py-1.5 text-xs bg-surface-elevated rounded-md cursor-pointer hover:bg-surface-elevated">Upload
                              <input type="file" accept="image/*" class="hidden" (change)="uploadImage(section, 'beforeUrl', $event)" />
                            </label>
                          </div>
                          @if (getContent(section)?.beforeUrl) {
                            <img [src]="getContent(section).beforeUrl" class="mt-2 h-20 w-full object-cover rounded-md border border-border" alt="Before" />
                          }
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">After Image</label>
                          <div class="flex gap-2">
                            <input #baAfter type="text" class="flex-1 text-sm px-2 py-1.5 border border-border rounded-md"
                              [value]="getContent(section)?.afterUrl || ''" (input)="setContentField(section, 'afterUrl', baAfter.value)" placeholder="After URL" />
                            <label class="px-2 py-1.5 text-xs bg-surface-elevated rounded-md cursor-pointer hover:bg-surface-elevated">Upload
                              <input type="file" accept="image/*" class="hidden" (change)="uploadImage(section, 'afterUrl', $event)" />
                            </label>
                          </div>
                          @if (getContent(section)?.afterUrl) {
                            <img [src]="getContent(section).afterUrl" class="mt-2 h-20 w-full object-cover rounded-md border border-border" alt="After" />
                          }
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Before Label (EN)</label>
                          <input #baBLEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.beforeLabel?.en || ''" (input)="setContentBilingual(section, 'beforeLabel', 'en', baBLEn.value)" placeholder="Before" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">After Label (EN)</label>
                          <input #baALEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.afterLabel?.en || ''" (input)="setContentBilingual(section, 'afterLabel', 'en', baALEn.value)" placeholder="After" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Before Label (AR)</label>
                          <input #baBLAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.beforeLabel?.ar || ''" (input)="setContentBilingual(section, 'beforeLabel', 'ar', baBLAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">After Label (AR)</label>
                          <input #baALAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.afterLabel?.ar || ''" (input)="setContentBilingual(section, 'afterLabel', 'ar', baALAr.value)" />
                        </div>
                      </div>
                    </div>
                  }
                  @case ('Image') {
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Image</label>
                        <div class="flex gap-2">
                          <input #imgUrl type="text" class="flex-1 text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.imageUrl || ''" (input)="setContentField(section, 'imageUrl', imgUrl.value)" placeholder="Image URL or upload →" />
                          <label class="px-2 py-1.5 text-xs bg-surface-elevated rounded-md cursor-pointer hover:bg-surface-elevated whitespace-nowrap"
                            [class.opacity-50]="uploadingField() === section.id + ':imageUrl'">
                            @if (uploadingField() === section.id + ':imageUrl') { Uploading… } @else { Upload }
                            <input type="file" accept="image/*" class="hidden" [disabled]="!!uploadingField()" (change)="uploadImage(section, 'imageUrl', $event)" />
                          </label>
                        </div>
                        @if (getContent(section)?.imageUrl) {
                          <img [src]="getContent(section).imageUrl" class="mt-2 w-full max-h-48 object-contain rounded-md border border-border bg-surface-elevated" alt="Preview" />
                        }
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Link (optional)</label>
                          <input #imgLink type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.link || ''" (input)="setContentField(section, 'link', imgLink.value)" placeholder="/products or https://…" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Alt text (SEO)</label>
                          <input #imgAlt type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.alt || ''" (input)="setContentField(section, 'alt', imgAlt.value)" placeholder="Describe the image" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Caption (EN)</label>
                          <input #imgCapEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.caption?.en || ''" (input)="setContentBilingual(section, 'caption', 'en', imgCapEn.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Caption (AR)</label>
                          <input #imgCapAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.caption?.ar || ''" (input)="setContentBilingual(section, 'caption', 'ar', imgCapAr.value)" />
                        </div>
                      </div>
                    </div>
                  }
                  @case ('Specs') {
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                          <input #spTEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', spTEn.value)" placeholder="Specifications" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                          <input #spTAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', spTAr.value)" placeholder="المواصفات" />
                        </div>
                      </div>

                      @for (group of getSpecGroups(section); track $index; let gi = $index) {
                        <div class="border border-border rounded-md p-3 space-y-2 bg-surface">
                          <div class="flex items-center gap-2">
                            <input #spGEn type="text" class="flex-1 text-sm px-2 py-1.5 border border-border rounded-md font-medium"
                              [value]="group.name?.en || ''" (input)="setSpecGroupName(section, gi, 'en', spGEn.value)" placeholder="Group (EN) e.g. Display" />
                            <input #spGAr type="text" dir="rtl" class="flex-1 text-sm px-2 py-1.5 border border-border rounded-md font-medium"
                              [value]="group.name?.ar || ''" (input)="setSpecGroupName(section, gi, 'ar', spGAr.value)" placeholder="المجموعة" />
                            <button type="button" (click)="removeSpecGroup(section, gi)" class="text-xs text-danger hover:text-danger whitespace-nowrap">Remove group</button>
                          </div>
                          @for (row of group.rows || []; track $index; let ri = $index) {
                            <div class="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center ps-2 border-s-2 border-border">
                              <input #spLEn type="text" class="text-sm px-2 py-1 border border-border rounded-md"
                                [value]="row.label?.en || ''" (input)="setSpecRow(section, gi, ri, 'label', 'en', spLEn.value)" placeholder="Label (EN)" />
                              <input #spLAr type="text" dir="rtl" class="text-sm px-2 py-1 border border-border rounded-md"
                                [value]="row.label?.ar || ''" (input)="setSpecRow(section, gi, ri, 'label', 'ar', spLAr.value)" placeholder="التسمية" />
                              <input #spVEn type="text" class="text-sm px-2 py-1 border border-border rounded-md"
                                [value]="row.value?.en || ''" (input)="setSpecRow(section, gi, ri, 'value', 'en', spVEn.value)" placeholder="Value (EN)" />
                              <input #spVAr type="text" dir="rtl" class="text-sm px-2 py-1 border border-border rounded-md"
                                [value]="row.value?.ar || ''" (input)="setSpecRow(section, gi, ri, 'value', 'ar', spVAr.value)" placeholder="القيمة" />
                              <button type="button" (click)="removeSpecRow(section, gi, ri)" class="text-xs text-danger hover:text-danger px-1">✕</button>
                            </div>
                          }
                          <button type="button" (click)="addSpecRow(section, gi)" class="text-xs font-medium text-primary hover:text-primary">+ Add Row</button>
                        </div>
                      }
                      <button type="button" (click)="addSpecGroup(section)" class="text-xs font-medium text-primary hover:text-primary">+ Add Group</button>
                    </div>
                  }
                  @case ('Marquee') {
                    <div class="space-y-4">
                      <p class="text-[11px] text-text-muted">A bar with text that scrolls forever. Direction follows the store language automatically.</p>
                      <div class="grid grid-cols-3 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Speed</label>
                          <select #mqSpeed class="w-full text-sm px-2 py-1.5 border border-border rounded-md bg-surface"
                            [value]="getContent(section)?.speed || 'normal'" (change)="setContentField(section, 'speed', mqSpeed.value)">
                            <option value="slow">Slow</option>
                            <option value="normal">Normal</option>
                            <option value="fast">Fast</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Background</label>
                          <input #mqBg type="color" class="h-8 w-full rounded border border-border cursor-pointer p-0.5"
                            [value]="getContent(section)?.bg || '#111827'" (input)="setContentField(section, 'bg', mqBg.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Text Color</label>
                          <input #mqTc type="color" class="h-8 w-full rounded border border-border cursor-pointer p-0.5"
                            [value]="getContent(section)?.textColor || '#ffffff'" (input)="setContentField(section, 'textColor', mqTc.value)" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Separator</label>
                        <input #mqSep type="text" class="w-24 text-sm px-2 py-1.5 border border-border rounded-md text-center"
                          [value]="getContent(section)?.separator || ''" (input)="setContentField(section, 'separator', mqSep.value)" placeholder="•" />
                      </div>
                      @for (item of getContentArray(section, 'messages'); track $index; let i = $index) {
                        <div class="border border-border rounded-md p-3 space-y-2 bg-surface">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-text-muted">Message {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'messages', i)" class="text-xs text-danger hover:text-danger">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-2">
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Text (EN)</label>
                              <input #mqEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.text?.en || ''" (input)="updateArrayItemBilingual(section, 'messages', i, 'text', 'en', mqEn.value)" placeholder="Free shipping over 500!" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Text (AR)</label>
                              <input #mqAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.text?.ar || ''" (input)="updateArrayItemBilingual(section, 'messages', i, 'text', 'ar', mqAr.value)" />
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'messages', { text: { en: '', ar: '' } })"
                        class="text-xs font-medium text-primary hover:text-primary">+ Add Message</button>
                    </div>
                  }
                  @case ('OrderForm') {
                    <div class="space-y-3">
                      <p class="text-[11px] text-text-muted">Adds the product to cart; "Buy Now" goes to checkout.</p>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Product</label>
                        <select #ofProd class="w-full text-sm px-2 py-1.5 border border-border rounded-md bg-surface"
                          [value]="getContent(section)?.productSlug || ''" (change)="setContentField(section, 'productSlug', ofProd.value)">
                          <option value="">Use the page's product (product pages only)</option>
                          @for (p of productOptions(); track p.slug) {
                            <option [value]="p.slug">{{ p.name }}</option>
                          }
                        </select>
                        <p class="text-[11px] text-text-muted mt-1">Pick a product to use this on the home page or a custom page. On a product page, leave it to use that product.</p>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Heading (EN)</label>
                          <input #ofHEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.heading?.en || ''" (input)="setContentBilingual(section, 'heading', 'en', ofHEn.value)" placeholder="Order now" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Heading (AR)</label>
                          <input #ofHAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.heading?.ar || ''" (input)="setContentBilingual(section, 'heading', 'ar', ofHAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Button Text (EN)</label>
                          <input #ofBEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.buttonText?.en || ''" (input)="setContentBilingual(section, 'buttonText', 'en', ofBEn.value)" placeholder="Buy Now" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Button Text (AR)</label>
                          <input #ofBAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.buttonText?.ar || ''" (input)="setContentBilingual(section, 'buttonText', 'ar', ofBAr.value)" />
                        </div>
                      </div>
                      <div class="flex items-center gap-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" [checked]="getContent(section)?.showImage !== false"
                            (change)="setContentField(section, 'showImage', !(getContent(section)?.showImage !== false))" class="h-4 w-4 text-primary rounded" />
                          <span class="text-xs font-medium text-text">Show product image</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" [checked]="getContent(section)?.showQuantity !== false"
                            (change)="setContentField(section, 'showQuantity', !(getContent(section)?.showQuantity !== false))" class="h-4 w-4 text-primary rounded" />
                          <span class="text-xs font-medium text-text">Show quantity selector</span>
                        </label>
                      </div>
                    </div>
                  }
                  @case ('StickyBar') {
                    <div class="space-y-3">
                      <p class="text-[11px] text-text-muted">Pinned to the bottom on mobile only.</p>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Product</label>
                        <select #sbProd class="w-full text-sm px-2 py-1.5 border border-border rounded-md bg-surface"
                          [value]="getContent(section)?.productSlug || ''" (change)="setContentField(section, 'productSlug', sbProd.value)">
                          <option value="">Use the page's product (product pages only)</option>
                          @for (p of productOptions(); track p.slug) {
                            <option [value]="p.slug">{{ p.name }}</option>
                          }
                        </select>
                        <p class="text-[11px] text-text-muted mt-1">Pick a product to use this on the home page or a custom page.</p>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Button Text (EN)</label>
                          <input #sbBEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.buttonText?.en || ''" (input)="setContentBilingual(section, 'buttonText', 'en', sbBEn.value)" placeholder="Buy Now" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Button Text (AR)</label>
                          <input #sbBAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.buttonText?.ar || ''" (input)="setContentBilingual(section, 'buttonText', 'ar', sbBAr.value)" />
                        </div>
                      </div>
                    </div>
                  }
                  @case ('Bundle') {
                    <div class="space-y-4">
                      <p class="text-[11px] text-text-muted">Quantity tiers add N of the product to the cart. The badge is marketing text — actual per-bundle discounts still need a promo rule.</p>
                      <div>
                        <label class="block text-xs font-medium text-text mb-1">Product</label>
                        <select #buProd class="w-full text-sm px-2 py-1.5 border border-border rounded-md bg-surface"
                          [value]="getContent(section)?.productSlug || ''" (change)="setContentField(section, 'productSlug', buProd.value)">
                          <option value="">Use the page's product (product pages only)</option>
                          @for (p of productOptions(); track p.slug) {
                            <option [value]="p.slug">{{ p.name }}</option>
                          }
                        </select>
                        <p class="text-[11px] text-text-muted mt-1">Pick a product to use this on the home page or a custom page.</p>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (EN)</label>
                          <input #buTEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', buTEn.value)" placeholder="Choose your bundle" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-text mb-1">Title (AR)</label>
                          <input #buTAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', buTAr.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'tiers'); track $index; let i = $index) {
                        <div class="border border-border rounded-md p-3 space-y-2 bg-surface">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-text-muted">Tier {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'tiers', i)" class="text-xs text-danger hover:text-danger">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-2">
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Quantity</label>
                              <input #buQty type="number" min="1" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.qty || 1" (input)="updateArrayItemField(section, 'tiers', i, 'qty', +buQty.value)" />
                            </div>
                            <label class="flex items-center gap-2 cursor-pointer mt-6">
                              <input type="checkbox" [checked]="item.highlight === true" (change)="updateArrayItemField(section, 'tiers', i, 'highlight', !(item.highlight === true))" class="h-4 w-4 text-primary rounded" />
                              <span class="text-xs text-text-muted">Highlight (best value)</span>
                            </label>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Label (EN)</label>
                              <input #buLEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.label?.en || ''" (input)="updateArrayItemBilingual(section, 'tiers', i, 'label', 'en', buLEn.value)" placeholder="Buy 2" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Label (AR)</label>
                              <input #buLAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.label?.ar || ''" (input)="updateArrayItemBilingual(section, 'tiers', i, 'label', 'ar', buLAr.value)" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Badge (EN)</label>
                              <input #buBEn type="text" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.badge?.en || ''" (input)="updateArrayItemBilingual(section, 'tiers', i, 'badge', 'en', buBEn.value)" placeholder="Most popular" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-text mb-1">Badge (AR)</label>
                              <input #buBAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-border rounded-md"
                                [value]="item.badge?.ar || ''" (input)="updateArrayItemBilingual(section, 'tiers', i, 'badge', 'ar', buBAr.value)" />
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'tiers', { qty: 1, label: { en: '', ar: '' }, badge: { en: '', ar: '' }, highlight: false })"
                        class="text-xs font-medium text-primary hover:text-primary">+ Add Tier</button>
                    </div>
                  }
                  @default {
                    <p class="text-xs text-text-muted py-2">There is nothing to fill in here — this section builds itself from your store's own content.</p>
                  }
                }
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
      <!-- How this page looks in search results -->
      <div class="px-6 py-5 bg-surface-elevated rounded-t-lg">
        <h4 class="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          How this page appears in search results
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-text mb-1">
              Meta Title (EN)
              <span class="ms-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-success/10 text-success" title="This field impacts search engine rankings">SEO</span>
            </label>
            <input
              type="text"
              [(ngModel)]="localSeoSettings.metaTitle.english"
              placeholder="Page title for search engines"
              class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text mb-1">
              Meta Title (AR)
              <span class="ms-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-success/10 text-success" title="This field impacts search engine rankings">SEO</span>
            </label>
            <input
              type="text"
              dir="rtl"
              [(ngModel)]="localSeoSettings.metaTitle.arabic"
              placeholder="عنوان الصفحة لمحركات البحث"
              class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text mb-1">
              Meta Description (EN)
              <span class="ms-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-success/10 text-success" title="This field impacts search engine rankings">SEO</span>
            </label>
            <textarea
              rows="2"
              [(ngModel)]="localSeoSettings.metaDescription.english"
              placeholder="Brief description of this page (150–160 chars recommended)"
              class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
            ></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-text mb-1">
              Meta Description (AR)
              <span class="ms-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-success/10 text-success" title="This field impacts search engine rankings">SEO</span>
            </label>
            <textarea
              rows="2"
              dir="rtl"
              [(ngModel)]="localSeoSettings.metaDescription.arabic"
              placeholder="وصف مختصر للصفحة"
              class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
            ></textarea>
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-text mb-1">OG Image URL</label>
            <input
              type="text"
              [(ngModel)]="localSeoSettings.ogImageUrl"
              placeholder="https://... (used when sharing on social media)"
              class="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="localSeoSettings.noIndex" class="h-4 w-4 text-primary rounded" />
              <span class="text-xs font-medium text-text">No Index</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="localSeoSettings.noFollow" class="h-4 w-4 text-primary rounded" />
              <span class="text-xs font-medium text-text">No Follow</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <button
            (click)="exportJson()"
            class="px-3 py-2 text-sm bg-surface-elevated text-text rounded-md hover:bg-surface-elevated flex items-center gap-1.5"
            title="Download this page's sections as a JSON template"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Export
          </button>
          <label
            class="px-3 py-2 text-sm bg-surface-elevated text-text rounded-md hover:bg-surface-elevated flex items-center gap-1.5 cursor-pointer"
            title="Load sections from a JSON template (replaces current, not saved until you Save)"
          >
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
          <button
            type="button"
            (click)="onClose()"
            class="px-4 py-2 bg-surface-elevated text-text rounded-md hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border"
          >
            Discard and go back
          </button>
          <button
            type="button"
            (click)="onSave()"
            class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
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
              <button
                type="button"
                (click)="applyPageTemplate(tpl)"
                class="rounded-lg border-2 border-border p-3 text-start transition-colors hover:border-primary hover:bg-primary-tint focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
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
  uploadingField = signal<string | null>(null);
  importErr = signal<string | null>(null);
  videoUploadError = signal<string | null>(null);

  /** Id of the section whose settings modal is open, if any. */
  private editingSectionId = signal<string | null>(null);
  editingSection = computed<SectionConfigurationDto | null>(() => {
    const id = this.editingSectionId();
    return id === null ? null : this.localSections().find(s => s.id === id) ?? null;
  });

  private canvas = viewChild(SectionCanvasComponent);

  readonly dragState = inject(BuilderDragStateService);
  readonly pageTemplates = PAGE_TEMPLATES;

  private mediaService = inject(MediaService);
  private productService = inject(ProductService);
  private previewData = inject(SectionPreviewDataService);

  /** Products for the product-bound section pickers (Order Form / Bundle / Sticky Bar). */
  productOptions = signal<{ slug: string; name: string }[]>([]);

  /** 5x5 anchor grid ("row-col", 1-based) for Media+Text "over image" text placement, in visual row order. */
  readonly overlayPositions = Array.from({ length: 25 }, (_, i) => `${Math.floor(i / 5) + 1}-${(i % 5) + 1}`);

  /** Legacy 3x3 named positions (e.g. "bottom-left") map onto the true-center-aligned 5x5 tracks. */
  private readonly legacyOverlayRow: Record<string, number> = { top: 1, center: 3, bottom: 5 };
  private readonly legacyOverlayCol: Record<string, number> = { left: 1, center: 3, right: 5 };

  /** Row indices (into localSections' Media+Text items) currently waiting for their second ("end") click. */
  private pickingEndForRow = signal<Set<number>>(new Set());

  /** Single-grid start/end picker: first click sets a 1x1 box and arms the row for
   *  an extend-click; a second click sizes the box to span between the two cells;
   *  clicking again after that starts a brand new selection. */
  selectOverlayCell(section: SectionConfigurationDto, rowIndex: number, pos: string): void {
    const picking = this.pickingEndForRow();
    const next = new Set(picking);
    if (picking.has(rowIndex)) {
      this.updateArrayItemField(section, 'items', rowIndex, 'overlayEndPosition', pos);
      next.delete(rowIndex);
    } else {
      this.updateArrayItemField(section, 'items', rowIndex, 'overlayPosition', pos);
      this.updateArrayItemField(section, 'items', rowIndex, 'overlayEndPosition', pos);
      next.add(rowIndex);
    }
    this.pickingEndForRow.set(next);
  }

  /** Parses "row-col" (new numeric format) or falls back to legacy named positions like "bottom-left". */
  private splitOverlayPosition(pos: string): { row: number; col: number } {
    const [a, b] = (pos || '').split('-');
    const row = Number(a), col = Number(b);
    if (!isNaN(row) && !isNaN(col)) return { row, col };
    return { row: this.legacyOverlayRow[a] ?? 3, col: this.legacyOverlayCol[b || 'center'] ?? 3 };
  }

  isOverlayEndpoint(item: any, pos: string): boolean {
    const start = this.splitOverlayPosition(item.overlayPosition || 'bottom-left');
    const end = this.splitOverlayPosition(item.overlayEndPosition || item.overlayPosition || 'bottom-left');
    const cur = this.splitOverlayPosition(pos);
    return (cur.row === start.row && cur.col === start.col) || (cur.row === end.row && cur.col === end.col);
  }

  isInOverlaySpan(item: any, pos: string): boolean {
    const start = this.splitOverlayPosition(item.overlayPosition || 'bottom-left');
    const end = this.splitOverlayPosition(item.overlayEndPosition || item.overlayPosition || 'bottom-left');
    const cur = this.splitOverlayPosition(pos);

    const rowLo = Math.min(start.row, end.row);
    const rowHi = Math.max(start.row, end.row);
    const colLo = Math.min(start.col, end.col);
    const colHi = Math.max(start.col, end.col);

    return cur.row >= rowLo && cur.row <= rowHi && cur.col >= colLo && cur.col <= colHi;
  }

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

  /** Serialized state as last loaded or saved, for the unsaved-changes guard. */
  private baseline = '';

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

  private loadProductOptions(): void {
    const storeId = this.page?.storeId;
    if (!storeId) return;
    this.productService.getProducts(storeId, { limit: 200 }).subscribe({
      next: (res) => this.productOptions.set(res.items.map(p => ({ slug: p.slug, name: p.name }))),
      error: () => { /* pickers will show no options */ }
    });
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

  setVariant(section: SectionConfigurationDto, variantId: string): void {
    this.patchSection(section, { variantId });
  }

  /**
   * Swaps in a new object for the edited section, keeping every property the
   * builder does not touch — including the layout settings that used to live in
   * the Design tab — exactly as they were loaded.
   */
  private patchSection(target: SectionConfigurationDto, patch: Partial<SectionConfigurationDto>): void {
    this.localSections.set(
      this.localSections().map(s => s.id === target.id ? { ...s, ...patch } : s)
    );
    this.notifyChange();
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

  // ── Export / Import JSON (Phase E) ──

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
        const parsed = JSON.parse(String(reader.result));
        this.applyImported(parsed);
      } catch {
        this.importErr.set('Invalid JSON file.');
      }
      input.value = '';
    };
    reader.onerror = () => {
      this.importErr.set('Could not read the file.');
      input.value = '';
    };
    reader.readAsText(file);
  }

  private applyImported(parsed: any): void {
    const rawSections = Array.isArray(parsed?.sections) ? parsed.sections : null;
    if (!rawSections) {
      this.importErr.set('File does not contain a "sections" array.');
      return;
    }

    const validTypes = new Set(SECTION_TYPES.map(t => t.key));
    const imported: SectionConfigurationDto[] = [];
    for (const s of rawSections) {
      if (!s || typeof s.sectionType !== 'string' || typeof s.variantId !== 'string') {
        this.importErr.set('One or more sections are missing a type or variant.');
        return;
      }
      if (!validTypes.has(s.sectionType)) {
        this.importErr.set(`Unknown section type: ${s.sectionType}.`);
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

    // Optional SEO settings block.
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

  /**
   * Every edit replaces the section object, so a caller holding an older
   * reference (two setters chained in one handler, for instance) must still read
   * the latest content. Look the section up by id and fall back to what we were
   * given if it is no longer in the list.
   */
  private currentSection(section: SectionConfigurationDto): SectionConfigurationDto {
    return this.localSections().find(s => s.id === section.id) ?? section;
  }

  getContent(section: SectionConfigurationDto): any {
    const json = this.currentSection(section).contentJson;
    try {
      return json ? JSON.parse(json) : {};
    } catch {
      return {};
    }
  }

  setContentField(section: SectionConfigurationDto, field: string, value: any): void {
    const content = this.getContent(section);
    content[field] = value;
    this.patchSection(section, { contentJson: JSON.stringify(content) });
  }

  setContentBilingual(section: SectionConfigurationDto, field: string, lang: 'en' | 'ar', value: string): void {
    const content = this.getContent(section);
    if (!content[field]) content[field] = { en: '', ar: '' };
    content[field][lang] = value;
    this.patchSection(section, { contentJson: JSON.stringify(content) });
  }

  getSettings(section: SectionConfigurationDto): any {
    const json = this.currentSection(section).settingsJson;
    try {
      return json ? JSON.parse(json) : {};
    } catch {
      return {};
    }
  }

  setSettingsField(section: SectionConfigurationDto, field: string, value: any): void {
    const settings = this.getSettings(section);
    if (value === '' || value === null || value === undefined) {
      delete settings[field];
    } else {
      settings[field] = value;
    }
    this.patchSection(section, {
      settingsJson: Object.keys(settings).length ? JSON.stringify(settings) : undefined
    });
  }

  clearSettingsField(section: SectionConfigurationDto, field: string): void {
    this.setSettingsField(section, field, '');
  }

  // ── Repeatable content-array helpers (Benefits / MediaText / Faq items) ──

  getContentArray(section: SectionConfigurationDto, field: string): any[] {
    const content = this.getContent(section);
    return Array.isArray(content[field]) ? content[field] : [];
  }

  private setContentArray(section: SectionConfigurationDto, field: string, items: any[]): void {
    const content = this.getContent(section);
    content[field] = items;
    this.patchSection(section, { contentJson: JSON.stringify(content) });
  }

  addArrayItem(section: SectionConfigurationDto, field: string, template: any): void {
    this.setContentArray(section, field, [...this.getContentArray(section, field), template]);
  }

  removeArrayItem(section: SectionConfigurationDto, field: string, index: number): void {
    this.setContentArray(section, field, this.getContentArray(section, field).filter((_, i) => i !== index));
  }

  updateArrayItemField(section: SectionConfigurationDto, field: string, index: number, key: string, value: any): void {
    const items = [...this.getContentArray(section, field)];
    items[index] = { ...items[index], [key]: value };
    this.setContentArray(section, field, items);
  }

  updateArrayItemBilingual(section: SectionConfigurationDto, field: string, index: number, key: string, lang: 'en' | 'ar', value: string): void {
    const items = [...this.getContentArray(section, field)];
    const item = { ...items[index] };
    item[key] = { ...(item[key] || {}), [lang]: value };
    items[index] = item;
    this.setContentArray(section, field, items);
  }

  // ── Specs table (nested groups → rows) ──

  getSpecGroups(section: SectionConfigurationDto): any[] {
    const g = this.getContent(section).groups;
    return Array.isArray(g) ? g : [];
  }

  private setSpecGroups(section: SectionConfigurationDto, groups: any[]): void {
    const content = this.getContent(section);
    content.groups = groups;
    this.patchSection(section, { contentJson: JSON.stringify(content) });
  }

  addSpecGroup(section: SectionConfigurationDto): void {
    this.setSpecGroups(section, [...this.getSpecGroups(section), { name: { en: '', ar: '' }, rows: [] }]);
  }

  removeSpecGroup(section: SectionConfigurationDto, gi: number): void {
    this.setSpecGroups(section, this.getSpecGroups(section).filter((_, i) => i !== gi));
  }

  setSpecGroupName(section: SectionConfigurationDto, gi: number, lang: 'en' | 'ar', value: string): void {
    const groups = this.getSpecGroups(section).map((g, i) =>
      i === gi ? { ...g, name: { ...(g.name || {}), [lang]: value } } : g);
    this.setSpecGroups(section, groups);
  }

  addSpecRow(section: SectionConfigurationDto, gi: number): void {
    const groups = this.getSpecGroups(section).map((g, i) =>
      i === gi ? { ...g, rows: [...(g.rows || []), { label: { en: '', ar: '' }, value: { en: '', ar: '' } }] } : g);
    this.setSpecGroups(section, groups);
  }

  removeSpecRow(section: SectionConfigurationDto, gi: number, ri: number): void {
    const groups = this.getSpecGroups(section).map((g, i) =>
      i === gi ? { ...g, rows: (g.rows || []).filter((_: any, r: number) => r !== ri) } : g);
    this.setSpecGroups(section, groups);
  }

  setSpecRow(section: SectionConfigurationDto, gi: number, ri: number, key: 'label' | 'value', lang: 'en' | 'ar', value: string): void {
    const groups = this.getSpecGroups(section).map((g, i) => {
      if (i !== gi) return g;
      const rows = (g.rows || []).map((r: any, r2: number) =>
        r2 === ri ? { ...r, [key]: { ...(r[key] || {}), [lang]: value } } : r);
      return { ...g, rows };
    });
    this.setSpecGroups(section, groups);
  }

  uploadArrayItemImage(section: SectionConfigurationDto, field: string, index: number, itemKey: string, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    const storeId = this.page?.storeId;
    if (!file || !storeId) return;

    const key = `${section.id}:${field}:${index}:${itemKey}`;
    this.uploadingField.set(key);

    this.mediaService.uploadImages(storeId, [file]).subscribe({
      next: (result) => {
        if (result.urls?.[0]) {
          this.updateArrayItemField(section, field, index, itemKey, result.urls[0]);
        }
        this.uploadingField.set(null);
        (event.target as HTMLInputElement).value = '';
      },
      error: () => {
        this.uploadingField.set(null);
        (event.target as HTMLInputElement).value = '';
      }
    });
  }

  uploadImage(section: SectionConfigurationDto, field: string, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    const storeId = this.page?.storeId;
    if (!file || !storeId) return;

    const key = `${section.id}:${field}`;
    this.uploadingField.set(key);

    this.mediaService.uploadImages(storeId, [file]).subscribe({
      next: (result) => {
        if (result.urls?.[0]) {
          this.setContentField(section, field, result.urls[0]);
        }
        this.uploadingField.set(null);
        (event.target as HTMLInputElement).value = '';
      },
      error: () => {
        this.uploadingField.set(null);
        (event.target as HTMLInputElement).value = '';
      }
    });
  }

  uploadVideo(section: SectionConfigurationDto, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const storeId = this.page?.storeId;
    if (!file || !storeId) return;

    this.videoUploadError.set(null);
    const MAX = 20 * 1024 * 1024;
    if (file.size > MAX) {
      this.videoUploadError.set('Video exceeds the 20 MB limit.');
      input.value = '';
      return;
    }

    const key = `${section.id}:videoUrl`;
    this.uploadingField.set(key);

    this.mediaService.uploadVideo(storeId, file).subscribe({
      next: (result) => {
        if (result.url) {
          this.setContentField(section, 'videoUrl', result.url);
          this.setContentField(section, 'source', 'upload');
        }
        this.uploadingField.set(null);
        input.value = '';
      },
      error: (err) => {
        this.uploadingField.set(null);
        this.videoUploadError.set(err?.error?.message || 'Failed to upload video.');
        input.value = '';
      }
    });
  }

  onSave(): void {
    this.save.emit({ sections: this.localSections(), seoSettings: this.localSeoSettings });
  }

  onClose(): void {
    this.close.emit();
  }
}
