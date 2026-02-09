import { Injectable, signal, computed, effect } from '@angular/core';
import { Cart, CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';
import { Money } from '../models/store.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'qaflaty_cart';

  private cartItems = signal<CartItem[]>([]);
  private deliveryFee = signal<Money>({ amount: 0, currency: 'SAR' });
  private freeDeliveryThreshold = signal<Money | null>(null);

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
   * Add item to cart
   */
  addItem(product: Product, quantity: number = 1): void {
    const items = [...this.cartItems()];
    const existingIndex = items.findIndex(item => item.productId === product.id);

    if (existingIndex >= 0) {
      // Update quantity
      const newQuantity = Math.min(
        items[existingIndex].quantity + quantity,
        product.inventory.quantity
      );
      items[existingIndex] = { ...items[existingIndex], quantity: newQuantity };
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        unitPrice: product.pricing.price,
        quantity: Math.min(quantity, product.inventory.quantity),
        imageUrl: product.images[0]?.url,
        maxQuantity: product.inventory.quantity
      };
      items.push(newItem);
    }

    this.cartItems.set(items);
  }

  /**
   * Update item quantity
   */
  updateQuantity(productId: string, quantity: number): void {
    const items = this.cartItems().map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: Math.min(Math.max(1, quantity), item.maxQuantity)
        };
      }
      return item;
    });
    this.cartItems.set(items);
  }

  /**
   * Remove item from cart
   */
  removeItem(productId: string): void {
    const items = this.cartItems().filter(item => item.productId !== productId);
    this.cartItems.set(items);
  }

  /**
   * Clear cart
   */
  clear(): void {
    this.cartItems.set([]);
  }

  /**
   * Get item by product ID
   */
  getItem(productId: string): CartItem | undefined {
    return this.cartItems().find(item => item.productId === productId);
  }

  /**
   * Check if product is in cart
   */
  hasItem(productId: string): boolean {
    return this.cartItems().some(item => item.productId === productId);
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
