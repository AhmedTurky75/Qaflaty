import { Component, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-card-standard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <a [routerLink]="['/products', product().slug]" class="block">
        <div class="aspect-square overflow-hidden bg-gray-100">
          @if (product().images && product().images.length > 0) {
            <img
              [src]="product().images[0].url"
              [alt]="i18n.getText(product().name)"
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
      <div class="p-4">
        <a [routerLink]="['/products', product().slug]" class="block">
          <h3 class="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
            {{ i18n.getText(product().name) }}
          </h3>
        </a>
        <div class="flex items-center justify-between mb-4">
          <div>
            @if (product().pricing?.salePrice && product().pricing.salePrice < product().pricing.regularPrice) {
              <div class="flex items-center gap-2">
                <span class="text-xl font-bold text-blue-600">
                  {{ product().pricing.salePrice | currency:'EGP':'symbol':'1.2-2' }}
                </span>
                <span class="text-sm text-gray-500 line-through">
                  {{ product().pricing.regularPrice | currency:'EGP':'symbol':'1.2-2' }}
                </span>
              </div>
            } @else {
              <span class="text-xl font-bold text-gray-800">
                {{ product().pricing?.regularPrice | currency:'EGP':'symbol':'1.2-2' }}
              </span>
            }
          </div>
        </div>
        <button
          class="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          type="button"
        >
          {{ i18n.currentLanguage() === 'ar' ? 'أضف إلى السلة' : 'Add to Cart' }}
        </button>
      </div>
    </div>
  `
})
export class CardStandardComponent {
  product = input.required<any>();
  i18n = inject(I18nService);
}
