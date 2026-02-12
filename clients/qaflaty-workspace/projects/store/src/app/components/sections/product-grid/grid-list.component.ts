import { Component, input, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-grid-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="py-12 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        <!-- Section Header -->
        @if (content?.title) {
          <div class="text-center mb-10">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {{ i18n.getText(content.title) }}
            </h2>
            @if (content.subtitle) {
              <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                {{ i18n.getText(content.subtitle) }}
              </p>
            }
          </div>
        }

        <!-- Product List - Horizontal Cards -->
        @if (content?.products && content.products.length > 0) {
          <div class="space-y-6">
            @for (product of content.products; track product.id) {
              <div class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                <div class="flex flex-col sm:flex-row">
                  <!-- Product Image -->
                  <a [routerLink]="['/products', product.slug]" class="flex-shrink-0 sm:w-64">
                    <div class="aspect-square sm:aspect-auto sm:h-full bg-gray-100">
                      @if (product.images && product.images.length > 0) {
                        <img
                          [src]="product.images[0].url"
                          [alt]="i18n.getText(product.name)"
                          class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-gray-400">
                          <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      }
                    </div>
                  </a>

                  <!-- Product Info -->
                  <div class="flex-grow p-6 flex flex-col justify-between">
                    <div>
                      <a [routerLink]="['/products', product.slug]">
                        <h3 class="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                          {{ i18n.getText(product.name) }}
                        </h3>
                      </a>

                      @if (product.shortDescription) {
                        <p class="text-gray-600 mb-4 line-clamp-2">
                          {{ i18n.getText(product.shortDescription) }}
                        </p>
                      }

                      <!-- Star Rating Placeholder -->
                      <div class="flex items-center gap-1 mb-4">
                        @for (star of [1,2,3,4,5]; track star) {
                          <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        }
                        <span class="text-sm text-gray-600 ml-1">(0)</span>
                      </div>
                    </div>

                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <!-- Price -->
                      <div>
                        @if (product.pricing?.salePrice && product.pricing.salePrice < product.pricing.regularPrice) {
                          <div class="flex items-center gap-2">
                            <span class="text-2xl font-bold text-blue-600">
                              {{ formatPrice(product.pricing.salePrice) }}
                            </span>
                            <span class="text-base text-gray-500 line-through">
                              {{ formatPrice(product.pricing.regularPrice) }}
                            </span>
                          </div>
                        } @else {
                          <span class="text-2xl font-bold text-gray-900">
                            {{ formatPrice(product.pricing?.regularPrice) }}
                          </span>
                        }
                      </div>

                      <!-- Add to Cart Button -->
                      <button
                        class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 whitespace-nowrap"
                        type="button"
                      >
                        {{ i18n.currentLanguage() === 'ar' ? 'أضف إلى السلة' : 'Add to Cart' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p class="text-gray-600">
              {{ i18n.currentLanguage() === 'ar' ? 'لا توجد منتجات' : 'No products found' }}
            </p>
          </div>
        }
      </div>
    </section>
  `
})
export class GridListComponent {
  config = input.required<SectionConfigurationDto>();
  i18n = inject(I18nService);

  get content(): any {
    try {
      return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {};
    } catch {
      return {};
    }
  }

  get settings(): any {
    try {
      return this.config().settingsJson ? JSON.parse(this.config().settingsJson!) : {};
    } catch {
      return {};
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }
}
