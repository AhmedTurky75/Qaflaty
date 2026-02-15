import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, LowStockItem } from '../../services/dashboard.service';
import { StoreContextService } from '../../../../core/services/store-context.service';

@Component({
  selector: 'app-low-stock-alerts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          Low Stock Alerts
        </h3>
        @if (items().length > 0) {
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {{ items().length }} items
          </span>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center py-6">
          <svg class="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      } @else if (items().length === 0) {
        <div class="text-center py-6 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-green-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>All products are well stocked!</p>
        </div>
      } @else {
        <div class="space-y-3 max-h-64 overflow-y-auto">
          @for (item of items(); track item.productId + (item.variantId || '')) {
            <div class="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div class="flex-1 min-w-0">
                <a
                  [routerLink]="['/products', item.productId]"
                  class="font-medium text-gray-900 hover:text-primary truncate block"
                >
                  {{ item.productName }}
                </a>
                @if (item.variantAttributes) {
                  <p class="text-xs text-gray-500">
                    {{ formatAttributes(item.variantAttributes) }}
                  </p>
                }
                <p class="text-xs text-gray-500">SKU: {{ item.sku }}</p>
              </div>
              <div class="text-right ml-4">
                <span class="text-lg font-bold" [class.text-red-600]="item.quantity === 0" [class.text-orange-600]="item.quantity > 0">
                  {{ item.quantity }}
                </span>
                <p class="text-xs text-gray-500">in stock</p>
              </div>
            </div>
          }
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100">
          <a
            routerLink="/products"
            [queryParams]="{ lowStock: true }"
            class="text-sm text-primary hover:text-primary-dark font-medium"
          >
            View all low stock items &rarr;
          </a>
        </div>
      }
    </div>
  `
})
export class LowStockAlertsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private storeContext = inject(StoreContextService);

  loading = signal(true);
  items = signal<LowStockItem[]>([]);

  ngOnInit(): void {
    this.loadLowStockItems();
  }

  loadLowStockItems(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      this.loading.set(false);
      return;
    }

    this.dashboardService.getLowStockItems(storeId).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load low stock items:', err);
        this.loading.set(false);
      }
    });
  }

  formatAttributes(attributes: Record<string, string>): string {
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
}
