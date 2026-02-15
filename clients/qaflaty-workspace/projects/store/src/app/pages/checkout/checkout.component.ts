import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { getCartItemKey } from '../../models/cart.model';
import { OrderService } from '../../services/order.service';
import { StoreService } from '../../services/store.service';
import { CreateOrderRequest, PaymentMethod } from '../../models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private storeService = inject(StoreService);
  private router = inject(Router);

  cart = this.cartService.cart;
  store = this.storeService.currentStore;
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  checkoutForm: FormGroup;

  constructor() {
    this.checkoutForm = this.fb.group({
      // Customer Info
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+966|966|05)[0-9]{8,9}$/)]],
      email: ['', [Validators.email]],

      // Delivery Address
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      district: [''],
      additionalInstructions: [''],

      // Payment
      paymentMethod: ['CashOnDelivery', [Validators.required]],

      // Notes
      notes: ['']
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Generate a unique key for tracking cart items with variants
   */
  getItemKey(item: { productId: string; variantId?: string }): string {
    return getCartItemKey(item.productId, item.variantId);
  }

  /**
   * Format variant attributes as a readable string
   */
  formatVariantAttributes(attributes?: Record<string, string>): string {
    if (!attributes) return '';
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  submitOrder() {
    if (this.checkoutForm.invalid) {
      Object.keys(this.checkoutForm.controls).forEach(key => {
        this.checkoutForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const formValue = this.checkoutForm.value;

    const request: CreateOrderRequest = {
      customerInfo: {
        fullName: formValue.fullName,
        phone: formValue.phone,
        email: formValue.email || undefined
      },
      deliveryAddress: {
        street: formValue.street,
        city: formValue.city,
        district: formValue.district || undefined,
        additionalInstructions: formValue.additionalInstructions || undefined
      },
      items: this.cart().items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId,
        variantAttributes: item.variantAttributes
      })),
      paymentMethod: formValue.paymentMethod as PaymentMethod,
      notes: formValue.notes || undefined
    };

    this.orderService.placeOrder(request).subscribe({
      next: (response) => {
        // Clear cart
        this.cartService.clear();

        // Navigate to confirmation page
        this.router.navigate(['/order-confirmation', response.orderNumber]);
      },
      error: (error) => {
        console.error('Failed to place order:', error);
        this.errorMessage.set(
          error.error?.message || 'Failed to place order. Please try again.'
        );
        this.submitting.set(false);
      }
    });
  }
}
