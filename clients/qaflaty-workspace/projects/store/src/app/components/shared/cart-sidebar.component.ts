import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, switchMap, catchError, of } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { OrderCalculation } from '../../models/order.model';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-sidebar.component.html',
  styleUrls: ['./cart-sidebar.component.css']
})
export class CartSidebarComponent {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private destroyRef = inject(DestroyRef);

  cart = this.cartService.cart;
  isOpen = signal<boolean>(false);
  calculation = signal<OrderCalculation | null>(null);
  calculationLoading = signal(false);

  constructor() {
    window.addEventListener('toggle-cart', () => {
      this.toggle();
    });

    toObservable(this.cart).pipe(
      debounceTime(300),
      switchMap(cart => {
        if (cart.items.length === 0) {
          this.calculation.set(null);
          this.calculationLoading.set(false);
          return of(null);
        }
        this.calculationLoading.set(true);
        return this.orderService.calculateOrder({
          items: cart.items.map(i => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId })),
          countryCode: 0
        }).pipe(
          catchError(() => {
            this.calculationLoading.set(false);
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result !== null) {
        this.calculation.set(result);
      }
      this.calculationLoading.set(false);
    });
  }

  toggle() {
    this.isOpen.update(v => !v);
  }

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  updateQuantity(productId: string, quantity: number, variantId?: string) {
    this.cartService.updateQuantity(productId, quantity, variantId);
  }

  removeItem(productId: string, variantId?: string) {
    this.cartService.removeItem(productId, variantId);
  }

  /**
   * Format variant attributes as a readable string
   * e.g., {"Color": "Red", "Size": "M"} => "Color: Red, Size: M"
   */
  formatVariantAttributes(attributes?: Record<string, string>): string {
    if (!attributes) return '';
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  /**
   * Generate a unique key for tracking items with variants
   */
  getItemTrackKey(item: { productId: string; variantId?: string }): string {
    return item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
  }
}
