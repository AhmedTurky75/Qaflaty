import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../../services/customer-auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface OrderSummary {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  itemCount: number;
}

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900">طلباتي</h2>
          <p class="mt-1 text-sm text-gray-600">عرض وتتبع جميع طلباتك</p>
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="bg-white shadow rounded-lg p-12 text-center">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600">جاري تحميل الطلبات...</p>
          </div>
        }

        <!-- Error State -->
        @if (errorMessage()) {
          <div class="bg-white shadow rounded-lg p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">حدث خطأ</h3>
            <p class="mt-1 text-sm text-gray-500">{{ errorMessage() }}</p>
            <div class="mt-6">
              <button
                type="button"
                (click)="loadOrders()"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && !errorMessage() && orders().length === 0) {
          <div class="bg-white shadow rounded-lg p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">لا توجد طلبات</h3>
            <p class="mt-1 text-sm text-gray-500">لم تقم بإنشاء أي طلبات بعد</p>
            <div class="mt-6">
              <a
                routerLink="/"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                تصفح المنتجات
              </a>
            </div>
          </div>
        }

        <!-- Orders List -->
        @if (!isLoading() && orders().length > 0) {
          <div class="space-y-4">
            @for (order of orders(); track order.id) {
              <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-4">
                      <h3 class="text-lg font-medium text-gray-900">
                        طلب #{{ order.orderNumber }}
                      </h3>
                      <span [class]="getStatusBadgeClass(order.status)">
                        {{ getStatusLabel(order.status) }}
                      </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-500">
                      تاريخ الطلب: {{ formatDate(order.orderDate) }}
                    </p>
                  </div>
                  <div class="text-left">
                    <p class="text-sm text-gray-500">الإجمالي</p>
                    <p class="text-lg font-bold text-gray-900">
                      {{ order.totalAmount.toFixed(2) }} ريال
                    </p>
                  </div>
                </div>
                <div class="px-6 py-4 bg-gray-50 flex items-center justify-between">
                  <div class="text-sm text-gray-600">
                    <span class="font-medium">{{ order.itemCount }}</span> منتج
                  </div>
                  <a
                    [routerLink]="['/account/orders', order.id]"
                    class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    عرض التفاصيل
                    <svg class="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            }
          </div>

          <!-- Pagination (placeholder for future) -->
          @if (orders().length >= 10) {
            <div class="mt-6 flex justify-center">
              <p class="text-sm text-gray-500">عرض جميع الطلبات</p>
            </div>
          }
        }

        <!-- Back Link -->
        <div class="mt-6">
          <a
            routerLink="/account/profile"
            class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <svg class="ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            العودة إلى الملف الشخصي
          </a>
        </div>
      </div>
    </div>
  `
})
export class OrderHistoryComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(CustomerAuthService);
  private readonly router = inject(Router);

  readonly orders = signal<OrderSummary[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/account/login']);
      return;
    }

    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<OrderSummary[]>(`${environment.apiUrl}/storefront/orders`).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'فشل تحميل الطلبات. يرجى المحاولة مرة أخرى.');
        this.isLoading.set(false);
      }
    });
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'processing': 'قيد المعالجة',
      'shipped': 'تم الشحن',
      'delivered': 'تم التوصيل',
      'cancelled': 'ملغي',
      'refunded': 'تم الاسترجاع'
    };
    return statusMap[status.toLowerCase()] || status;
  }

  getStatusBadgeClass(status: string): string {
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const statusClass: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    return `${baseClass} ${statusClass[status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
