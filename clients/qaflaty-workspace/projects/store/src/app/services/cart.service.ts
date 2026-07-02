import { Injectable, signal, computed, inject } from '@angular/core';
import { BackendCart, Cart, CartItem, getCartItemKey } from '../models/cart.model';
import { Product, ProductVariant } from '../models/product.model';
import { Money } from '../models/store.model';
import { CartApiService } from './cart-api.service';
import { CustomerAuthService } from './customer-auth.service';
import { GuestSessionService } from './guest-session.service';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = signal<CartItem[]>([]);
  private deliveryFee = signal<Money>({ amount: 0, currency: 'EGP' });
  private freeDeliveryThreshold = signal<Money | null>(null);

  cartLoading = signal(false);

  private cartApi = inject(CartApiService);
  private authService = inject(CustomerAuthService);
  private guestSession = inject(GuestSessionService);
  private config = inject(ConfigService);

  /** The store's single currency code; every cart Money carries it. */
  private get currency(): string {
    return this.config.config()?.currency ?? 'EGP';
  }

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
    return { amount: total, currency: this.currency };
  });

  total = computed(() => {
    const subtotalAmount = this.subtotal().amount;
    const threshold = this.freeDeliveryThreshold();
    const deliveryAmount = threshold && subtotalAmount >= threshold.amount
      ? 0
      : this.deliveryFee().amount;

    return {
      amount: subtotalAmount + deliveryAmount,
      currency: this.currency
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
      ? { amount: 0, currency: this.currency }
      : this.deliveryFee(),
    total: this.total(),
    itemCount: this.itemCount()
  }));

  constructor() {
    this.loadFromBackend();
  }

  /**
   * Load cart from backend. Called on app init and after login.
   */
  loadFromBackend(): void {
    this.cartLoading.set(true);

    if (this.isLoggedIn) {
      this.cartApi.getCart().subscribe(backendCart => {
        if (backendCart) {
          this.cartItems.set(this.mapBackendItems(backendCart));
        }
        this.cartLoading.set(false);
      });
    } else {
      const guestId = this.guestSession.getGuestId();
      if (!guestId) {
        // No guest session yet — cart is empty, nothing to load
        this.cartLoading.set(false);
        return;
      }
      this.cartApi.getGuestCart().subscribe(backendCart => {
        if (backendCart) {
          this.cartItems.set(this.mapBackendItems(backendCart));
        }
        this.cartLoading.set(false);
      });
    }
  }

  private mapBackendItems(backendCart: BackendCart): CartItem[] {
    return backendCart.items.map(i => ({
      productId: i.productId,
      productName: i.productName,
      productSlug: i.productSlug,
      unitPrice: { amount: i.unitPrice, currency: i.currency },
      quantity: i.quantity,
      imageUrl: i.imageUrl,
      maxQuantity: i.maxQuantity > 0 ? i.maxQuantity : 99,
      variantId: i.variantId,
      variantAttributes: i.variantAttributes,
      variantSku: undefined
    }));
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
   * Updates local state immediately and persists to backend.
   */
  addItem(product: Product, quantity: number = 1, variant?: ProductVariant): void {
    const items = [...this.cartItems()];
    const itemKey = getCartItemKey(product.id, variant?.id);
    const existingIndex = items.findIndex(item =>
      getCartItemKey(item.productId, item.variantId) === itemKey
    );

    const unitPrice = variant?.priceOverride ?? { amount: product.price, currency: this.currency };
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

    if (this.isLoggedIn) {
      this.cartApi.addItem(product.id, quantity, variant?.id);
    } else {
      this.guestSession.getOrCreateGuestId();
      this.cartApi.addGuestItem(product.id, quantity, variant?.id);
    }
  }

  /**
   * Update item quantity (supports variants via itemKey).
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
   * Resets the in-memory cart on logout, then reloads the guest cart from the
   * backend. Unlike clear(), this does NOT delete the cart on the server — the
   * customer's authenticated cart is left intact for their next login.
   * Must be called after the customer signal has been cleared so loadFromBackend
   * fetches the guest cart rather than the (now stale) authenticated one.
   */
  resetForLogout(): void {
    this.cartItems.set([]);
    this.loadFromBackend();
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
}
