import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { I18nService, TRANSLATIONS } from '../../services/i18n.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">{{ t('cart') }}</h1>

        @if (cart.cart().items.length === 0) {
          <!-- Empty Cart State -->
          <div class="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <h2 class="text-2xl font-semibold text-gray-700 mb-2">{{ t('empty_cart') }}</h2>
            <p class="text-gray-500 mb-6">{{ i18n.currentLanguage() === 'ar' ? 'لم تقم بإضافة أي منتجات بعد' : 'You haven\'t added any items yet' }}</p>
            <a routerLink="/products" class="inline-block px-6 py-3 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90 transition-opacity">
              {{ t('continue_shopping') }}
            </a>
          </div>
        } @else {
          <!-- Cart with Items -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Cart Items -->
            <div class="lg:col-span-2 space-y-4">
              @for (item of cart.cart().items; track item.productId) {
                <div class="bg-white rounded-lg shadow-sm p-4 flex gap-4">
                  <!-- Product Image -->
                  <div class="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" [alt]="item.productName" class="w-full h-full object-cover" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-gray-400">
                        <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    }
                  </div>

                  <!-- Product Details -->
                  <div class="flex-1 min-w-0">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ item.productName }}</h3>
                    <p class="text-[var(--primary-color)] font-semibold mb-2">
                      {{ item.unitPrice.amount | number: '1.2-2' }} {{ item.unitPrice.currency }}
                    </p>

                    <div class="flex items-center gap-4">
                      <!-- Quantity Controls -->
                      <div class="flex items-center border border-gray-300 rounded-lg">
                        <button
                          (click)="decreaseQuantity(item.productId)"
                          [disabled]="item.quantity <= 1"
                          class="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                          </svg>
                        </button>
                        <span class="px-4 py-1 text-gray-900 font-medium min-w-[3rem] text-center">{{ item.quantity }}</span>
                        <button
                          (click)="increaseQuantity(item.productId)"
                          [disabled]="item.quantity >= item.maxQuantity"
                          class="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      <!-- Item Total -->
                      <span class="text-gray-900 font-semibold">
                        {{ (item.unitPrice.amount * item.quantity) | number: '1.2-2' }} {{ item.unitPrice.currency }}
                      </span>
                    </div>
                  </div>

                  <!-- Remove Button -->
                  <button
                    (click)="removeItem(item.productId)"
                    class="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              }
            </div>

            <!-- Order Summary -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <h2 class="text-xl font-bold text-gray-900 mb-4">{{ i18n.currentLanguage() === 'ar' ? 'ملخص الطلب' : 'Order Summary' }}</h2>

                <div class="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <div class="flex justify-between text-gray-600">
                    <span>{{ t('subtotal') }}</span>
                    <span>{{ cart.cart().subtotal.amount | number: '1.2-2' }} {{ cart.cart().subtotal.currency }}</span>
                  </div>
                  <div class="flex justify-between text-gray-600">
                    <span>{{ t('delivery') }}</span>
                    @if (cart.isFreeDelivery()) {
                      <span class="text-green-600 font-medium">{{ t('free_delivery') }}</span>
                    } @else {
                      <span>{{ cart.cart().deliveryFee.amount | number: '1.2-2' }} {{ cart.cart().deliveryFee.currency }}</span>
                    }
                  </div>
                </div>

                <div class="flex justify-between text-lg font-bold text-gray-900 mb-6">
                  <span>{{ t('total') }}</span>
                  <span>{{ cart.cart().total.amount | number: '1.2-2' }} {{ cart.cart().total.currency }}</span>
                </div>

                <button class="w-full bg-[var(--primary-color)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity mb-3">
                  {{ t('checkout') }}
                </button>

                <a routerLink="/products" class="block w-full text-center py-3 text-[var(--primary-color)] font-medium hover:underline">
                  {{ t('continue_shopping') }}
                </a>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class CartPageComponent {
  cart = inject(CartService);
  i18n = inject(I18nService);

  t(key: string): string {
    const lang = this.i18n.currentLanguage();
    return TRANSLATIONS[lang]?.[key] ?? key;
  }

  increaseQuantity(productId: string): void {
    const item = this.cart.getItem(productId);
    if (item) {
      this.cart.updateQuantity(productId, item.quantity + 1);
    }
  }

  decreaseQuantity(productId: string): void {
    const item = this.cart.getItem(productId);
    if (item && item.quantity > 1) {
      this.cart.updateQuantity(productId, item.quantity - 1);
    }
  }

  removeItem(productId: string): void {
    this.cart.removeItem(productId);
  }
}
