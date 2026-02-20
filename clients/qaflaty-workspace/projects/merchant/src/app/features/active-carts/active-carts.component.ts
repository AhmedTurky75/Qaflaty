import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActiveCartsService, ActiveCart, ActiveCartItem } from './services/active-carts.service';

@Component({
  selector: 'app-active-carts',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Active Shopping Carts</h1>
          <p class="text-sm text-gray-500 mt-1">
            Customers and anonymous guests who added items but haven't completed their order yet.
          </p>
        </div>
        <button
          type="button"
          (click)="loadCarts()"
          [disabled]="loading()"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <svg class="w-4 h-4" [class.animate-spin]="loading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Stats bar -->
      @if (!loading() && !error()) {
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <p class="text-sm text-gray-500">Active Carts</p>
            <p class="text-2xl font-bold text-gray-900">{{ carts().length }}</p>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <p class="text-sm text-gray-500">Total Items</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalItems() }}</p>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <p class="text-sm text-gray-500">Est. Revenue at Risk</p>
            <p class="text-2xl font-bold text-orange-600">{{ estimatedRevenue() | currency:'EGP':'symbol':'1.2-2' }}</p>
          </div>
        </div>
      }

      <!-- Error state -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-700">{{ error() }}</p>
        </div>
      }

      <!-- Loading state -->
      @if (loading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div class="flex-1">
                  <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div class="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
              <div class="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && !error() && carts().length === 0) {
        <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-1">No active carts</h3>
          <p class="text-sm text-gray-500">No authenticated customers have items in their cart right now.</p>
        </div>
      }

      <!-- Cart list -->
      @if (!loading() && !error() && carts().length > 0) {
        <div class="space-y-4">
          @for (cart of carts(); track cart.cartId) {
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <!-- Cart header -->
              <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                    {{ initials(cart.customerName) }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="font-semibold text-gray-900">{{ cart.customerName }}</p>
                      @if (cart.guestId) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Guest</span>
                      }
                    </div>
                    <p class="text-sm text-gray-500">{{ cart.customerEmail || 'Anonymous' }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">
                    {{ cart.totalItems }} item{{ cart.totalItems !== 1 ? 's' : '' }}
                  </p>
                  <p class="text-xs text-gray-400">
                    Last active {{ cart.lastUpdated | date:'short' }}
                  </p>
                </div>
              </div>

              <!-- Cart items -->
              <div class="divide-y divide-gray-50">
                @for (item of cart.items; track item.productId + (item.variantId ?? '')) {
                  <div class="px-6 py-3 flex items-center gap-4">
                    <!-- Product image -->
                    <div class="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      @if (item.productImageUrl) {
                        <img [src]="item.productImageUrl" [alt]="item.productName" class="w-full h-full object-cover" />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-gray-300">
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      }
                    </div>

                    <!-- Product info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ item.productName }}</p>
                      @if (item.variantId) {
                        <p class="text-xs text-gray-400">Has variant selected</p>
                      }
                    </div>

                    <!-- Qty & price -->
                    <div class="text-right flex-shrink-0">
                      <p class="text-sm font-semibold text-gray-900">
                        {{ item.unitPrice * item.quantity | currency:'EGP':'symbol':'1.2-2' }}
                      </p>
                      <p class="text-xs text-gray-400">
                        {{ item.quantity }} × {{ item.unitPrice | currency:'EGP':'symbol':'1.2-2' }}
                      </p>
                    </div>
                  </div>
                }
              </div>

              <!-- Cart footer: estimated total -->
              <div class="px-6 py-3 bg-gray-50 flex justify-between items-center">
                <p class="text-sm text-gray-500">Estimated total</p>
                <p class="text-base font-bold text-gray-900">
                  {{ cartTotal(cart) | currency:'EGP':'symbol':'1.2-2' }}
                </p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ActiveCartsComponent implements OnInit {
  private activeCartsService = inject(ActiveCartsService);

  carts = signal<ActiveCart[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  totalItems = computed(() => this.carts().reduce((sum, c) => sum + c.totalItems, 0));
  estimatedRevenue = computed(() =>
    this.carts().reduce((sum, c) => sum + this.cartTotal(c), 0)
  );

  ngOnInit(): void {
    this.loadCarts();
  }

  loadCarts(): void {
    const storeId = localStorage.getItem('currentStoreId') || '';
    if (!storeId) {
      this.error.set('Please select a store first.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.activeCartsService.getActiveCarts(storeId).subscribe({
      next: (carts) => {
        this.carts.set(carts);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load active carts.');
        this.loading.set(false);
      }
    });
  }

  cartTotal(cart: ActiveCart): number {
    return cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
}
