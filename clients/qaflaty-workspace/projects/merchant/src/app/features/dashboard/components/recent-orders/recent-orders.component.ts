import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecentOrderSummary } from '../../services/dashboard.service';

@Component({
  selector: 'app-recent-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Recent Orders</h3>
        <a
          routerLink="/orders"
          class="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </a>
      </div>

      @if (orders && orders.length > 0) {
        <div class="space-y-3">
          @for (order of orders; track order.id) {
            <a
              [routerLink]="['/orders', order.id]"
              class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-sm font-semibold text-gray-900">{{ order.orderNumber }}</span>
                  <span
                    [class]="getStatusBadgeClass(order.status)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ order.status }}
                  </span>
                </div>
                <p class="text-xs text-gray-500">{{ order.customerName }} • {{ formatDate(order.createdAt) }}</p>
              </div>
              <div class="text-right ml-4">
                <p class="text-sm font-semibold text-gray-900">{{ formatCurrency(order.total.amount) }}</p>
              </div>
            </a>
          }
        </div>
      } @else {
        <div class="text-center py-8 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p class="mt-2 text-sm">No orders yet</p>
        </div>
      }
    </div>
  `
})
export class RecentOrdersComponent {
  @Input() orders: RecentOrderSummary[] = [];

  getStatusBadgeClass(status: string): string {
    const baseClass = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
