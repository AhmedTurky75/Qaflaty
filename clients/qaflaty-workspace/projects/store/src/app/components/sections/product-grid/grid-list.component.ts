import { Component, input, inject, signal, OnInit } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { I18nService } from '../../../services/i18n.service';
import { ProductService } from '../../../services/product.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-grid-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  template: `
    <section class="py-12 px-4 bg-white">
      <div class="max-w-6xl mx-auto">
        @if (sectionTitle()) {
          <div class="text-center mb-10">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{{ sectionTitle() }}</h2>
            @if (sectionSubtitle()) {
              <p class="text-lg text-gray-600 max-w-2xl mx-auto">{{ sectionSubtitle() }}</p>
            }
          </div>
        }

        @if (isLoading()) {
          <div class="space-y-4">
            @for (i of skeletons; track i) {
              <div class="bg-gray-100 rounded-lg animate-pulse h-40"></div>
            }
          </div>
        } @else if (products().length > 0) {
          <div class="space-y-6">
            @for (product of products(); track product.id) {
              <div class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                <div class="flex flex-col sm:flex-row">
                  <!-- Image -->
                  <a [routerLink]="['/products', product.slug]" class="flex-shrink-0 sm:w-56">
                    <div class="aspect-square sm:aspect-auto sm:h-full bg-gray-100">
                      @if (product.images?.length > 0) {
                        <img
                          [src]="product.images[0].url"
                          [alt]="product.name"
                          class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-gray-300">
                          <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      }
                    </div>
                  </a>

                  <!-- Info -->
                  <div class="flex-grow p-6 flex flex-col justify-between">
                    <div>
                      <a [routerLink]="['/products', product.slug]">
                        <h3 class="text-xl font-bold text-gray-900 mb-2 hover:text-[var(--primary-color)] transition-colors">
                          {{ product.name }}
                        </h3>
                      </a>
                      @if (product.description) {
                        <p class="text-gray-600 mb-4 line-clamp-2">{{ product.description }}</p>
                      }
                      <!-- Star Rating Placeholder -->
                      <div class="flex items-center gap-0.5 mb-4">
                        @for (star of [1,2,3,4,5]; track star) {
                          <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        }
                        <span class="text-sm text-gray-500 ms-1">(0)</span>
                      </div>
                    </div>

                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <!-- Price -->
                      <div>
                        @if (isOnSale(product)) {
                          <div class="flex items-center gap-2">
                            <span class="text-2xl font-bold text-[var(--primary-color)]">
                              {{ product.price | currency:'EGP':'symbol':'1.2-2' }}
                            </span>
                            <span class="text-base text-gray-400 line-through">
                              {{ product.compareAtPrice | currency:'EGP':'symbol':'1.2-2' }}
                            </span>
                          </div>
                        } @else {
                          <span class="text-2xl font-bold text-gray-900">
                            {{ product.price | currency:'EGP':'symbol':'1.2-2' }}
                          </span>
                        }
                      </div>
                      <button
                        class="px-6 py-3 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:bg-[var(--primary-dark)] transition-colors duration-200 whitespace-nowrap"
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
            <p class="text-gray-600">{{ i18n.currentLanguage() === 'ar' ? 'لا توجد منتجات' : 'No products found' }}</p>
          </div>
        }
      </div>
    </section>
  `
})
export class GridListComponent implements OnInit {
  config = input.required<SectionConfigurationDto>();

  i18n = inject(I18nService);
  private productService = inject(ProductService);

  products = signal<any[]>([]);
  isLoading = signal(true);
  skeletons = [1, 2, 3, 4];

  ngOnInit() {
    const pageSize = this.settings?.pageSize ?? 8;
    this.productService.getFeaturedProducts(pageSize).subscribe({
      next: res => {
        this.products.set(res.items ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  isOnSale(product: any): boolean {
    return product.compareAtPrice != null && product.compareAtPrice > product.price;
  }

  sectionTitle(): string | null {
    return this.content?.title ?? null;
  }

  sectionSubtitle(): string | null {
    return this.content?.subtitle ?? null;
  }

  private get content(): any {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  }

  private get settings(): any {
    try { return this.config().settingsJson ? JSON.parse(this.config().settingsJson!) : {}; }
    catch { return {}; }
  }
}
