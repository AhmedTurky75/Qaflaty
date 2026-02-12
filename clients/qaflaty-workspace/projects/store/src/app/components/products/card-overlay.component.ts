import { Component, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-card-overlay',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <a
      [routerLink]="['/products', product().slug]"
      class="group block relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 aspect-[3/4]"
    >
      <!-- Background Image -->
      @if (product().images && product().images.length > 0) {
        <img
          [src]="product().images[0].url"
          [alt]="i18n.getText(product().name)"
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      } @else {
        <div class="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400">
          <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      }

      <!-- Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

      <!-- Content Overlay -->
      <div class="absolute inset-0 flex flex-col justify-end p-4">
        <div class="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 class="text-lg font-bold text-white mb-2 line-clamp-2">
            {{ i18n.getText(product().name) }}
          </h3>

          <div class="flex items-center justify-between">
            @if (product().pricing?.salePrice && product().pricing.salePrice < product().pricing.regularPrice) {
              <div class="flex items-center gap-2">
                <span class="text-xl font-bold text-white">
                  {{ product().pricing.salePrice | currency:'EGP':'symbol':'1.2-2' }}
                </span>
                <span class="text-sm text-white/70 line-through">
                  {{ product().pricing.regularPrice | currency:'EGP':'symbol':'1.2-2' }}
                </span>
              </div>
            } @else {
              <span class="text-xl font-bold text-white">
                {{ product().pricing?.regularPrice | currency:'EGP':'symbol':'1.2-2' }}
              </span>
            }

            <!-- Add to Cart Icon -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Sale Badge -->
          @if (product().pricing?.salePrice && product().pricing.salePrice < product().pricing.regularPrice) {
            <div class="mt-2">
              <span class="inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {{ i18n.currentLanguage() === 'ar' ? 'خصم' : 'SALE' }}
                {{ Math.round((1 - product().pricing.salePrice / product().pricing.regularPrice) * 100) }}%
              </span>
            </div>
          }
        </div>
      </div>
    </a>
  `
})
export class CardOverlayComponent {
  product = input.required<any>();
  i18n = inject(I18nService);
  protected readonly Math = Math;
}
