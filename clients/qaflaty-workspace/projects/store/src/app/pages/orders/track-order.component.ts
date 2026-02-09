import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { OrderTracking, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="container mx-auto px-4 max-w-4xl">
        <h1 class="text-3xl font-bold mb-8">Track Your Order</h1>

        <!-- Search Form -->
        @if (!order()) {
          <div class="bg-white rounded-lg shadow p-8 mb-8">
            <h2 class="text-xl font-semibold mb-4">Enter Your Order Number</h2>
            <p class="text-gray-600 mb-6">
              You can find your order number in the confirmation email or SMS we sent you.
            </p>
            <form (ngSubmit)="trackOrder()" class="flex gap-4">
              <input
                type="text"
                [(ngModel)]="orderNumberInput"
                name="orderNumber"
                placeholder="QAF-XXXXXX"
                class="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                required
              >
              <button
                type="submit"
                [disabled]="loading()"
                class="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold disabled:opacity-50"
              >
                @if (loading()) {
                  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                } @else {
                  Track Order
                }
              </button>
            </form>
            @if (errorMessage()) {
              <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-red-800 text-sm">{{ errorMessage() }}</p>
              </div>
            }
          </div>
        }

        <!-- Order Details -->
        @if (order()) {
          <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 class="text-2xl font-bold mb-2">Order {{ order()!.orderNumber }}</h2>
                  <p class="text-gray-600">
                    Placed on {{ formatDate(order()!.createdAt) }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-full font-semibold text-sm"
                    [class]="getStatusClass(order()!.status)">
                    {{ order()!.status }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Order Status Timeline -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-xl font-semibold mb-6">Order Status</h3>
              <div class="space-y-6">
                @for (status of order()!.statusHistory; track $index) {
                  <div class="flex gap-4">
                    <!-- Timeline Dot -->
                    <div class="flex flex-col items-center">
                      <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        [class.bg-primary]="$index === 0"
                        [class.text-white]="$index === 0"
                        [class.bg-gray-200]="$index !== 0"
                        [class.text-gray-600]="$index !== 0">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                      </div>
                      @if ($index < order()!.statusHistory.length - 1) {
                        <div class="w-0.5 h-12 bg-gray-200"></div>
                      }
                    </div>

                    <!-- Status Info -->
                    <div class="flex-1 pb-8">
                      <p class="font-semibold text-gray-900">{{ status.toStatus }}</p>
                      <p class="text-sm text-gray-600">{{ formatDate(status.changedAt) }}</p>
                      @if (status.notes) {
                        <p class="text-sm text-gray-600 mt-2">{{ status.notes }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Order Items -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-xl font-semibold mb-4">Order Items</h3>
              <div class="space-y-4">
                @for (item of order()!.items; track $index) {
                  <div class="flex justify-between items-center py-3 border-b last:border-0">
                    <div>
                      <p class="font-medium">{{ item.productName }}</p>
                      <p class="text-sm text-gray-600">
                        {{ item.unitPrice.amount.toFixed(2) }} {{ item.unitPrice.currency }} × {{ item.quantity }}
                      </p>
                    </div>
                    <p class="font-semibold">
                      {{ item.total.amount.toFixed(2) }} {{ item.total.currency }}
                    </p>
                  </div>
                }
              </div>
            </div>

            <!-- Delivery Info -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-xl font-semibold mb-4">Delivery Information</h3>
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-gray-600">Delivery Address</p>
                  <p class="font-medium">{{ order()!.delivery.address }}</p>
                </div>
                @if (order()!.delivery.instructions) {
                  <div>
                    <p class="text-sm text-gray-600">Special Instructions</p>
                    <p class="font-medium">{{ order()!.delivery.instructions }}</p>
                  </div>
                }
              </div>
            </div>

            <!-- Order Summary -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-xl font-semibold mb-4">Order Summary</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Subtotal</span>
                  <span class="font-medium">
                    {{ order()!.pricing.subtotal.amount.toFixed(2) }} {{ order()!.pricing.subtotal.currency }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Delivery Fee</span>
                  <span class="font-medium">
                    {{ order()!.pricing.deliveryFee.amount.toFixed(2) }} {{ order()!.pricing.deliveryFee.currency }}
                  </span>
                </div>
                <div class="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total</span>
                  <span>{{ order()!.pricing.total.amount.toFixed(2) }} {{ order()!.pricing.total.currency }}</span>
                </div>
                <div class="pt-3 border-t">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Payment Method</span>
                    <span class="font-medium">{{ order()!.payment.method }}</span>
                  </div>
                  <div class="flex justify-between mt-2">
                    <span class="text-gray-600">Payment Status</span>
                    <span class="font-medium" [class.text-green-600]="order()!.payment.status === 'Paid'">
                      {{ order()!.payment.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Track Another Order -->
            <div class="text-center">
              <button
                (click)="resetSearch()"
                class="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Track Another Order
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TrackOrderComponent {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);

  order = signal<OrderTracking | null>(null);
  orderNumberInput = signal<string>('');
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit() {
    // Check if order number is in query params
    this.route.queryParams.subscribe(params => {
      const orderNumber = params['orderNumber'];
      if (orderNumber) {
        this.orderNumberInput.set(orderNumber);
        this.trackOrder();
      }
    });
  }

  trackOrder() {
    const orderNumber = this.orderNumberInput().trim();
    if (!orderNumber) {
      this.errorMessage.set('Please enter an order number');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.orderService.trackOrder(orderNumber).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to track order:', error);
        this.errorMessage.set(
          error.error?.message || 'Order not found. Please check your order number and try again.'
        );
        this.loading.set(false);
      }
    });
  }

  resetSearch() {
    this.order.set(null);
    this.orderNumberInput.set('');
    this.errorMessage.set('');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.Confirmed]: 'bg-blue-100 text-blue-800',
      [OrderStatus.Processing]: 'bg-purple-100 text-purple-800',
      [OrderStatus.Shipped]: 'bg-indigo-100 text-indigo-800',
      [OrderStatus.Delivered]: 'bg-green-100 text-green-800',
      [OrderStatus.Cancelled]: 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}
