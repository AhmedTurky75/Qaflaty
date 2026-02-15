import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-sidebar.component.html',
  styleUrls: ['./cart-sidebar.component.css']
})
export class CartSidebarComponent {
  private cartService = inject(CartService);

  cart = this.cartService.cart;
  isOpen = signal<boolean>(false);

  constructor() {
    // Listen for toggle cart event
    window.addEventListener('toggle-cart', () => {
      this.toggle();
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
