import { Component, input, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { ProductCardComponent } from '../../products/product-card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid-compact',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <section class="py-12 px-4 bg-white">
      <div class="max-w-7xl mx-auto">
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

        <!-- Product Grid - Compact Layout -->
        @if (content?.products && content.products.length > 0) {
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            @for (product of content.products; track product.id) {
              <app-product-card [product]="product" />
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
export class GridCompactComponent {
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
}
