import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../../services/customer-auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface OrderDetail {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
  };
  items: Array<{
    id: string;
    productName: string;
    productSlug: string;
    variantAttributes?: { [key: string]: string };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  timeline: Array<{
    status: string;
    timestamp: string;
    description: string;
  }>;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto">
        <!-- Loading State -->
        @if (isLoading()) {
          <div class="bg-white shadow rounded-lg p-12 text-center">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600">جاري تحميل تفاصيل الطلب...</p>
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
              <a
                routerLink="/account/orders"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                العودة إلى الطلبات
              </a>
            </div>
          </div>
        }

        <!-- Order Details -->
        @if (!isLoading() && order()) {
          <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white shadow rounded-lg px-6 py-4">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-2xl font-bold text-gray-900">
                    طلب #{{ order()!.orderNumber }}
                  </h2>
                  <p class="mt-1 text-sm text-gray-500">
                    تاريخ الطلب: {{ formatDate(order()!.orderDate) }}
                  </p>
                </div>
                <span [class]="getStatusBadgeClass(order()!.status)">
                  {{ getStatusLabel(order()!.status) }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Main Content -->
              <div class="lg:col-span-2 space-y-6">
                <!-- Order Items -->
                <div class="bg-white shadow rounded-lg overflow-hidden">
                  <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">المنتجات</h3>
                  </div>
                  <div class="divide-y divide-gray-200">
                    @for (item of order()!.items; track item.id) {
                      <div class="px-6 py-4 flex items-start gap-4">
                        <div class="flex-1">
                          <a
                            [routerLink]="['/products', item.productSlug]"
                            class="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {{ item.productName }}
                          </a>
                          @if (item.variantAttributes) {
                            <div class="mt-1 text-sm text-gray-500">
                              @for (attr of getVariantAttributesList(item.variantAttributes); track attr.key) {
                                <span>{{ attr.key }}: {{ attr.value }}</span>
                                @if (!$last) { <span> • </span> }
                              }
                            </div>
                          }
                          <p class="mt-1 text-sm text-gray-500">
                            الكمية: {{ item.quantity }}
                          </p>
                        </div>
                        <div class="text-left">
                          <p class="text-sm font-medium text-gray-900">
                            {{ item.totalPrice.toFixed(2) }} ريال
                          </p>
                          <p class="text-xs text-gray-500">
                            {{ item.unitPrice.toFixed(2) }} ريال / وحدة
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                  <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div class="flex items-center justify-between">
                      <span class="text-base font-medium text-gray-900">الإجمالي</span>
                      <span class="text-lg font-bold text-gray-900">
                        {{ order()!.totalAmount.toFixed(2) }} ريال
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Order Timeline -->
                @if (order()!.timeline && order()!.timeline.length > 0) {
                  <div class="bg-white shadow rounded-lg overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                      <h3 class="text-lg font-medium text-gray-900">تتبع الطلب</h3>
                    </div>
                    <div class="px-6 py-4">
                      <div class="flow-root">
                        <ul class="-mb-8">
                          @for (event of order()!.timeline; track $index; let last = $last) {
                            <li>
                              <div class="relative pb-8">
                                @if (!last) {
                                  <span class="absolute top-4 right-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                }
                                <div class="relative flex space-x-3 items-start">
                                  <div>
                                    <span class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                      <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                      </svg>
                                    </span>
                                  </div>
                                  <div class="min-w-0 flex-1 pr-4 pt-1.5">
                                    <div>
                                      <p class="text-sm font-medium text-gray-900">
                                        {{ getStatusLabel(event.status) }}
                                      </p>
                                      <p class="mt-0.5 text-sm text-gray-500">
                                        {{ event.description }}
                                      </p>
                                    </div>
                                    <div class="mt-2 text-xs text-gray-500">
                                      {{ formatDate(event.timestamp) }}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          }
                        </ul>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Sidebar -->
              <div class="lg:col-span-1 space-y-6">
                <!-- Shipping Address -->
                <div class="bg-white shadow rounded-lg overflow-hidden">
                  <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">عنوان الشحن</h3>
                  </div>
                  <div class="px-6 py-4">
                    <div class="text-sm text-gray-600 space-y-1">
                      <p>{{ order()!.shippingAddress.street }}</p>
                      <p>{{ order()!.shippingAddress.city }}، {{ order()!.shippingAddress.state }}</p>
                      @if (order()!.shippingAddress.postalCode) {
                        <p>{{ order()!.shippingAddress.postalCode }}</p>
                      }
                      <p>{{ order()!.shippingAddress.country }}</p>
                      <p class="mt-2 font-medium">{{ order()!.shippingAddress.phoneNumber }}</p>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="bg-white shadow rounded-lg overflow-hidden">
                  <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">الإجراءات</h3>
                  </div>
                  <div class="px-6 py-4 space-y-3">
                    @if (order()!.status === 'delivered') {
                      <button
                        type="button"
                        class="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        طلب استرجاع
                      </button>
                    }
                    @if (order()!.status === 'pending') {
                      <button
                        type="button"
                        class="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                      >
                        إلغاء الطلب
                      </button>
                    }
                    <button
                      type="button"
                      class="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      تواصل مع الدعم
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Back Link -->
        <div class="mt-6">
          <a
            routerLink="/account/orders"
            class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <svg class="ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            العودة إلى الطلبات
          </a>
        </div>
      </div>
    </div>
  `
})
export class OrderDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(CustomerAuthService);

  readonly order = signal<OrderDetail | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/account/login']);
      return;
    }

    const orderId = this.route.snapshot.paramMap.get('id');
    if (!orderId) {
      this.router.navigate(['/account/orders']);
      return;
    }

    this.loadOrderDetail(orderId);
  }

  loadOrderDetail(orderId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<OrderDetail>(`${environment.apiUrl}/storefront/orders/${orderId}`).subscribe({
      next: (order) => {
        this.order.set(order);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'فشل تحميل تفاصيل الطلب. يرجى المحاولة مرة أخرى.');
        this.isLoading.set(false);
      }
    });
  }

  getVariantAttributesList(attributes: { [key: string]: string }): Array<{ key: string; value: string }> {
    return Object.entries(attributes).map(([key, value]) => ({ key, value }));
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
    const baseClass = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
