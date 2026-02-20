import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Cart, CartItem, getCartItemKey } from '../models/cart.model';
import { Product, ProductVariant } from '../models/product.model';
import { Money } from '../models/store.model';
import { CartApiService } from './cart-api.service';
import { CustomerAuthService } from './customer-auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'qaflaty_cart';

  private cartItems = signal<CartItem[]>([]);
  private deliveryFee = signal<Money>({ amount: 0, currency: 'SAR' });
  private freeDeliveryThreshold = signal<Money | null>(null);

  private cartApi = inject(CartApiService);
  private authService = inject(CustomerAuthService);

  private get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  // Computed values
  itemCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  subtotal = computed(() => {
    const total = this.cartItems().reduce((sum, item) =>
      sum + (item.unitPrice.amount * item.quantity), 0
    );
    return { amount: total, currency: 'SAR' };
  });

  total = computed(() => {
    const subtotalAmount = this.subtotal().amount;
    const threshold = this.freeDeliveryThreshold();
    const deliveryAmount = threshold && subtotalAmount >= threshold.amount
      ? 0
      : this.deliveryFee().amount;

    return {
      amount: subtotalAmount + deliveryAmount,
      currency: 'SAR'
    };
  });

  isFreeDelivery = computed(() => {
    const threshold = this.freeDeliveryThreshold();
    return threshold ? this.subtotal().amount >= threshold.amount : false;
  });

  cart = computed<Cart>(() => ({
    items: this.cartItems(),
    subtotal: this.subtotal(),
    deliveryFee: this.isFreeDelivery()
      ? { amount: 0, currency: 'SAR' }
      : this.deliveryFee(),
    total: this.total(),
    itemCount: this.itemCount()
  }));

  constructor() {
    // Load cart from localStorage on init
    this.loadCart();

    // Save cart to localStorage whenever it changes
    effect(() => {
      this.saveCart(this.cartItems());
    });
  }

  /**
   * Set delivery settings from store
   */
  setDeliverySettings(fee: Money, freeThreshold?: Money): void {
    this.deliveryFee.set(fee);
    this.freeDeliveryThreshold.set(freeThreshold || null);
  }

  /**
   * Add item to cart (with optional variant support).
   * Also persists to server when the customer is logged in.
   */
  addItem(product: Product, quantity: number = 1, variant?: ProductVariant): void {
    const items = [...this.cartItems()];
    const itemKey = getCartItemKey(product.id, variant?.id);
    const existingIndex = items.findIndex(item =>
      getCartItemKey(item.productId, item.variantId) === itemKey
    );

    const unitPrice = variant?.priceOverride ?? { amount: product.price, currency: 'EGP' };
    const maxQty = variant?.quantity ?? 99;

    if (existingIndex >= 0) {
      const newQuantity = Math.min(items[existingIndex].quantity + quantity, maxQty);
      items[existingIndex] = { ...items[existingIndex], quantity: newQuantity };
    } else {
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        unitPrice,
        quantity: Math.min(quantity, maxQty),
        imageUrl: product.images[0]?.url,
        maxQuantity: maxQty,
        variantId: variant?.id,
        variantAttributes: variant?.attributes,
        variantSku: variant?.sku
      };
      items.push(newItem);
    }

    this.cartItems.set(items);

    // Persist to server (fire-and-forget)
    if (this.isLoggedIn) {
      this.cartApi.addItem(product.id, quantity, variant?.id);
    } else {
      this.cartApi.addGuestItem(product.id, quantity, variant?.id);
    }
  }

  /**
   * Update item quantity (supports variants via itemKey).
   * Also persists to server when the customer is logged in.
   */
  updateQuantity(productId: string, quantity: number, variantId?: string): void {
    const targetKey = getCartItemKey(productId, variantId);
    const items = this.cartItems().map(item => {
      const itemKey = getCartItemKey(item.productId, item.variantId);
      if (itemKey === targetKey) {
        return { ...item, quantity: Math.min(Math.max(1, quantity), item.maxQuantity) };
      }
      return item;
    });
    this.cartItems.set(items);

    if (this.isLoggedIn) {
      this.cartApi.updateItemQuantity(productId, quantity, variantId);
    } else {
      this.cartApi.updateGuestItemQuantity(productId, quantity, variantId);
    }
  }

  /**
   * Remove item from cart (supports variants via itemKey).
   * Also persists to server when the customer is logged in.
   */
  removeItem(productId: string, variantId?: string): void {
    const targetKey = getCartItemKey(productId, variantId);
    const items = this.cartItems().filter(item =>
      getCartItemKey(item.productId, item.variantId) !== targetKey
    );
    this.cartItems.set(items);

    if (this.isLoggedIn) {
      this.cartApi.removeItem(productId, variantId);
    } else {
      this.cartApi.removeGuestItem(productId, variantId);
    }
  }

  /**
   * Clear cart.
   * Also clears on server when the customer is logged in.
   */
  clear(): void {
    this.cartItems.set([]);

    if (this.isLoggedIn) {
      this.cartApi.clearCart();
    } else {
      this.cartApi.clearGuestCart();
    }
  }

  /**
   * Get item by product ID and optional variant ID
   */
  getItem(productId: string, variantId?: string): CartItem | undefined {
    const targetKey = getCartItemKey(productId, variantId);
    return this.cartItems().find(item =>
      getCartItemKey(item.productId, item.variantId) === targetKey
    );
  }

  /**
   * Check if product (with optional variant) is in cart
   */
  hasItem(productId: string, variantId?: string): boolean {
    const targetKey = getCartItemKey(productId, variantId);
    return this.cartItems().some(item =>
      getCartItemKey(item.productId, item.variantId) === targetKey
    );
  }

  /**
   * Save cart to localStorage
   */
  private saveCart(items: CartItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }

  /**
   * Load cart from localStorage
   */
  private loadCart(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as CartItem[];
        this.cartItems.set(items);
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }
}
