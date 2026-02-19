import { Component, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FeatureService } from '../../services/feature.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <!-- ───────── STANDARD ───────── -->
    @if (variant() === 'card-standard') {
      <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <a [routerLink]="['/products', product().slug]" class="block">
          <div class="aspect-square overflow-hidden bg-gray-100">
            @if (product().images?.length > 0) {
              <img
                [src]="product().images[0].url"
                [alt]="product().name"
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
        <div class="p-4">
          <a [routerLink]="['/products', product().slug]" class="block">
            <h3 class="text-base font-semibold text-gray-800 mb-2 hover:text-[var(--primary-color)] transition-colors line-clamp-2">
              {{ product().name }}
            </h3>
          </a>
          <div class="mb-4">
            @if (isOnSale()) {
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-[var(--primary-color)]">
                  {{ product().price | currency:'EGP':'symbol':'1.2-2' }}
                </span>
                <span class="text-sm text-gray-400 line-through">
                  {{ product().compareAtPrice | currency:'EGP':'symbol':'1.2-2' }}
                </span>
              </div>
            } @else {
              <span class="text-lg font-bold text-gray-800">
                {{ product().price | currency:'EGP':'symbol':'1.2-2' }}
              </span>
            }
          </div>
          <button
            class="w-full px-4 py-2 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:bg-[var(--primary-dark)] transition-colors duration-200"
            type="button"
          >
            Add to Cart
          </button>
        </div>
      </div>
    }

    <!-- ───────── MINIMAL ───────── -->
    @else if (variant() === 'card-minimal') {
      <a
        [routerLink]="['/products', product().slug]"
        class="group block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
      >
        <div class="relative aspect-square overflow-hidden bg-gray-100">
          @if (product().images?.length > 0) {
            <img
              [src]="product().images[0].url"
              [alt]="product().name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          } @else {
            <div class="w-full h-full flex items-center justify-center text-gray-300">
              <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          }
          <!-- Price overlay on hover -->
          <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            @if (isOnSale()) {
              <div class="text-center">
                <div class="text-xl font-bold text-white mb-1">
                  {{ product().price | currency:'EGP':'symbol':'1.2-2' }}
                </div>
                <div class="text-sm text-white/70 line-through">
                  {{ product().compareAtPrice | currency:'EGP':'symbol':'1.2-2' }}
                </div>
              </div>
            } @else {
              <div class="text-xl font-bold text-white">
                {{ product().price | currency:'EGP':'symbol':'1.2-2' }}
              </div>
            }
          </div>
        </div>
        <div class="p-3">
          <h3 class="text-sm font-medium text-gray-800 group-hover:text-[var(--primary-color)] transition-colors line-clamp-2">
            {{ product().name }}
          </h3>
        </div>
      </a>
    }

    <!-- ───────── DETAILED ───────── -->
    @else if (variant() === 'card-detailed') {
      <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        <a [routerLink]="['/products', product().slug]" class="block">
          <div class="relative aspect-square overflow-hidden bg-gray-100">
            @if (product().images?.length > 0) {
              <img
                [src]="product().images[0].url"
                [alt]="product().name"
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            } @else {
              <div class="w-full h-full flex items-center justify-center text-gray-300">
                <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            }
            @if (isOnSale()) {
              <span class="absolute top-2 start-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                -{{ discountPct() }}%
              </span>
            }
          </div>
        </a>
        <div class="p-4 flex flex-col flex-grow">
          <a [routerLink]="['/products', product().slug]" class="block">
            <h3 class="text-base font-semibold text-gray-800 mb-2 hover:text-[var(--primary-color)] transition-colors line-clamp-2">
              {{ product().name }}
            </h3>
          </a>
          <!-- Star Rating Placeholder -->
          <div class="flex items-center gap-0.5 mb-2">
            @for (star of [1,2,3,4,5]; track star) {
              <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            }
            <span class="text-xs text-gray-500 ms-1">(0)</span>
          </div>
          @if (product().description) {
            <p class="text-sm text-gray-500 mb-3 line-clamp-2 flex-grow">
              {{ product().description }}
            </p>
          }
          <div class="mt-auto">
            <div class="mb-3">
              @if (isOnSale()) {
                <div class="flex items-center gap-2">
                  <span class="text-lg font-bold text-[var(--primary-color)]">
                    {{ product().price | currency:'EGP':'symbol':'1.2-2' }}
                  </span>
                  <span class="text-sm text-gray-400 line-through">
                    {{ product().compareAtPrice | currency:'EGP':'symbol':'1.2-2' }}
                  </span>
                </div>
              } @else {
                <span class="text-lg font-bold text-gray-800">
                  {{ product().price | currency:'EGP':'symbol':'1.2-2' }}
                </span>
              }
            </div>
            <button
              class="w-full px-4 py-2 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:bg-[var(--primary-dark)] transition-colors duration-200"
              type="button"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ───────── OVERLAY ───────── -->
    @else if (variant() === 'card-overlay') {
      <a
        [routerLink]="['/products', product().slug]"
        class="group block relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 aspect-[3/4]"
      >
        @if (product().images?.length > 0) {
          <img
            [src]="product().images[0].url"
            [alt]="product().name"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        } @else {
          <div class="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-300">
            <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        }
        <!-- Gradient -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
        <!-- Content -->
        <div class="absolute inset-0 flex flex-col justify-end p-4">
          <div class="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 class="text-base font-bold text-white mb-2 line-clamp-2">
              {{ product().name }}
            </h3>
            <div class="flex items-center justify-between">
              @if (isOnSale()) {
                <div class="flex items-center gap-2">
                  <span class="text-lg font-bold text-white">
                    {{ product().price | currency:'EGP':'symbol':'1.2-2' }}
                  </span>
                  <span class="text-sm text-white/60 line-through">
                    {{ product().compareAtPrice | currency:'EGP':'symbol':'1.2-2' }}
                  </span>
                </div>
              } @else {
                <span class="text-lg font-bold text-white">
                  {{ product().price | currency:'EGP':'symbol':'1.2-2' }}
                </span>
              }
              <!-- Cart icon on hover -->
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div class="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            @if (isOnSale()) {
              <div class="mt-2">
                <span class="inline-block bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  SALE -{{ discountPct() }}%
                </span>
              </div>
            }
          </div>
        </div>
      </a>
    }
  `
})
export class ProductCardComponent {
  product = input.required<any>();

  private featureService = inject(FeatureService);
  variant = this.featureService.productCardVariant;

  isOnSale(): boolean {
    return this.product().compareAtPrice != null
      && this.product().compareAtPrice > this.product().price;
  }

  discountPct(): number {
    if (!this.isOnSale()) return 0;
    return Math.round((1 - this.product().price / this.product().compareAtPrice) * 100);
  }
}
