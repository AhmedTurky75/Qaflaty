import { Component, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-card-minimal',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <a
      [routerLink]="['/products', product().slug]"
      class="group block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div class="relative aspect-square overflow-hidden bg-gray-100">
        @if (product().images && product().images.length > 0) {
          <img
            [src]="product().images[0].url"
            [alt]="i18n.getText(product().name)"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        } @else {
          <div class="w-full h-full flex items-center justify-center text-gray-400">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        }
        <!-- Price overlay - visible on hover -->
        <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          @if (product().pricing?.salePrice && product().pricing.salePrice < product().pricing.regularPrice) {
            <div class="text-center">
              <div class="text-2xl font-bold text-white mb-1">
                {{ product().pricing.salePrice | currency:'EGP':'symbol':'1.2-2' }}
              </div>
              <div class="text-sm text-white/80 line-through">
                {{ product().pricing.regularPrice | currency:'EGP':'symbol':'1.2-2' }}
              </div>
            </div>
          } @else {
            <div class="text-2xl font-bold text-white">
              {{ product().pricing?.regularPrice | currency:'EGP':'symbol':'1.2-2' }}
            </div>
          }
        </div>
      </div>
      <div class="p-3">
        <h3 class="text-base font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
          {{ i18n.getText(product().name) }}
        </h3>
      </div>
    </a>
  `
})
export class CardMinimalComponent {
  product = input.required<any>();
  i18n = inject(I18nService);
}
