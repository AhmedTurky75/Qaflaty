import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-16">
      <div class="container mx-auto px-4 max-w-2xl">
        <div class="bg-white rounded-lg shadow-lg p-8 text-center">
          <!-- Success Icon -->
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>

          <!-- Success Message -->
          <h1 class="text-3xl font-bold text-gray-900 mb-4">
            Order Placed Successfully!
          </h1>
          <p class="text-lg text-gray-600 mb-8">
            Thank you for your order. We'll start processing it right away.
          </p>

          <!-- Order Number -->
          <div class="bg-gray-50 rounded-lg p-6 mb-8">
            <p class="text-sm text-gray-600 mb-2">Your Order Number</p>
            <p class="text-3xl font-bold text-primary">{{ orderNumber() }}</p>
          </div>

          <!-- Next Steps -->
          <div class="mb-8 text-left bg-blue-50 rounded-lg p-6">
            <h2 class="font-semibold text-lg mb-4 text-center">What's Next?</h2>
            <ul class="space-y-3">
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                  <p class="font-medium text-gray-900">Order Confirmation</p>
                  <p class="text-sm text-gray-600">You'll receive a confirmation call from the store soon</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                  <p class="font-medium text-gray-900">Preparation</p>
                  <p class="text-sm text-gray-600">Your order will be prepared and packed</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                  <p class="font-medium text-gray-900">Delivery</p>
                  <p class="text-sm text-gray-600">Your order will be delivered to your address</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              [routerLink]="['/track-order']"
              [queryParams]="{orderNumber: orderNumber()}"
              class="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Track Your Order
            </a>

            <a
              [routerLink]="['/']"
              class="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Return to Home
            </a>
          </div>

          <!-- Help Text -->
          <div class="mt-8 pt-8 border-t">
            <p class="text-sm text-gray-600">
              Need help? Save your order number <span class="font-semibold">{{ orderNumber() }}</span> for reference.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class OrderConfirmationComponent {
  private route = inject(ActivatedRoute);
  private storeService = inject(StoreService);

  store = this.storeService.currentStore;
  orderNumber = signal<string>('');

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderNumber.set(params['orderNumber'] || '');
    });
  }
}
