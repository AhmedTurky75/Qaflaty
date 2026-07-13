import { Component, Input, Output, EventEmitter, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PageConfigurationDto, SectionConfigurationDto, PageSeoSettings } from 'shared';
import { MediaService } from '../products/services/media.service';
import { ProductService } from '../products/services/product.service';
import { RichTextEditorComponent } from './rich-text-editor.component';

interface SectionVariant {
  id: string;
  label: string;
}

interface SectionTypeInfo {
  key: string;
  label: string;
  description: string;
  defaultVariantId: string;
}

interface SectionPreset {
  key: string;
  label: string;
  description: string;
  sectionType: string;
  variantId: string;
  content?: unknown;
  settings?: unknown;
}

interface PageTemplate {
  key: string;
  label: string;
  description: string;
  sections: Array<{ sectionType: string; variantId: string; content?: unknown; settings?: unknown }>;
}

@Component({
  selector: 'app-section-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, RichTextEditorComponent],
  template: `
    <div class="bg-white rounded-lg shadow">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              Edit Sections: {{ page?.title?.english }}
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              Configure the sections displayed on this page
            </p>
          </div>
          <button (click)="onClose()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Sections List -->
      <div class="p-6 space-y-3 max-h-[560px] overflow-y-auto">
        <div cdkDropList (cdkDropListDropped)="onDrop($event)" class="space-y-3">
        @for (section of localSections; track section.id; let idx = $index) {
          <div cdkDrag [cdkDragDisabled]="isExpanded(section.id)" class="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <!-- Drag placeholder shown in the drop gap -->
            <div class="h-16 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg" *cdkDragPlaceholder></div>
            <!-- Section Row Header -->
            <div class="p-4 flex items-start gap-3 bg-white">
              <!-- Drag Handle -->
              <button
                type="button"
                cdkDragHandle
                class="pt-1 text-gray-300 hover:text-gray-500 cursor-move disabled:cursor-not-allowed disabled:opacity-30"
                [disabled]="isExpanded(section.id)"
                [title]="isExpanded(section.id) ? 'Collapse to reorder' : 'Drag to reorder'"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 4a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2zM13 4a1 1 0 100 2 1 1 0 000-2zM13 9a1 1 0 100 2 1 1 0 000-2zM13 14a1 1 0 100 2 1 1 0 000-2z"></path>
                </svg>
              </button>

              <!-- Section Details -->
              <div class="flex-1 space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-semibold text-gray-900">
                    {{ getSectionTypeLabel(section.sectionType) }}
                    <span class="ml-2 text-xs text-gray-400 font-normal">#{{ section.sortOrder }}</span>
                  </h4>
                  <div class="flex items-center gap-3">
                    <!-- Enabled Toggle -->
                    <label class="flex items-center gap-1.5 cursor-pointer">
                      <span class="text-xs font-medium text-gray-600">Enabled</span>
                      <input
                        type="checkbox"
                        [(ngModel)]="section.isEnabled"
                        (ngModelChange)="notifyChange()"
                        class="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                    <!-- Expand/Collapse -->
                    <button
                      (click)="toggleExpanded(section.id)"
                      class="text-gray-400 hover:text-blue-600 transition-colors"
                      [title]="isExpanded(section.id) ? 'Collapse' : 'Expand to edit content'"
                    >
                      <svg class="w-4 h-4 transition-transform" [class.rotate-180]="isExpanded(section.id)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <!-- Duplicate -->
                    <button
                      (click)="duplicateSection(idx)"
                      class="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Duplicate section"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
                      </svg>
                    </button>
                    <!-- Delete -->
                    <button
                      (click)="deleteSection(idx)"
                      class="text-red-400 hover:text-red-600 transition-colors"
                      title="Delete section"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Variant Selector -->
                <select
                  [(ngModel)]="section.variantId"
                  (ngModelChange)="notifyChange()"
                  class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  @for (variant of getVariantsForSection(section.sectionType); track variant.id) {
                    <option [value]="variant.id">{{ variant.label }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Expanded Content Form -->
            @if (isExpanded(section.id)) {
              <div class="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50 space-y-4">
                <!-- Content / Design tabs -->
                <div class="flex gap-4 border-b border-gray-200">
                  <button
                    type="button"
                    (click)="setTab(section.id, 'content')"
                    class="pb-2 -mb-px text-sm font-medium border-b-2 transition-colors"
                    [class.border-blue-600]="!isDesignTab(section.id)"
                    [class.text-blue-600]="!isDesignTab(section.id)"
                    [class.border-transparent]="isDesignTab(section.id)"
                    [class.text-gray-500]="isDesignTab(section.id)"
                  >Content</button>
                  <button
                    type="button"
                    (click)="setTab(section.id, 'design')"
                    class="pb-2 -mb-px text-sm font-medium border-b-2 transition-colors flex items-center gap-1"
                    [class.border-blue-600]="isDesignTab(section.id)"
                    [class.text-blue-600]="isDesignTab(section.id)"
                    [class.border-transparent]="!isDesignTab(section.id)"
                    [class.text-gray-500]="!isDesignTab(section.id)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                    </svg>
                    Design
                  </button>
                </div>

                @if (!isDesignTab(section.id)) {
                @switch (section.sectionType) {
                  @case ('Hero') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">
                          Title (EN)
                          <span class="ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700" title="This field impacts search engine rankings">SEO</span>
                        </label>
                        <input #heroTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', heroTitleEn.value)" placeholder="Welcome to Our Store" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                        <input #heroTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', heroTitleAr.value)" placeholder="أهلاً بكم" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (EN)</label>
                        <input #heroSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.subtitle?.en || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'en', heroSubEn.value)" placeholder="Discover our amazing collection" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (AR)</label>
                        <input #heroSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.subtitle?.ar || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'ar', heroSubAr.value)" placeholder="اكتشف مجموعتنا" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
                        <input #heroBtn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.buttonText || ''"
                          (input)="setContentField(section, 'buttonText', heroBtn.value)" placeholder="Shop Now" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Button Link</label>
                        <input #heroBtnLink type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.buttonLink || ''"
                          (input)="setContentField(section, 'buttonLink', heroBtnLink.value)" placeholder="/products" />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1">
                          Background Image
                          <span class="ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700" title="Image alt text impacts search engine rankings">SEO</span>
                        </label>
                        <div class="flex gap-2">
                          <input #heroImg type="text" class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            [value]="getContent(section)?.imageUrl || ''"
                            (input)="setContentField(section, 'imageUrl', heroImg.value)" placeholder="Paste image URL or upload →" />
                          <label class="cursor-pointer flex-shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs text-gray-700 flex items-center gap-1.5 transition-colors"
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
                          <img [src]="getContent(section).imageUrl" class="mt-2 h-24 w-full object-cover rounded-md border border-gray-200" alt="Preview" />
                        }
                      </div>
                    </div>
                  }
                  @case ('FeaturedProducts') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                        <input #fpTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', fpTitleEn.value)" placeholder="Featured Products" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                        <input #fpTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', fpTitleAr.value)" placeholder="المنتجات المميزة" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (EN)</label>
                        <input #fpSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.subtitle?.en || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'en', fpSubEn.value)" placeholder="Check out our top picks" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (AR)</label>
                        <input #fpSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.subtitle?.ar || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'ar', fpSubAr.value)" placeholder="اكتشف أفضل منتجاتنا" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Products to Show</label>
                        <input #fpPageSize type="number" min="4" max="24" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getSettings(section)?.pageSize || 8"
                          (input)="setSettingsField(section, 'pageSize', +fpPageSize.value)" />
                      </div>
                    </div>
                  }
                  @case ('CategoryShowcase') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                        <input #csTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', csTitleEn.value)" placeholder="Shop by Category" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                        <input #csTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', csTitleAr.value)" placeholder="تسوق حسب الفئة" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (EN)</label>
                        <input #csSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.subtitle?.en || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'en', csSubEn.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (AR)</label>
                        <input #csSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.subtitle?.ar || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'ar', csSubAr.value)" />
                      </div>
                    </div>
                  }
                  @case ('FeatureHighlights') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                        <input #fhTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', fhTitleEn.value)" placeholder="Why Choose Us" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                        <input #fhTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', fhTitleAr.value)" placeholder="لماذا تختارنا" />
                      </div>
                    </div>
                    <p class="text-xs text-gray-500">Feature items can be managed through the store builder API.</p>
                  }
                  @case ('Newsletter') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                        <input #nlTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', nlTitleEn.value)" placeholder="Stay in the Loop" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                        <input #nlTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', nlTitleAr.value)" placeholder="ابق على اطلاع" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (EN)</label>
                        <input #nlSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.subtitle?.en || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'en', nlSubEn.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (AR)</label>
                        <input #nlSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.subtitle?.ar || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'ar', nlSubAr.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Input Placeholder</label>
                        <input #nlPlaceholder type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.placeholder || ''"
                          (input)="setContentField(section, 'placeholder', nlPlaceholder.value)" placeholder="Enter your email" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
                        <input #nlBtn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.buttonText || ''"
                          (input)="setContentField(section, 'buttonText', nlBtn.value)" placeholder="Subscribe" />
                      </div>
                    </div>
                  }
                  @case ('Banner') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                        <input #banTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', banTitleEn.value)" placeholder="Special Offer" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                        <input #banTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', banTitleAr.value)" placeholder="عرض خاص" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (EN)</label>
                        <input #banSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.subtitle?.en || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'en', banSubEn.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (AR)</label>
                        <input #banSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.subtitle?.ar || ''"
                          (input)="setContentBilingual(section, 'subtitle', 'ar', banSubAr.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
                        <input #banBtn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.buttonText || ''"
                          (input)="setContentField(section, 'buttonText', banBtn.value)" placeholder="Shop Now" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Button Link</label>
                        <input #banBtnLink type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.buttonLink || ''"
                          (input)="setContentField(section, 'buttonLink', banBtnLink.value)" placeholder="/products" />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Banner Image</label>
                        <div class="flex gap-2">
                          <input #banImg type="text" class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            [value]="getContent(section)?.imageUrl || ''"
                            (input)="setContentField(section, 'imageUrl', banImg.value)" placeholder="Paste image URL or upload →" />
                          <label class="cursor-pointer flex-shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs text-gray-700 flex items-center gap-1.5 transition-colors"
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
                          <img [src]="getContent(section).imageUrl" class="mt-2 h-24 w-full object-cover rounded-md border border-gray-200" alt="Preview" />
                        }
                      </div>
                    </div>
                  }
                  @case ('ProductCarousel') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                        <input #pcTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', pcTitleEn.value)" placeholder="Popular Products" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                        <input #pcTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', pcTitleAr.value)" placeholder="المنتجات الشائعة" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Products to Show</label>
                        <input #pcPageSize type="number" min="4" max="24" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getSettings(section)?.pageSize || 8"
                          (input)="setSettingsField(section, 'pageSize', +pcPageSize.value)" />
                      </div>
                    </div>
                  }
                  @case ('Testimonials') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                        <input #testTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.en || ''"
                          (input)="setContentBilingual(section, 'title', 'en', testTitleEn.value)" placeholder="What Our Customers Say" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                        <input #testTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          [value]="getContent(section)?.title?.ar || ''"
                          (input)="setContentBilingual(section, 'title', 'ar', testTitleAr.value)" placeholder="ماذا يقول عملاؤنا" />
                      </div>
                    </div>
                    <p class="text-xs text-gray-500">Individual testimonial items can be added through the API.</p>
                  }
                  @case ('CustomHtml') {
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Custom HTML</label>
                      <textarea #customHtml rows="6" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        [value]="getContent(section)?.html || ''"
                        (input)="setContentField(section, 'html', customHtml.value)"
                        placeholder="<div>Your custom HTML here...</div>">
                      </textarea>
                      <p class="mt-1 text-xs text-amber-600">HTML is rendered as-is. Ensure content is safe.</p>
                    </div>
                  }
                  @case ('MediaText') {
                    <div class="space-y-4">
                      @for (item of getContentArray(section, 'items'); track $index; let i = $index) {
                        <div class="border border-gray-200 rounded-md p-3 space-y-2 bg-white">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-gray-500">Row {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'items', i)" class="text-xs text-red-600 hover:text-red-800">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                              <input #mtTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.title?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'title', 'en', mtTitleEn.value)" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                              <input #mtTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.title?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'title', 'ar', mtTitleAr.value)" />
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-gray-700 mb-1">Text (EN)</label>
                              <textarea #mtTextEn rows="2" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.text?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'text', 'en', mtTextEn.value)"></textarea>
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-gray-700 mb-1">Text (AR)</label>
                              <textarea #mtTextAr rows="2" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.text?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'text', 'ar', mtTextAr.value)"></textarea>
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-gray-700 mb-1">Image (leave blank to use a product photo)</label>
                              <div class="flex gap-2">
                                <input #mtImg type="text" class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                  [value]="item.imageUrl || ''" (input)="updateArrayItemField(section, 'items', i, 'imageUrl', mtImg.value)" placeholder="Paste image URL or upload →" />
                                <label class="cursor-pointer flex-shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs text-gray-700"
                                  [class.opacity-50]="uploadingField() === section.id + ':items:' + i + ':imageUrl'">
                                  Upload
                                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden"
                                    [disabled]="!!uploadingField()" (change)="uploadArrayItemImage(section, 'items', i, 'imageUrl', $event)" />
                                </label>
                              </div>
                              @if (item.imageUrl) {
                                <img [src]="item.imageUrl" class="mt-2 h-20 w-full object-cover rounded-md border border-gray-200" alt="Preview" />
                              }
                            </div>

                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-gray-700 mb-1">Text Position</label>
                              <div class="flex gap-2">
                                <button type="button" (click)="updateArrayItemField(section, 'items', i, 'layout', 'side')"
                                  class="flex-1 text-xs px-2 py-1.5 rounded-md border" [class.border-blue-500]="(item.layout || 'side') === 'side'"
                                  [class.bg-blue-50]="(item.layout || 'side') === 'side'" [class.border-gray-300]="(item.layout || 'side') !== 'side'">Beside Image</button>
                                <button type="button" (click)="updateArrayItemField(section, 'items', i, 'layout', 'below')"
                                  class="flex-1 text-xs px-2 py-1.5 rounded-md border" [class.border-blue-500]="item.layout === 'below'"
                                  [class.bg-blue-50]="item.layout === 'below'" [class.border-gray-300]="item.layout !== 'below'">Below Image</button>
                                <button type="button" (click)="updateArrayItemField(section, 'items', i, 'layout', 'overlay')"
                                  class="flex-1 text-xs px-2 py-1.5 rounded-md border" [class.border-blue-500]="item.layout === 'overlay'"
                                  [class.bg-blue-50]="item.layout === 'overlay'" [class.border-gray-300]="item.layout !== 'overlay'">Over Image</button>
                              </div>
                            </div>

                            @if ((item.layout || 'side') === 'side') {
                              <label class="col-span-2 flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" [checked]="item.reverse" (change)="updateArrayItemField(section, 'items', i, 'reverse', !item.reverse)" class="h-4 w-4 text-blue-600 rounded" />
                                <span class="text-xs font-medium text-gray-700">Image on the right</span>
                              </label>
                            }
                            @if (item.layout === 'below') {
                              <label class="col-span-2 flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" [checked]="item.reverse" (change)="updateArrayItemField(section, 'items', i, 'reverse', !item.reverse)" class="h-4 w-4 text-blue-600 rounded" />
                                <span class="text-xs font-medium text-gray-700">Text above the image</span>
                              </label>
                            }

                            @if (item.layout === 'overlay') {
                              <div class="col-span-2 space-y-3 border-t border-gray-100 pt-3">
                                <div>
                                  <label class="block text-xs font-medium text-gray-700 mb-1">Text Area</label>
                                  <div class="grid grid-cols-5 gap-1 w-48">
                                    @for (pos of overlayPositions; track pos) {
                                      <button type="button" (click)="selectOverlayCell(section, i, pos)"
                                        class="h-8 rounded-md border flex items-center justify-center transition-colors"
                                        [class.bg-green-200]="isOverlayEndpoint(item, pos)"
                                        [class.border-green-500]="isOverlayEndpoint(item, pos)"
                                        [class.bg-green-50]="isInOverlaySpan(item, pos) && !isOverlayEndpoint(item, pos)"
                                        [class.border-green-300]="isInOverlaySpan(item, pos) && !isOverlayEndpoint(item, pos)"
                                        [class.border-gray-300]="!isInOverlaySpan(item, pos)"
                                        [title]="pos">
                                        <span class="w-1.5 h-1.5 rounded-full" [class.bg-green-600]="isInOverlaySpan(item, pos)" [class.bg-gray-400]="!isInOverlaySpan(item, pos)"></span>
                                      </button>
                                    }
                                  </div>
                                  <p class="text-[11px] text-gray-400 mt-1">Click a cell to start, then click another to size the box (a row, column, or rectangle) — or click it again for a small box. On phones this collapses to the nearest 2×2 corner so text doesn't crowd a small screen.</p>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                  <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">Readability Overlay</label>
                                    <select #mtScrim class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-white"
                                      [value]="item.scrim || 'dark'" (change)="updateArrayItemField(section, 'items', i, 'scrim', mtScrim.value)">
                                      <option value="dark">Dark</option>
                                      <option value="light">Light</option>
                                      <option value="none">None</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                                    <input #mtColor type="color" class="h-8 w-full rounded border border-gray-300 cursor-pointer p-0.5"
                                      [value]="item.textColor || '#ffffff'" (input)="updateArrayItemField(section, 'items', i, 'textColor', mtColor.value)" />
                                  </div>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'items', { imageUrl: '', title: { en: '', ar: '' }, text: { en: '', ar: '' }, reverse: false, layout: 'side' })"
                        class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add Row</button>
                    </div>
                  }
                  @case ('Benefits') {
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                          <input #benfTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', benfTitleEn.value)" placeholder="Why You'll Love It" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                          <input #benfTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', benfTitleAr.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'items'); track $index; let i = $index) {
                        <div class="border border-gray-200 rounded-md p-3 space-y-2 bg-white">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-gray-500">Benefit {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'items', i)" class="text-xs text-red-600 hover:text-red-800">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-gray-700 mb-1">Icon (emoji)</label>
                              <input #benIcon type="text" class="w-20 text-sm px-2 py-1.5 border border-gray-300 rounded-md text-center"
                                [value]="item.icon || ''" (input)="updateArrayItemField(section, 'items', i, 'icon', benIcon.value)" placeholder="⭐" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                              <input #benTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.title?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'title', 'en', benTitleEn.value)" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                              <input #benTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.title?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'title', 'ar', benTitleAr.value)" />
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-gray-700 mb-1">Text (EN)</label>
                              <textarea #benTextEn rows="2" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.text?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'text', 'en', benTextEn.value)"></textarea>
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-gray-700 mb-1">Text (AR)</label>
                              <textarea #benTextAr rows="2" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.text?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'text', 'ar', benTextAr.value)"></textarea>
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'items', { icon: '⭐', title: { en: '', ar: '' }, text: { en: '', ar: '' } })"
                        class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add Benefit</button>
                    </div>
                  }
                  @case ('Faq') {
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                          <input #faqTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', faqTitleEn.value)" placeholder="Frequently Asked Questions" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                          <input #faqTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', faqTitleAr.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'items'); track $index; let i = $index) {
                        <div class="border border-gray-200 rounded-md p-3 space-y-2 bg-white">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-gray-500">Question {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'items', i)" class="text-xs text-red-600 hover:text-red-800">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Question (EN)</label>
                              <input #faqQEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.question?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'question', 'en', faqQEn.value)" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Question (AR)</label>
                              <input #faqQAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.question?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'question', 'ar', faqQAr.value)" />
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-gray-700 mb-1">Answer (EN)</label>
                              <textarea #faqAEn rows="2" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.answer?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'answer', 'en', faqAEn.value)"></textarea>
                            </div>
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-gray-700 mb-1">Answer (AR)</label>
                              <textarea #faqAAr rows="2" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.answer?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'answer', 'ar', faqAAr.value)"></textarea>
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'items', { question: { en: '', ar: '' }, answer: { en: '', ar: '' } })"
                        class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add Question</button>
                    </div>
                  }
                  @case ('Guarantee') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Icon (emoji)</label>
                        <input #gIcon type="text" class="w-20 text-sm px-2 py-1.5 border border-gray-300 rounded-md text-center"
                          [value]="getContent(section)?.icon || ''" (input)="setContentField(section, 'icon', gIcon.value)" placeholder="🛡️" />
                      </div>
                      <div></div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                        <input #gTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', gTitleEn.value)" placeholder="Satisfaction Guaranteed" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                        <input #gTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', gTitleAr.value)" />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Text (EN)</label>
                        <textarea #gTextEn rows="2" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.text?.en || ''" (input)="setContentBilingual(section, 'text', 'en', gTextEn.value)"></textarea>
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Text (AR)</label>
                        <textarea #gTextAr rows="2" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.text?.ar || ''" (input)="setContentBilingual(section, 'text', 'ar', gTextAr.value)"></textarea>
                      </div>
                    </div>
                  }
                  @case ('CallToAction') {
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                        <input #ctaTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', ctaTitleEn.value)" placeholder="Ready to get yours?" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                        <input #ctaTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', ctaTitleAr.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (EN)</label>
                        <input #ctaSubEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.subtitle?.en || ''" (input)="setContentBilingual(section, 'subtitle', 'en', ctaSubEn.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtitle (AR)</label>
                        <input #ctaSubAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.subtitle?.ar || ''" (input)="setContentBilingual(section, 'subtitle', 'ar', ctaSubAr.value)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Button Text (EN)</label>
                        <input #ctaBtnEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.buttonText?.en || ''" (input)="setContentBilingual(section, 'buttonText', 'en', ctaBtnEn.value)" placeholder="Shop Now" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Button Text (AR)</label>
                        <input #ctaBtnAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.buttonText?.ar || ''" (input)="setContentBilingual(section, 'buttonText', 'ar', ctaBtnAr.value)" />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Button Link</label>
                        <input #ctaBtnLink type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.buttonLink || ''" (input)="setContentField(section, 'buttonLink', ctaBtnLink.value)" placeholder="/products, https://…, or leave empty to scroll to the buy box" />
                        <p class="text-[11px] text-gray-400 mt-1">Leave empty on a product page to scroll to the buy box. On other pages, set where the button should go (e.g. /products).</p>
                      </div>
                    </div>
                  }
                  @case ('ReviewsShowcase') {
                    <p class="text-[11px] text-amber-600 mb-2">Shows real customer reviews for the product — only appears on product landing pages. For a home or custom page, use the “Testimonials” section instead.</p>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                        <input #rsTitleEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                          [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', rsTitleEn.value)" placeholder="What Customers Say" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                        <input #rsTitleAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
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
                            class="h-4 w-4 text-blue-600 rounded" />
                          <span class="text-xs font-medium text-gray-700">Autoplay</span>
                        </label>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Interval (ms)</label>
                          <input #slInterval type="number" min="1500" step="500" class="w-28 text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.interval || 5000" (input)="setContentField(section, 'interval', +slInterval.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'slides'); track $index; let i = $index) {
                        <div class="border border-gray-200 rounded-md p-3 space-y-2 bg-white">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-gray-500">Slide {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'slides', i)" class="text-xs text-red-600 hover:text-red-800">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div class="col-span-2">
                              <label class="block text-xs font-medium text-gray-700 mb-1">Image</label>
                              <div class="flex gap-2">
                                <input #slImg type="text" class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                  [value]="item.imageUrl || ''" (input)="updateArrayItemField(section, 'slides', i, 'imageUrl', slImg.value)" placeholder="Image URL or upload →" />
                                <label class="px-2 py-1.5 text-xs bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 whitespace-nowrap">
                                  Upload
                                  <input type="file" accept="image/*" class="hidden" (change)="uploadArrayItemImage(section, 'slides', i, 'imageUrl', $event)" />
                                </label>
                              </div>
                              @if (item.imageUrl) {
                                <img [src]="item.imageUrl" class="mt-2 h-20 w-full object-cover rounded-md border border-gray-200" alt="Preview" />
                              }
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Link</label>
                              <input #slLink type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.link || ''" (input)="updateArrayItemField(section, 'slides', i, 'link', slLink.value)" placeholder="/products" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Alt text</label>
                              <input #slAlt type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.alt || ''" (input)="updateArrayItemField(section, 'slides', i, 'alt', slAlt.value)" />
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'slides', { imageUrl: '', link: '', alt: '' })"
                        class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add Slide</button>
                    </div>
                  }
                  @case ('Video') {
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Video Source</label>
                        <select #vidSrc class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-white"
                          [value]="getContent(section)?.source || 'youtube'" (change)="setContentField(section, 'source', vidSrc.value)">
                          <option value="youtube">YouTube</option>
                          <option value="upload">Upload a video</option>
                        </select>
                      </div>
                      @if ((getContent(section)?.source || 'youtube') === 'upload') {
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Video File (MP4/WebM, max 20 MB)</label>
                          <div class="flex items-center gap-2">
                            <label class="px-3 py-1.5 text-xs bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200"
                              [class.opacity-50]="uploadingField() === section.id + ':videoUrl'">
                              @if (uploadingField() === section.id + ':videoUrl') { Uploading… } @else { Choose Video }
                              <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" class="hidden"
                                [disabled]="!!uploadingField()" (change)="uploadVideo(section, $event)" />
                            </label>
                            @if (getContent(section)?.videoUrl) {
                              <span class="text-xs text-green-600">Video uploaded ✓</span>
                              <button type="button" (click)="setContentField(section, 'videoUrl', '')" class="text-xs text-gray-400 hover:text-red-500">Remove</button>
                            }
                          </div>
                          @if (videoUploadError()) {
                            <p class="text-xs text-red-600 mt-1">{{ videoUploadError() }}</p>
                          }
                          @if (getContent(section)?.videoUrl) {
                            <video [src]="getContent(section).videoUrl" class="mt-2 w-full max-h-40 rounded-md border border-gray-200 bg-black" controls></video>
                          }
                        </div>
                      } @else {
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">YouTube Video ID or URL</label>
                          <input #vidId type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.videoId || ''" (input)="setContentField(section, 'videoId', vidId.value)" placeholder="dQw4w9WgXcQ or https://youtu.be/…" />
                        </div>
                      }
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Aspect Ratio</label>
                          <select #vidAr class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-white"
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
                            class="h-4 w-4 text-blue-600 rounded" />
                          <span class="text-xs font-medium text-gray-700" title="Browsers only allow autoplay when muted">Autoplay when opened (muted)</span>
                        </label>
                      </div>
                    </div>
                  }
                  @case ('AnnouncementBar') {
                    <div class="space-y-3">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Text (EN)</label>
                          <input #anEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.text?.en || ''" (input)="setContentBilingual(section, 'text', 'en', anEn.value)" placeholder="Free shipping on orders over 500!" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Text (AR)</label>
                          <input #anAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.text?.ar || ''" (input)="setContentBilingual(section, 'text', 'ar', anAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Link (optional)</label>
                          <input #anLink type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.link || ''" (input)="setContentField(section, 'link', anLink.value)" placeholder="/products" />
                        </div>
                        <div class="flex gap-3">
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Background</label>
                            <input #anBg type="color" class="h-8 w-12 rounded border border-gray-300 cursor-pointer p-0"
                              [value]="getContent(section)?.bg || '#111827'" (input)="setContentField(section, 'bg', anBg.value)" />
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                            <input #anTc type="color" class="h-8 w-12 rounded border border-gray-300 cursor-pointer p-0"
                              [value]="getContent(section)?.textColor || '#ffffff'" (input)="setContentField(section, 'textColor', anTc.value)" />
                          </div>
                        </div>
                      </div>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" [checked]="getContent(section)?.dismissible === true"
                          (change)="setContentField(section, 'dismissible', !(getContent(section)?.dismissible === true))"
                          class="h-4 w-4 text-blue-600 rounded" />
                        <span class="text-xs font-medium text-gray-700">Allow visitors to dismiss</span>
                      </label>
                    </div>
                  }
                  @case ('Countdown') {
                    <div class="space-y-3">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                          <input #cdTEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', cdTEn.value)" placeholder="Hurry, offer ends in" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                          <input #cdTAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', cdTAr.value)" />
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Timer Type</label>
                          <select #cdMode class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-white"
                            [value]="getContent(section)?.mode || 'fixed'" (change)="setContentField(section, 'mode', cdMode.value)">
                            <option value="fixed">Fixed date</option>
                            <option value="evergreen">Evergreen (per visitor)</option>
                          </select>
                        </div>
                        @if ((getContent(section)?.mode || 'fixed') === 'evergreen') {
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Duration (minutes)</label>
                            <input #cdDur type="number" min="1" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                              [value]="getContent(section)?.durationMinutes || 60" (input)="setContentField(section, 'durationMinutes', +cdDur.value)" />
                          </div>
                        } @else {
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Ends At</label>
                            <input #cdEnds type="datetime-local" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                              [value]="getContent(section)?.endsAt || ''" (input)="setContentField(section, 'endsAt', cdEnds.value)" />
                          </div>
                        }
                      </div>
                      @if ((getContent(section)?.mode || 'fixed') === 'evergreen') {
                        <p class="text-[11px] text-gray-400">Evergreen: each visitor's timer starts on their first visit and counts down the set duration.</p>
                      }
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">When expired</label>
                        <select #cdExp class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-white"
                          [value]="getContent(section)?.expiredBehavior || 'message'" (change)="setContentField(section, 'expiredBehavior', cdExp.value)">
                          <option value="message">Show a message</option>
                          <option value="hide">Hide the section</option>
                        </select>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Expired Text (EN)</label>
                          <input #cdExEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.expiredText?.en || ''" (input)="setContentBilingual(section, 'expiredText', 'en', cdExEn.value)" placeholder="Offer ended" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Expired Text (AR)</label>
                          <input #cdExAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.expiredText?.ar || ''" (input)="setContentBilingual(section, 'expiredText', 'ar', cdExAr.value)" />
                        </div>
                      </div>
                    </div>
                  }
                  @case ('RichText') {
                    <div class="space-y-3">
                      <p class="text-xs text-gray-500">Format text with the toolbar — no HTML needed. Content is sanitized on render.</p>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Content (EN)</label>
                        <app-rich-text-editor
                          [value]="getContent(section)?.html?.en || ''"
                          placeholder="Write your content…"
                          (valueChange)="setContentBilingual(section, 'html', 'en', $event)" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Content (AR)</label>
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
                          <label class="block text-xs font-medium text-gray-700 mb-1">Button Text (EN)</label>
                          <input #cbEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.text?.en || ''" (input)="setContentBilingual(section, 'text', 'en', cbEn.value)" placeholder="Buy Now" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Button Text (AR)</label>
                          <input #cbAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.text?.ar || ''" (input)="setContentBilingual(section, 'text', 'ar', cbAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Style</label>
                          <select #cbStyle class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-white"
                            [value]="getContent(section)?.style || 'primary'" (change)="setContentField(section, 'style', cbStyle.value)">
                            <option value="primary">Primary (filled)</option>
                            <option value="outline">Outline</option>
                            <option value="dark">Dark</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Action</label>
                          <select #cbAction class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-white"
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
                              <label class="block text-xs font-medium text-gray-700 mb-1">WhatsApp Number</label>
                              <input #cbWa type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="getContent(section)?.whatsapp || ''" (input)="setContentField(section, 'whatsapp', cbWa.value)" placeholder="201000000000 (country code, no +)" />
                            </div>
                            <div class="col-span-2 grid grid-cols-2 gap-3">
                              <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Prefilled Message (EN)</label>
                                <input #cbMsgEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                  [value]="getContent(section)?.message?.en || ''" (input)="setContentBilingual(section, 'message', 'en', cbMsgEn.value)" placeholder="I'd like to order…" />
                              </div>
                              <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Prefilled Message (AR)</label>
                                <input #cbMsgAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                  [value]="getContent(section)?.message?.ar || ''" (input)="setContentBilingual(section, 'message', 'ar', cbMsgAr.value)" />
                              </div>
                            </div>
                          }
                          @case ('phone') {
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                              <input #cbPhone type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="getContent(section)?.phone || ''" (input)="setContentField(section, 'phone', cbPhone.value)" placeholder="+20 100 000 0000" />
                            </div>
                          }
                          @case ('anchor') {
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Scroll-to Anchor ID</label>
                              <input #cbAnchor type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="getContent(section)?.anchor || ''" (input)="setContentField(section, 'anchor', cbAnchor.value)" placeholder="order-form" />
                            </div>
                          }
                          @default {
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Link</label>
                              <input #cbLink type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
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
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                          <input #stTEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', stTEn.value)" placeholder="Trusted by thousands" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                          <input #stTAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', stTAr.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'items'); track $index; let i = $index) {
                        <div class="border border-gray-200 rounded-md p-3 space-y-2 bg-white">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-gray-500">Stat {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'items', i)" class="text-xs text-red-600 hover:text-red-800">Remove</button>
                          </div>
                          <div class="grid grid-cols-3 gap-2">
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Prefix</label>
                              <input #stPre type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.prefix || ''" (input)="updateArrayItemField(section, 'items', i, 'prefix', stPre.value)" placeholder="+" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Value</label>
                              <input #stVal type="number" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.value || 0" (input)="updateArrayItemField(section, 'items', i, 'value', +stVal.value)" placeholder="10000" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Suffix</label>
                              <input #stSuf type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.suffix || ''" (input)="updateArrayItemField(section, 'items', i, 'suffix', stSuf.value)" placeholder="+" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Label (EN)</label>
                              <input #stLEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.label?.en || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'label', 'en', stLEn.value)" placeholder="Happy customers" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Label (AR)</label>
                              <input #stLAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.label?.ar || ''" (input)="updateArrayItemBilingual(section, 'items', i, 'label', 'ar', stLAr.value)" />
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'items', { prefix: '', value: 0, suffix: '+', label: { en: '', ar: '' } })"
                        class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add Stat</button>
                    </div>
                  }
                  @case ('Comparison') {
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                          <input #cmTEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', cmTEn.value)" placeholder="Why choose us" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                          <input #cmTAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', cmTAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Our Column (EN)</label>
                          <input #cmUsEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.usLabel?.en || ''" (input)="setContentBilingual(section, 'usLabel', 'en', cmUsEn.value)" placeholder="Us" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Their Column (EN)</label>
                          <input #cmThEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.themLabel?.en || ''" (input)="setContentBilingual(section, 'themLabel', 'en', cmThEn.value)" placeholder="Others" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Our Column (AR)</label>
                          <input #cmUsAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.usLabel?.ar || ''" (input)="setContentBilingual(section, 'usLabel', 'ar', cmUsAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Their Column (AR)</label>
                          <input #cmThAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.themLabel?.ar || ''" (input)="setContentBilingual(section, 'themLabel', 'ar', cmThAr.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'rows'); track $index; let i = $index) {
                        <div class="border border-gray-200 rounded-md p-3 space-y-2 bg-white">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-gray-500">Row {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'rows', i)" class="text-xs text-red-600 hover:text-red-800">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-2">
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Feature (EN)</label>
                              <input #cmFEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.feature?.en || ''" (input)="updateArrayItemBilingual(section, 'rows', i, 'feature', 'en', cmFEn.value)" placeholder="Free delivery" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Feature (AR)</label>
                              <input #cmFAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.feature?.ar || ''" (input)="updateArrayItemBilingual(section, 'rows', i, 'feature', 'ar', cmFAr.value)" />
                            </div>
                          </div>
                          <div class="flex items-center gap-4">
                            <label class="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" [checked]="item.us !== false" (change)="updateArrayItemField(section, 'rows', i, 'us', !(item.us !== false))" class="h-4 w-4 text-blue-600 rounded" />
                              <span class="text-xs text-gray-600">We have it</span>
                            </label>
                            <label class="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" [checked]="item.them === true" (change)="updateArrayItemField(section, 'rows', i, 'them', !(item.them === true))" class="h-4 w-4 text-blue-600 rounded" />
                              <span class="text-xs text-gray-600">They have it</span>
                            </label>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'rows', { feature: { en: '', ar: '' }, us: true, them: false })"
                        class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add Row</button>
                    </div>
                  }
                  @case ('BeforeAfter') {
                    <div class="space-y-3">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Before Image</label>
                          <div class="flex gap-2">
                            <input #baBefore type="text" class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                              [value]="getContent(section)?.beforeUrl || ''" (input)="setContentField(section, 'beforeUrl', baBefore.value)" placeholder="Before URL" />
                            <label class="px-2 py-1.5 text-xs bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">Upload
                              <input type="file" accept="image/*" class="hidden" (change)="uploadImage(section, 'beforeUrl', $event)" />
                            </label>
                          </div>
                          @if (getContent(section)?.beforeUrl) {
                            <img [src]="getContent(section).beforeUrl" class="mt-2 h-20 w-full object-cover rounded-md border border-gray-200" alt="Before" />
                          }
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">After Image</label>
                          <div class="flex gap-2">
                            <input #baAfter type="text" class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                              [value]="getContent(section)?.afterUrl || ''" (input)="setContentField(section, 'afterUrl', baAfter.value)" placeholder="After URL" />
                            <label class="px-2 py-1.5 text-xs bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">Upload
                              <input type="file" accept="image/*" class="hidden" (change)="uploadImage(section, 'afterUrl', $event)" />
                            </label>
                          </div>
                          @if (getContent(section)?.afterUrl) {
                            <img [src]="getContent(section).afterUrl" class="mt-2 h-20 w-full object-cover rounded-md border border-gray-200" alt="After" />
                          }
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Before Label (EN)</label>
                          <input #baBLEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.beforeLabel?.en || ''" (input)="setContentBilingual(section, 'beforeLabel', 'en', baBLEn.value)" placeholder="Before" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">After Label (EN)</label>
                          <input #baALEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.afterLabel?.en || ''" (input)="setContentBilingual(section, 'afterLabel', 'en', baALEn.value)" placeholder="After" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Before Label (AR)</label>
                          <input #baBLAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.beforeLabel?.ar || ''" (input)="setContentBilingual(section, 'beforeLabel', 'ar', baBLAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">After Label (AR)</label>
                          <input #baALAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.afterLabel?.ar || ''" (input)="setContentBilingual(section, 'afterLabel', 'ar', baALAr.value)" />
                        </div>
                      </div>
                    </div>
                  }
                  @case ('Image') {
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Image</label>
                        <div class="flex gap-2">
                          <input #imgUrl type="text" class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.imageUrl || ''" (input)="setContentField(section, 'imageUrl', imgUrl.value)" placeholder="Image URL or upload →" />
                          <label class="px-2 py-1.5 text-xs bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 whitespace-nowrap"
                            [class.opacity-50]="uploadingField() === section.id + ':imageUrl'">
                            @if (uploadingField() === section.id + ':imageUrl') { Uploading… } @else { Upload }
                            <input type="file" accept="image/*" class="hidden" [disabled]="!!uploadingField()" (change)="uploadImage(section, 'imageUrl', $event)" />
                          </label>
                        </div>
                        @if (getContent(section)?.imageUrl) {
                          <img [src]="getContent(section).imageUrl" class="mt-2 w-full max-h-48 object-contain rounded-md border border-gray-200 bg-gray-50" alt="Preview" />
                        }
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Link (optional)</label>
                          <input #imgLink type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.link || ''" (input)="setContentField(section, 'link', imgLink.value)" placeholder="/products or https://…" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Alt text (SEO)</label>
                          <input #imgAlt type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.alt || ''" (input)="setContentField(section, 'alt', imgAlt.value)" placeholder="Describe the image" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Caption (EN)</label>
                          <input #imgCapEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.caption?.en || ''" (input)="setContentBilingual(section, 'caption', 'en', imgCapEn.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Caption (AR)</label>
                          <input #imgCapAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.caption?.ar || ''" (input)="setContentBilingual(section, 'caption', 'ar', imgCapAr.value)" />
                        </div>
                      </div>
                    </div>
                  }
                  @case ('Specs') {
                    <div class="space-y-4">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                          <input #spTEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', spTEn.value)" placeholder="Specifications" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                          <input #spTAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', spTAr.value)" placeholder="المواصفات" />
                        </div>
                      </div>

                      @for (group of getSpecGroups(section); track $index; let gi = $index) {
                        <div class="border border-gray-200 rounded-md p-3 space-y-2 bg-white">
                          <div class="flex items-center gap-2">
                            <input #spGEn type="text" class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md font-medium"
                              [value]="group.name?.en || ''" (input)="setSpecGroupName(section, gi, 'en', spGEn.value)" placeholder="Group (EN) e.g. Display" />
                            <input #spGAr type="text" dir="rtl" class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md font-medium"
                              [value]="group.name?.ar || ''" (input)="setSpecGroupName(section, gi, 'ar', spGAr.value)" placeholder="المجموعة" />
                            <button type="button" (click)="removeSpecGroup(section, gi)" class="text-xs text-red-600 hover:text-red-800 whitespace-nowrap">Remove group</button>
                          </div>
                          @for (row of group.rows || []; track $index; let ri = $index) {
                            <div class="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center pl-2 border-l-2 border-gray-100">
                              <input #spLEn type="text" class="text-sm px-2 py-1 border border-gray-300 rounded-md"
                                [value]="row.label?.en || ''" (input)="setSpecRow(section, gi, ri, 'label', 'en', spLEn.value)" placeholder="Label (EN)" />
                              <input #spLAr type="text" dir="rtl" class="text-sm px-2 py-1 border border-gray-300 rounded-md"
                                [value]="row.label?.ar || ''" (input)="setSpecRow(section, gi, ri, 'label', 'ar', spLAr.value)" placeholder="التسمية" />
                              <input #spVEn type="text" class="text-sm px-2 py-1 border border-gray-300 rounded-md"
                                [value]="row.value?.en || ''" (input)="setSpecRow(section, gi, ri, 'value', 'en', spVEn.value)" placeholder="Value (EN)" />
                              <input #spVAr type="text" dir="rtl" class="text-sm px-2 py-1 border border-gray-300 rounded-md"
                                [value]="row.value?.ar || ''" (input)="setSpecRow(section, gi, ri, 'value', 'ar', spVAr.value)" placeholder="القيمة" />
                              <button type="button" (click)="removeSpecRow(section, gi, ri)" class="text-xs text-red-500 hover:text-red-700 px-1">✕</button>
                            </div>
                          }
                          <button type="button" (click)="addSpecRow(section, gi)" class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add Row</button>
                        </div>
                      }
                      <button type="button" (click)="addSpecGroup(section)" class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add Group</button>
                    </div>
                  }
                  @case ('Marquee') {
                    <div class="space-y-4">
                      <p class="text-[11px] text-gray-400">A bar with text that scrolls forever. Direction follows the store language automatically.</p>
                      <div class="grid grid-cols-3 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Speed</label>
                          <select #mqSpeed class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-white"
                            [value]="getContent(section)?.speed || 'normal'" (change)="setContentField(section, 'speed', mqSpeed.value)">
                            <option value="slow">Slow</option>
                            <option value="normal">Normal</option>
                            <option value="fast">Fast</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Background</label>
                          <input #mqBg type="color" class="h-8 w-full rounded border border-gray-300 cursor-pointer p-0.5"
                            [value]="getContent(section)?.bg || '#111827'" (input)="setContentField(section, 'bg', mqBg.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                          <input #mqTc type="color" class="h-8 w-full rounded border border-gray-300 cursor-pointer p-0.5"
                            [value]="getContent(section)?.textColor || '#ffffff'" (input)="setContentField(section, 'textColor', mqTc.value)" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Separator</label>
                        <input #mqSep type="text" class="w-24 text-sm px-2 py-1.5 border border-gray-300 rounded-md text-center"
                          [value]="getContent(section)?.separator || ''" (input)="setContentField(section, 'separator', mqSep.value)" placeholder="•" />
                      </div>
                      @for (item of getContentArray(section, 'messages'); track $index; let i = $index) {
                        <div class="border border-gray-200 rounded-md p-3 space-y-2 bg-white">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-gray-500">Message {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'messages', i)" class="text-xs text-red-600 hover:text-red-800">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-2">
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Text (EN)</label>
                              <input #mqEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.text?.en || ''" (input)="updateArrayItemBilingual(section, 'messages', i, 'text', 'en', mqEn.value)" placeholder="Free shipping over 500!" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Text (AR)</label>
                              <input #mqAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.text?.ar || ''" (input)="updateArrayItemBilingual(section, 'messages', i, 'text', 'ar', mqAr.value)" />
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'messages', { text: { en: '', ar: '' } })"
                        class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add Message</button>
                    </div>
                  }
                  @case ('OrderForm') {
                    <div class="space-y-3">
                      <p class="text-[11px] text-gray-400">Adds the product to cart; "Buy Now" goes to checkout.</p>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Product</label>
                        <select #ofProd class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-white"
                          [value]="getContent(section)?.productSlug || ''" (change)="setContentField(section, 'productSlug', ofProd.value)">
                          <option value="">Use the page's product (product pages only)</option>
                          @for (p of productOptions(); track p.slug) {
                            <option [value]="p.slug">{{ p.name }}</option>
                          }
                        </select>
                        <p class="text-[11px] text-gray-400 mt-1">Pick a product to use this on the home page or a custom page. On a product page, leave it to use that product.</p>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Heading (EN)</label>
                          <input #ofHEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.heading?.en || ''" (input)="setContentBilingual(section, 'heading', 'en', ofHEn.value)" placeholder="Order now" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Heading (AR)</label>
                          <input #ofHAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.heading?.ar || ''" (input)="setContentBilingual(section, 'heading', 'ar', ofHAr.value)" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Button Text (EN)</label>
                          <input #ofBEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.buttonText?.en || ''" (input)="setContentBilingual(section, 'buttonText', 'en', ofBEn.value)" placeholder="Buy Now" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Button Text (AR)</label>
                          <input #ofBAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.buttonText?.ar || ''" (input)="setContentBilingual(section, 'buttonText', 'ar', ofBAr.value)" />
                        </div>
                      </div>
                      <div class="flex items-center gap-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" [checked]="getContent(section)?.showImage !== false"
                            (change)="setContentField(section, 'showImage', !(getContent(section)?.showImage !== false))" class="h-4 w-4 text-blue-600 rounded" />
                          <span class="text-xs font-medium text-gray-700">Show product image</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" [checked]="getContent(section)?.showQuantity !== false"
                            (change)="setContentField(section, 'showQuantity', !(getContent(section)?.showQuantity !== false))" class="h-4 w-4 text-blue-600 rounded" />
                          <span class="text-xs font-medium text-gray-700">Show quantity selector</span>
                        </label>
                      </div>
                    </div>
                  }
                  @case ('StickyBar') {
                    <div class="space-y-3">
                      <p class="text-[11px] text-gray-400">Pinned to the bottom on mobile only.</p>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Product</label>
                        <select #sbProd class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-white"
                          [value]="getContent(section)?.productSlug || ''" (change)="setContentField(section, 'productSlug', sbProd.value)">
                          <option value="">Use the page's product (product pages only)</option>
                          @for (p of productOptions(); track p.slug) {
                            <option [value]="p.slug">{{ p.name }}</option>
                          }
                        </select>
                        <p class="text-[11px] text-gray-400 mt-1">Pick a product to use this on the home page or a custom page.</p>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Button Text (EN)</label>
                          <input #sbBEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.buttonText?.en || ''" (input)="setContentBilingual(section, 'buttonText', 'en', sbBEn.value)" placeholder="Buy Now" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Button Text (AR)</label>
                          <input #sbBAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.buttonText?.ar || ''" (input)="setContentBilingual(section, 'buttonText', 'ar', sbBAr.value)" />
                        </div>
                      </div>
                    </div>
                  }
                  @case ('Bundle') {
                    <div class="space-y-4">
                      <p class="text-[11px] text-gray-400">Quantity tiers add N of the product to the cart. The badge is marketing text — actual per-bundle discounts still need a promo rule.</p>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Product</label>
                        <select #buProd class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md bg-white"
                          [value]="getContent(section)?.productSlug || ''" (change)="setContentField(section, 'productSlug', buProd.value)">
                          <option value="">Use the page's product (product pages only)</option>
                          @for (p of productOptions(); track p.slug) {
                            <option [value]="p.slug">{{ p.name }}</option>
                          }
                        </select>
                        <p class="text-[11px] text-gray-400 mt-1">Pick a product to use this on the home page or a custom page.</p>
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (EN)</label>
                          <input #buTEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.en || ''" (input)="setContentBilingual(section, 'title', 'en', buTEn.value)" placeholder="Choose your bundle" />
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1">Title (AR)</label>
                          <input #buTAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                            [value]="getContent(section)?.title?.ar || ''" (input)="setContentBilingual(section, 'title', 'ar', buTAr.value)" />
                        </div>
                      </div>
                      @for (item of getContentArray(section, 'tiers'); track $index; let i = $index) {
                        <div class="border border-gray-200 rounded-md p-3 space-y-2 bg-white">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-gray-500">Tier {{ i + 1 }}</span>
                            <button type="button" (click)="removeArrayItem(section, 'tiers', i)" class="text-xs text-red-600 hover:text-red-800">Remove</button>
                          </div>
                          <div class="grid grid-cols-2 gap-2">
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                              <input #buQty type="number" min="1" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.qty || 1" (input)="updateArrayItemField(section, 'tiers', i, 'qty', +buQty.value)" />
                            </div>
                            <label class="flex items-center gap-2 cursor-pointer mt-6">
                              <input type="checkbox" [checked]="item.highlight === true" (change)="updateArrayItemField(section, 'tiers', i, 'highlight', !(item.highlight === true))" class="h-4 w-4 text-blue-600 rounded" />
                              <span class="text-xs text-gray-600">Highlight (best value)</span>
                            </label>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Label (EN)</label>
                              <input #buLEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.label?.en || ''" (input)="updateArrayItemBilingual(section, 'tiers', i, 'label', 'en', buLEn.value)" placeholder="Buy 2" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Label (AR)</label>
                              <input #buLAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.label?.ar || ''" (input)="updateArrayItemBilingual(section, 'tiers', i, 'label', 'ar', buLAr.value)" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Badge (EN)</label>
                              <input #buBEn type="text" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.badge?.en || ''" (input)="updateArrayItemBilingual(section, 'tiers', i, 'badge', 'en', buBEn.value)" placeholder="Most popular" />
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-700 mb-1">Badge (AR)</label>
                              <input #buBAr type="text" dir="rtl" class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
                                [value]="item.badge?.ar || ''" (input)="updateArrayItemBilingual(section, 'tiers', i, 'badge', 'ar', buBAr.value)" />
                            </div>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'tiers', { qty: 1, label: { en: '', ar: '' }, badge: { en: '', ar: '' }, highlight: false })"
                        class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add Tier</button>
                    </div>
                  }
                  @default {
                    <p class="text-xs text-gray-500 py-2">No content fields available for this section type.</p>
                  }
                }
                }

                <!-- Design settings (applies SettingsJson on the storefront) -->
                @if (isDesignTab(section.id)) {
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Background Color</label>
                        <div class="flex items-center gap-2">
                          <input
                            type="color"
                            [value]="getSettings(section)?.backgroundColor || '#ffffff'"
                            (input)="setSettingsField(section, 'backgroundColor', dBg.value)"
                            #dBg
                            class="h-8 w-10 rounded border border-gray-300 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            [value]="getSettings(section)?.backgroundColor || ''"
                            (input)="setSettingsField(section, 'backgroundColor', dBgText.value)"
                            #dBgText
                            placeholder="#ffffff or var(--x)"
                            class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          @if (getSettings(section)?.backgroundColor) {
                            <button type="button" (click)="clearSettingsField(section, 'backgroundColor')" class="text-xs text-gray-400 hover:text-red-500" title="Clear">✕</button>
                          }
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                        <div class="flex items-center gap-2">
                          <input
                            type="color"
                            [value]="getSettings(section)?.textColor || '#111827'"
                            (input)="setSettingsField(section, 'textColor', dText.value)"
                            #dText
                            class="h-8 w-10 rounded border border-gray-300 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            [value]="getSettings(section)?.textColor || ''"
                            (input)="setSettingsField(section, 'textColor', dTextText.value)"
                            #dTextText
                            placeholder="#111827"
                            class="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          @if (getSettings(section)?.textColor) {
                            <button type="button" (click)="clearSettingsField(section, 'textColor')" class="text-xs text-gray-400 hover:text-red-500" title="Clear">✕</button>
                          }
                        </div>
                      </div>
                    </div>

                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">Background Image URL</label>
                      <input
                        type="text"
                        [value]="getSettings(section)?.backgroundImageUrl || ''"
                        (input)="setSettingsField(section, 'backgroundImageUrl', dBgImg.value)"
                        #dBgImg
                        placeholder="https://... (optional, sits behind content)"
                        class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Vertical Padding</label>
                        <select
                          [value]="getSettings(section)?.paddingY || ''"
                          (change)="setSettingsField(section, 'paddingY', dPadY.value)"
                          #dPadY
                          class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Default</option>
                          <option value="none">None</option>
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                          <option value="xl">Extra Large</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Horizontal Padding</label>
                        <select
                          [value]="getSettings(section)?.paddingX || ''"
                          (change)="setSettingsField(section, 'paddingX', dPadX.value)"
                          #dPadX
                          class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Default</option>
                          <option value="none">None</option>
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Content Width</label>
                        <select
                          [value]="getSettings(section)?.maxWidth || ''"
                          (change)="setSettingsField(section, 'maxWidth', dWidth.value)"
                          #dWidth
                          class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Default</option>
                          <option value="full">Full Width</option>
                          <option value="wide">Wide (max 80rem)</option>
                          <option value="narrow">Narrow (max 48rem)</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Corner Radius</label>
                        <select
                          [value]="getSettings(section)?.borderRadius || ''"
                          (change)="setSettingsField(section, 'borderRadius', dRadius.value)"
                          #dRadius
                          class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Default</option>
                          <option value="none">None</option>
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                          <option value="2xl">Extra Large</option>
                        </select>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">
                          Device Visibility
                          <span class="ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700" title="Uses CSS media queries so content stays crawlable">SEO</span>
                        </label>
                        <select
                          [value]="getSettings(section)?.visibility || 'all'"
                          (change)="setSettingsField(section, 'visibility', dVis.value)"
                          #dVis
                          class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="all">All Devices</option>
                          <option value="desktop">Desktop Only</option>
                          <option value="mobile">Mobile Only</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Anchor ID</label>
                        <input
                          type="text"
                          [value]="getSettings(section)?.anchorId || ''"
                          (input)="setSettingsField(section, 'anchorId', dAnchor.value)"
                          #dAnchor
                          placeholder="e.g. order-form (for #links)"
                          class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Scroll Animation</label>
                        <select
                          [value]="getSettings(section)?.animation || 'none'"
                          (change)="setSettingsField(section, 'animation', dAnim.value)"
                          #dAnim
                          class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="none">None</option>
                          <option value="fade">Fade in</option>
                          <option value="slide-up">Slide up</option>
                          <option value="slide-left">Slide in</option>
                          <option value="zoom">Zoom in</option>
                        </select>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @empty {
          <div class="bg-gray-50 rounded-lg p-8 text-center">
            <p class="text-gray-500 mb-4">No sections yet. Add your first section below.</p>
          </div>
        }
        </div>

        <!-- Add Section Button -->
        <button
          (click)="showAddModal.set(true)"
          class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Section
        </button>
      </div>

      <!-- Page SEO Settings -->
      <div class="px-6 py-5 border-t border-gray-200 bg-gray-50">
        <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Page SEO Settings
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Meta Title (EN)
              <span class="ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700" title="This field impacts search engine rankings">SEO</span>
            </label>
            <input
              type="text"
              [(ngModel)]="localSeoSettings.metaTitle.english"
              placeholder="Page title for search engines"
              class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Meta Title (AR)
              <span class="ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700" title="This field impacts search engine rankings">SEO</span>
            </label>
            <input
              type="text"
              dir="rtl"
              [(ngModel)]="localSeoSettings.metaTitle.arabic"
              placeholder="عنوان الصفحة لمحركات البحث"
              class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Meta Description (EN)
              <span class="ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700" title="This field impacts search engine rankings">SEO</span>
            </label>
            <textarea
              rows="2"
              [(ngModel)]="localSeoSettings.metaDescription.english"
              placeholder="Brief description of this page (150–160 chars recommended)"
              class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            ></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Meta Description (AR)
              <span class="ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700" title="This field impacts search engine rankings">SEO</span>
            </label>
            <textarea
              rows="2"
              dir="rtl"
              [(ngModel)]="localSeoSettings.metaDescription.arabic"
              placeholder="وصف مختصر للصفحة"
              class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            ></textarea>
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-700 mb-1">OG Image URL</label>
            <input
              type="text"
              [(ngModel)]="localSeoSettings.ogImageUrl"
              placeholder="https://... (used when sharing on social media)"
              class="w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="localSeoSettings.noIndex" class="h-4 w-4 text-blue-600 rounded" />
              <span class="text-xs font-medium text-gray-700">No Index</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="localSeoSettings.noFollow" class="h-4 w-4 text-blue-600 rounded" />
              <span class="text-xs font-medium text-gray-700">No Follow</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <button
            (click)="exportJson()"
            class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1.5"
            title="Download this page's sections as a JSON template"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Export
          </button>
          <label
            class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1.5 cursor-pointer"
            title="Load sections from a JSON template (replaces current, not saved until you Save)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            Import
            <input type="file" accept="application/json,.json" class="hidden" (change)="onImportFile($event)" />
          </label>
          @if (importErr()) {
            <span class="text-xs text-red-600">{{ importErr() }}</span>
          }
        </div>
        <div class="flex items-center gap-3">
          <button
            (click)="onClose()"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            (click)="onSave()"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>

    <!-- Add Section Modal -->
    @if (showAddModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
          <h3 class="text-base font-semibold text-gray-900 mb-4">Add New Section</h3>

          <!-- Blank section types -->
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Section Types</p>
          <div class="grid grid-cols-3 gap-3">
            @for (type of sectionTypes; track type.key) {
              <button
                (click)="addSection(type.key)"
                class="p-3 border-2 border-gray-200 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div class="text-sm font-medium text-gray-900">{{ type.label }}</div>
                <div class="text-xs text-gray-500 mt-0.5">{{ type.description }}</div>
              </button>
            }
          </div>

          <!-- Pre-filled section presets -->
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-6 mb-2">Presets (pre-filled)</p>
          <div class="grid grid-cols-3 gap-3">
            @for (preset of sectionPresets; track preset.key) {
              <button
                (click)="addPreset(preset)"
                class="p-3 border-2 border-gray-200 rounded-lg text-left hover:border-green-500 hover:bg-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <div class="text-sm font-medium text-gray-900">{{ preset.label }}</div>
                <div class="text-xs text-gray-500 mt-0.5">{{ preset.description }}</div>
              </button>
            }
          </div>

          <!-- Full-page templates -->
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-6 mb-2">Page Templates (replace all)</p>
          <div class="grid grid-cols-2 gap-3">
            @for (tpl of pageTemplates; track tpl.key) {
              <button
                (click)="applyPageTemplate(tpl)"
                class="p-3 border-2 border-gray-200 rounded-lg text-left hover:border-purple-500 hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <div class="text-sm font-medium text-gray-900">{{ tpl.label }}</div>
                <div class="text-xs text-gray-500 mt-0.5">{{ tpl.description }}</div>
              </button>
            }
          </div>

          <div class="mt-6 flex justify-end">
            <button
              (click)="showAddModal.set(false)"
              class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
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

  localSections: SectionConfigurationDto[] = [];
  localSeoSettings: PageSeoSettings = {
    metaTitle: { arabic: '', english: '' },
    metaDescription: { arabic: '', english: '' },
    ogImageUrl: '',
    noIndex: false,
    noFollow: false
  };

  expandedSectionIds = signal<Set<string>>(new Set());
  designTabSectionIds = signal<Set<string>>(new Set());
  showAddModal = signal(false);
  uploadingField = signal<string | null>(null);
  importErr = signal<string | null>(null);
  videoUploadError = signal<string | null>(null);

  private mediaService = inject(MediaService);
  private productService = inject(ProductService);

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

  readonly sectionTypes: SectionTypeInfo[] = [
    { key: 'Hero', label: 'Hero Banner', description: 'Top hero section', defaultVariantId: 'hero-full-image' },
    { key: 'FeaturedProducts', label: 'Featured Products', description: 'Product grid', defaultVariantId: 'grid-standard' },
    { key: 'CategoryShowcase', label: 'Categories', description: 'Category display', defaultVariantId: 'cats-grid' },
    { key: 'FeatureHighlights', label: 'Features', description: 'Key features', defaultVariantId: 'feat-icons' },
    { key: 'Newsletter', label: 'Newsletter', description: 'Email signup', defaultVariantId: 'news-inline' },
    { key: 'Banner', label: 'Banner', description: 'Promo banner', defaultVariantId: 'banner-strip' },
    { key: 'ProductCarousel', label: 'Carousel', description: 'Scrolling products', defaultVariantId: 'carousel-standard' },
    { key: 'Testimonials', label: 'Testimonials', description: 'Customer reviews', defaultVariantId: 'test-cards' },
    { key: 'CustomHtml', label: 'Custom HTML', description: 'Raw HTML block', defaultVariantId: 'custom-html' },
    { key: 'MediaText', label: 'Media + Text', description: 'Alternating image/text rows', defaultVariantId: 'media-text-standard' },
    { key: 'Benefits', label: 'Benefits', description: 'Icon + text value props', defaultVariantId: 'benefits-standard' },
    { key: 'ReviewsShowcase', label: 'Reviews', description: 'Product reviews (product pages)', defaultVariantId: 'reviews-standard' },
    { key: 'Faq', label: 'FAQ', description: 'Question & answer accordion', defaultVariantId: 'faq-accordion' },
    { key: 'Guarantee', label: 'Guarantee', description: 'Trust / guarantee banner', defaultVariantId: 'guarantee-standard' },
    { key: 'CallToAction', label: 'Call to Action', description: 'Closing CTA band', defaultVariantId: 'cta-band' },
    { key: 'Slider', label: 'Image Slider', description: 'Rotating image slides', defaultVariantId: 'slider-standard' },
    { key: 'Video', label: 'Video', description: 'YouTube / video embed', defaultVariantId: 'video-youtube' },
    { key: 'AnnouncementBar', label: 'Announcement Bar', description: 'Top promo strip', defaultVariantId: 'announcement-bar' },
    { key: 'Countdown', label: 'Countdown Timer', description: 'Urgency timer', defaultVariantId: 'countdown-standard' },
    { key: 'RichText', label: 'Rich Text', description: 'Formatted HTML block', defaultVariantId: 'rich-text' },
    { key: 'CtaButton', label: 'CTA Button', description: 'Standalone / WhatsApp button', defaultVariantId: 'cta-button' },
    { key: 'Stats', label: 'Stats / Counters', description: 'Animated numbers', defaultVariantId: 'stats-standard' },
    { key: 'Comparison', label: 'Comparison Table', description: 'Us vs. others', defaultVariantId: 'comparison-standard' },
    { key: 'BeforeAfter', label: 'Before / After', description: 'Image comparison slider', defaultVariantId: 'before-after-standard' },
    { key: 'Image', label: 'Image', description: 'Full-width image block', defaultVariantId: 'image-standard' },
    { key: 'Specs', label: 'Specs Table', description: 'Grouped specification rows', defaultVariantId: 'specs-standard' },
    { key: 'Marquee', label: 'Marquee', description: 'Scrolling running-text bar', defaultVariantId: 'marquee-standard' },
    { key: 'OrderForm', label: 'Order Form', description: 'Inline buy box for a product', defaultVariantId: 'order-form' },
    { key: 'StickyBar', label: 'Sticky Buy Bar', description: 'Mobile bottom buy bar', defaultVariantId: 'sticky-bar' },
    { key: 'Bundle', label: 'Bundle Offers', description: 'Quantity offer tiers', defaultVariantId: 'bundle-tiers' },
  ];

  private readonly sectionVariants: Record<string, SectionVariant[]> = {
    Hero: [
      { id: 'hero-full-image', label: 'Full Width Image' },
      { id: 'hero-split', label: 'Split Content' },
      { id: 'hero-slider', label: 'Slider' },
      { id: 'hero-minimal', label: 'Minimal' }
    ],
    FeaturedProducts: [
      { id: 'grid-standard', label: 'Standard Grid' },
      { id: 'grid-large', label: 'Large Grid' },
      { id: 'grid-list', label: 'List View' },
      { id: 'grid-compact', label: 'Compact Grid' }
    ],
    CategoryShowcase: [
      { id: 'cats-grid', label: 'Category Grid' },
      { id: 'cats-slider', label: 'Category Slider' },
      { id: 'cats-icons', label: 'Category Icons' }
    ],
    FeatureHighlights: [
      { id: 'feat-icons', label: 'Icons Layout' },
      { id: 'feat-cards', label: 'Cards Layout' }
    ],
    Newsletter: [
      { id: 'news-inline', label: 'Inline Form' },
      { id: 'news-card', label: 'Card Form' }
    ],
    Banner: [
      { id: 'banner-strip', label: 'Banner Strip' },
      { id: 'banner-card', label: 'Banner Card' }
    ],
    ProductCarousel: [
      { id: 'carousel-standard', label: 'Standard Carousel' }
    ],
    Testimonials: [
      { id: 'test-cards', label: 'Cards' },
      { id: 'test-slider', label: 'Slider' }
    ],
    CustomHtml: [
      { id: 'custom-html', label: 'Custom HTML Block' }
    ],
    MediaText: [
      { id: 'media-text-standard', label: 'Standard' }
    ],
    Benefits: [
      { id: 'benefits-standard', label: 'Standard' },
      { id: 'benefits-strip', label: 'Trust Badge Strip' }
    ],
    Slider: [
      { id: 'slider-standard', label: 'Standard' }
    ],
    Video: [
      { id: 'video-youtube', label: 'YouTube' }
    ],
    AnnouncementBar: [
      { id: 'announcement-bar', label: 'Standard' }
    ],
    Countdown: [
      { id: 'countdown-standard', label: 'Standard' }
    ],
    RichText: [
      { id: 'rich-text', label: 'Standard' }
    ],
    CtaButton: [
      { id: 'cta-button', label: 'Standard' }
    ],
    Stats: [
      { id: 'stats-standard', label: 'Standard' }
    ],
    Comparison: [
      { id: 'comparison-standard', label: 'Standard' }
    ],
    BeforeAfter: [
      { id: 'before-after-standard', label: 'Standard' }
    ],
    Image: [
      { id: 'image-standard', label: 'Standard' }
    ],
    Specs: [
      { id: 'specs-standard', label: 'Standard' }
    ],
    Marquee: [
      { id: 'marquee-standard', label: 'Standard' }
    ],
    OrderForm: [
      { id: 'order-form', label: 'Standard' }
    ],
    StickyBar: [
      { id: 'sticky-bar', label: 'Standard' }
    ],
    Bundle: [
      { id: 'bundle-tiers', label: 'Quantity Tiers' }
    ],
    ReviewsShowcase: [
      { id: 'reviews-standard', label: 'Standard' }
    ],
    Faq: [
      { id: 'faq-accordion', label: 'Accordion' }
    ],
    Guarantee: [
      { id: 'guarantee-standard', label: 'Standard' }
    ],
    CallToAction: [
      { id: 'cta-band', label: 'Band' }
    ]
  };

  // ── Presets: single, pre-filled sections merchants can drop in ──
  readonly sectionPresets: SectionPreset[] = [
    {
      key: 'preset-hero', label: 'Hero (image)', description: 'Headline + CTA over an image',
      sectionType: 'Hero', variantId: 'hero-full-image',
      content: { title: { en: 'Welcome to our store', ar: 'مرحبًا بكم في متجرنا' }, subtitle: { en: 'Quality products, delivered fast', ar: 'منتجات عالية الجودة، توصيل سريع' }, buttonText: 'Shop Now', buttonLink: '/products' }
    },
    {
      key: 'preset-benefits', label: 'Benefits (3)', description: 'Three value-prop icons',
      sectionType: 'Benefits', variantId: 'benefits-standard',
      content: { title: { en: "Why You'll Love It", ar: 'لماذا ستحبه' }, items: [
        { icon: '🚚', title: { en: 'Fast Delivery', ar: 'توصيل سريع' }, text: { en: 'Get it in days, not weeks', ar: 'استلمه خلال أيام' } },
        { icon: '🛡️', title: { en: 'Secure Checkout', ar: 'دفع آمن' }, text: { en: 'Your data is protected', ar: 'بياناتك محمية' } },
        { icon: '↩️', title: { en: 'Easy Returns', ar: 'إرجاع سهل' }, text: { en: 'Hassle-free returns', ar: 'إرجاع بدون متاعب' } }
      ] }
    },
    {
      key: 'preset-faq', label: 'FAQ starter', description: 'Two starter questions',
      sectionType: 'Faq', variantId: 'faq-accordion',
      content: { title: { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة' }, items: [
        { question: { en: 'How long does delivery take?', ar: 'كم يستغرق التوصيل؟' }, answer: { en: 'Typically 2–5 business days.', ar: 'عادةً من 2 إلى 5 أيام عمل.' } },
        { question: { en: 'Can I return an item?', ar: 'هل يمكنني إرجاع المنتج؟' }, answer: { en: 'Yes, within 14 days of delivery.', ar: 'نعم، خلال 14 يومًا من الاستلام.' } }
      ] }
    },
    {
      key: 'preset-cta', label: 'CTA band', description: 'Closing call-to-action',
      sectionType: 'CallToAction', variantId: 'cta-band',
      content: { title: { en: 'Ready to get yours?', ar: 'هل أنت مستعد للحصول عليه؟' }, subtitle: { en: 'Order now while stock lasts', ar: 'اطلب الآن قبل نفاد الكمية' }, buttonText: { en: 'Shop Now', ar: 'تسوق الآن' } }
    },
    {
      key: 'preset-announcement', label: 'Announcement', description: 'Dismissible promo strip',
      sectionType: 'AnnouncementBar', variantId: 'announcement-bar',
      content: { text: { en: 'Free shipping on orders over 500!', ar: 'شحن مجاني للطلبات فوق 500!' }, link: '/products', bg: '#111827', textColor: '#ffffff', dismissible: true }
    },
    {
      key: 'preset-countdown', label: 'Countdown offer', description: 'Urgency timer',
      sectionType: 'Countdown', variantId: 'countdown-standard',
      content: { title: { en: 'Hurry, offer ends in', ar: 'أسرع، ينتهي العرض خلال' }, expiredBehavior: 'message', expiredText: { en: 'Offer ended', ar: 'انتهى العرض' } }
    }
  ];

  // ── Full-page templates: replace the whole section list ──
  readonly pageTemplates: PageTemplate[] = [
    {
      key: 'tpl-landing', label: 'Product Landing — Conversion', description: 'Announcement, hero, benefits, countdown, reviews, FAQ, guarantee, CTA',
      sections: [
        { sectionType: 'AnnouncementBar', variantId: 'announcement-bar', content: { text: { en: 'Limited time offer!', ar: 'عرض لفترة محدودة!' }, bg: '#111827', textColor: '#ffffff', dismissible: true } },
        { sectionType: 'Hero', variantId: 'hero-full-image', content: { title: { en: 'The product you need', ar: 'المنتج الذي تحتاجه' }, subtitle: { en: 'Trusted by thousands', ar: 'موثوق من الآلاف' }, buttonText: 'Buy Now', buttonLink: '/products' } },
        { sectionType: 'Benefits', variantId: 'benefits-standard', content: { items: [
          { icon: '⭐', title: { en: 'Top Rated', ar: 'الأعلى تقييمًا' }, text: { en: 'Loved by customers', ar: 'محبوب من العملاء' } },
          { icon: '🚚', title: { en: 'Fast Delivery', ar: 'توصيل سريع' }, text: { en: 'Delivered in days', ar: 'يصل خلال أيام' } },
          { icon: '🛡️', title: { en: 'Guaranteed', ar: 'مضمون' }, text: { en: 'Money-back promise', ar: 'ضمان استرداد الأموال' } }
        ] } },
        { sectionType: 'Countdown', variantId: 'countdown-standard', content: { title: { en: 'Offer ends in', ar: 'ينتهي العرض خلال' }, expiredBehavior: 'message', expiredText: { en: 'Offer ended', ar: 'انتهى العرض' } } },
        { sectionType: 'ReviewsShowcase', variantId: 'reviews-standard', content: { title: { en: 'What Customers Say', ar: 'ماذا يقول العملاء' } } },
        { sectionType: 'Faq', variantId: 'faq-accordion', content: { title: { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة' }, items: [] } },
        { sectionType: 'Guarantee', variantId: 'guarantee-standard', content: { icon: '🛡️', title: { en: 'Satisfaction Guaranteed', ar: 'رضا مضمون' }, text: { en: 'Or your money back', ar: 'أو استرداد أموالك' } } },
        { sectionType: 'CallToAction', variantId: 'cta-band', content: { title: { en: 'Ready to order?', ar: 'مستعد للطلب؟' }, buttonText: { en: 'Buy Now', ar: 'اشترِ الآن' } } }
      ]
    },
    {
      key: 'tpl-home', label: 'Simple Store Home', description: 'Hero, featured products, categories, newsletter',
      sections: [
        { sectionType: 'Hero', variantId: 'hero-full-image', content: { title: { en: 'Welcome', ar: 'مرحبًا' }, subtitle: { en: 'Discover our collection', ar: 'اكتشف مجموعتنا' }, buttonText: 'Shop Now', buttonLink: '/products' } },
        { sectionType: 'FeaturedProducts', variantId: 'grid-standard', content: { title: { en: 'Featured Products', ar: 'منتجات مميزة' } } },
        { sectionType: 'CategoryShowcase', variantId: 'cats-grid', content: { title: { en: 'Shop by Category', ar: 'تسوق حسب الفئة' } } },
        { sectionType: 'Newsletter', variantId: 'news-inline', content: { title: { en: 'Stay in the loop', ar: 'ابقَ على اطلاع' }, buttonText: 'Subscribe' } }
      ]
    }
  ];

  ngOnInit(): void {
    if (this.page?.sections) {
      this.localSections = JSON.parse(JSON.stringify(this.page.sections));
      this.localSections.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    if (this.page?.seoSettings) {
      this.localSeoSettings = JSON.parse(JSON.stringify(this.page.seoSettings));
    }
    this.loadProductOptions();
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
    this.sectionsChange.emit([...this.localSections]);
  }

  getSectionTypeLabel(sectionType: string): string {
    return this.sectionTypes.find(t => t.key === sectionType)?.label ?? sectionType;
  }

  getVariantsForSection(sectionType: string): SectionVariant[] {
    return this.sectionVariants[sectionType] ?? [{ id: sectionType.toLowerCase(), label: 'Standard' }];
  }

  toggleExpanded(sectionId: string): void {
    const set = new Set(this.expandedSectionIds());
    if (set.has(sectionId)) {
      set.delete(sectionId);
    } else {
      set.add(sectionId);
    }
    this.expandedSectionIds.set(set);
  }

  isExpanded(sectionId: string): boolean {
    return this.expandedSectionIds().has(sectionId);
  }

  setTab(sectionId: string, tab: 'content' | 'design'): void {
    const set = new Set(this.designTabSectionIds());
    if (tab === 'design') {
      set.add(sectionId);
    } else {
      set.delete(sectionId);
    }
    this.designTabSectionIds.set(set);
  }

  isDesignTab(sectionId: string): boolean {
    return this.designTabSectionIds().has(sectionId);
  }

  onDrop(event: CdkDragDrop<SectionConfigurationDto[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.localSections, event.previousIndex, event.currentIndex);
    this.updateSortOrders();
    this.notifyChange();
  }

  duplicateSection(index: number): void {
    const source = this.localSections[index];
    if (!source) return;
    // Deep clone with a fresh temporary id; the backend re-creates all sections
    // with server-generated ids on save, so this persists as a new row.
    const clone: SectionConfigurationDto = {
      ...JSON.parse(JSON.stringify(source)),
      id: crypto.randomUUID()
    };
    this.localSections.splice(index + 1, 0, clone);
    this.localSections = [...this.localSections];
    this.updateSortOrders();
    this.notifyChange();
  }

  private updateSortOrders(): void {
    this.localSections.forEach((section, index) => {
      section.sortOrder = index + 1;
    });
  }

  // ── Presets & templates (Phase E) ──

  addPreset(preset: SectionPreset): void {
    const newSection: SectionConfigurationDto = {
      id: crypto.randomUUID(),
      sectionType: preset.sectionType,
      variantId: preset.variantId,
      isEnabled: true,
      sortOrder: this.localSections.length + 1,
      contentJson: preset.content !== undefined ? JSON.stringify(preset.content) : undefined,
      settingsJson: preset.settings !== undefined ? JSON.stringify(preset.settings) : undefined
    };
    this.localSections = [...this.localSections, newSection];
    this.showAddModal.set(false);
    this.notifyChange();
  }

  applyPageTemplate(tpl: PageTemplate): void {
    if (this.localSections.length > 0 &&
        !confirm(`Replace all ${this.localSections.length} current section(s) with the "${tpl.label}" template? This is not saved until you click Save Changes.`)) {
      return;
    }
    this.localSections = tpl.sections.map((s, i) => ({
      id: crypto.randomUUID(),
      sectionType: s.sectionType,
      variantId: s.variantId,
      isEnabled: true,
      sortOrder: i + 1,
      contentJson: s.content !== undefined ? JSON.stringify(s.content) : undefined,
      settingsJson: s.settings !== undefined ? JSON.stringify(s.settings) : undefined
    }));
    this.showAddModal.set(false);
    this.notifyChange();
  }

  // ── Export / Import JSON (Phase E) ──

  exportJson(): void {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      sections: this.localSections.map(({ sectionType, variantId, isEnabled, sortOrder, contentJson, settingsJson }) =>
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

    const validTypes = new Set(this.sectionTypes.map(t => t.key));
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

    this.localSections = imported;
    this.updateSortOrders();

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

  addSection(sectionTypeKey: string): void {
    const typeInfo = this.sectionTypes.find(t => t.key === sectionTypeKey);
    if (!typeInfo) return;
    const newSection: SectionConfigurationDto = {
      id: crypto.randomUUID(),
      sectionType: sectionTypeKey,
      variantId: typeInfo.defaultVariantId,
      isEnabled: true,
      sortOrder: this.localSections.length + 1,
      contentJson: undefined,
      settingsJson: undefined
    };
    this.localSections = [...this.localSections, newSection];
    this.showAddModal.set(false);
    this.notifyChange();
  }

  deleteSection(index: number): void {
    this.localSections = this.localSections.filter((_, i) => i !== index);
    this.updateSortOrders();
    this.notifyChange();
  }

  getContent(section: SectionConfigurationDto): any {
    try {
      return section.contentJson ? JSON.parse(section.contentJson) : {};
    } catch {
      return {};
    }
  }

  setContentField(section: SectionConfigurationDto, field: string, value: any): void {
    const content = this.getContent(section);
    content[field] = value;
    section.contentJson = JSON.stringify(content);
    this.notifyChange();
  }

  setContentBilingual(section: SectionConfigurationDto, field: string, lang: 'en' | 'ar', value: string): void {
    const content = this.getContent(section);
    if (!content[field]) content[field] = { en: '', ar: '' };
    content[field][lang] = value;
    section.contentJson = JSON.stringify(content);
    this.notifyChange();
  }

  getSettings(section: SectionConfigurationDto): any {
    try {
      return section.settingsJson ? JSON.parse(section.settingsJson) : {};
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
    section.settingsJson = Object.keys(settings).length ? JSON.stringify(settings) : undefined;
    this.notifyChange();
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
    section.contentJson = JSON.stringify(content);
    this.notifyChange();
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
    section.contentJson = JSON.stringify(content);
    this.notifyChange();
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
    this.save.emit({ sections: this.localSections, seoSettings: this.localSeoSettings });
  }

  onClose(): void {
    this.close.emit();
  }
}
