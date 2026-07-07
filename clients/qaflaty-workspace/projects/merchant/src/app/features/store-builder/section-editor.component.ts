import { Component, Input, Output, EventEmitter, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageConfigurationDto, SectionConfigurationDto, PageSeoSettings } from 'shared';
import { MediaService } from '../products/services/media.service';

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

@Component({
  selector: 'app-section-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        @for (section of localSections; track section.id; let idx = $index) {
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <!-- Section Row Header -->
            <div class="p-4 flex items-start gap-3 bg-white">
              <!-- Move Up/Down -->
              <div class="flex flex-col gap-0.5 pt-1">
                <button
                  (click)="moveUp(idx)"
                  [disabled]="idx === 0"
                  class="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                  </svg>
                </button>
                <button
                  (click)="moveDown(idx)"
                  [disabled]="idx === localSections.length - 1"
                  class="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>

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
                            <label class="col-span-2 flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" [checked]="item.reverse" (change)="updateArrayItemField(section, 'items', i, 'reverse', !item.reverse)" class="h-4 w-4 text-blue-600 rounded" />
                              <span class="text-xs font-medium text-gray-700">Image on the right</span>
                            </label>
                          </div>
                        </div>
                      }
                      <button type="button" (click)="addArrayItem(section, 'items', { imageUrl: '', title: { en: '', ar: '' }, text: { en: '', ar: '' }, reverse: false })"
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
                    </div>
                  }
                  @case ('ReviewsShowcase') {
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
                  @default {
                    <p class="text-xs text-gray-500 py-2">No content fields available for this section type.</p>
                  }
                }
              </div>
            }
          </div>
        } @empty {
          <div class="bg-gray-50 rounded-lg p-8 text-center">
            <p class="text-gray-500 mb-4">No sections yet. Add your first section below.</p>
          </div>
        }

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
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
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

    <!-- Add Section Modal -->
    @if (showAddModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
          <h3 class="text-base font-semibold text-gray-900 mb-4">Add New Section</h3>
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
          <div class="mt-4 flex justify-end">
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

  localSections: SectionConfigurationDto[] = [];
  localSeoSettings: PageSeoSettings = {
    metaTitle: { arabic: '', english: '' },
    metaDescription: { arabic: '', english: '' },
    ogImageUrl: '',
    noIndex: false,
    noFollow: false
  };

  expandedSectionIds = signal<Set<string>>(new Set());
  showAddModal = signal(false);
  uploadingField = signal<string | null>(null);

  private mediaService = inject(MediaService);

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
    { key: 'ReviewsShowcase', label: 'Reviews', description: 'Customer reviews block', defaultVariantId: 'reviews-standard' },
    { key: 'Faq', label: 'FAQ', description: 'Question & answer accordion', defaultVariantId: 'faq-accordion' },
    { key: 'Guarantee', label: 'Guarantee', description: 'Trust / guarantee banner', defaultVariantId: 'guarantee-standard' },
    { key: 'CallToAction', label: 'Call to Action', description: 'Closing CTA band', defaultVariantId: 'cta-band' },
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
      { id: 'benefits-standard', label: 'Standard' }
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

  ngOnInit(): void {
    if (this.page?.sections) {
      this.localSections = JSON.parse(JSON.stringify(this.page.sections));
      this.localSections.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    if (this.page?.seoSettings) {
      this.localSeoSettings = JSON.parse(JSON.stringify(this.page.seoSettings));
    }
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

  moveUp(index: number): void {
    if (index === 0) return;
    [this.localSections[index], this.localSections[index - 1]] =
      [this.localSections[index - 1], this.localSections[index]];
    this.updateSortOrders();
  }

  moveDown(index: number): void {
    if (index === this.localSections.length - 1) return;
    [this.localSections[index], this.localSections[index + 1]] =
      [this.localSections[index + 1], this.localSections[index]];
    this.updateSortOrders();
  }

  private updateSortOrders(): void {
    this.localSections.forEach((section, index) => {
      section.sortOrder = index + 1;
    });
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
  }

  deleteSection(index: number): void {
    this.localSections = this.localSections.filter((_, i) => i !== index);
    this.updateSortOrders();
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
  }

  setContentBilingual(section: SectionConfigurationDto, field: string, lang: 'en' | 'ar', value: string): void {
    const content = this.getContent(section);
    if (!content[field]) content[field] = { en: '', ar: '' };
    content[field][lang] = value;
    section.contentJson = JSON.stringify(content);
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
    settings[field] = value;
    section.settingsJson = JSON.stringify(settings);
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

  onSave(): void {
    this.save.emit({ sections: this.localSections, seoSettings: this.localSeoSettings });
  }

  onClose(): void {
    this.close.emit();
  }
}
