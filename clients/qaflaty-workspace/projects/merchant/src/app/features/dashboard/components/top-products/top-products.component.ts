import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TopProduct } from '../../services/dashboard.service';

@Component({
  selector: 'app-top-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Top Products</h3>
        <a
          routerLink="/products"
          class="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </a>
      </div>

      @if (products && products.length > 0) {
        <div class="space-y-4">
          @for (product of products; track product.id) {
            <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div class="flex items-center space-x-3 flex-1">
                @if (product.imageUrl) {
                  <img
                    [src]="product.imageUrl"
                    [alt]="product.name"
                    class="h-12 w-12 rounded-lg object-cover"
                  />
                } @else {
                  <div class="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                    <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</p>
                  <p class="text-xs text-gray-500">{{ product.salesCount }} sold</p>
                </div>
              </div>
              <div class="text-right ml-4">
                <p class="text-sm font-semibold text-gray-900">{{ formatCurrency(product.revenue.amount) }}</p>
                <p class="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="text-center py-8 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p class="mt-2 text-sm">No product sales yet</p>
        </div>
      }
    </div>
  `
})
export class TopProductsComponent {
  @Input() products: TopProduct[] = [];

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
