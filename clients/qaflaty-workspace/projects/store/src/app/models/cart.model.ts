import { Money } from './store.model';

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  unitPrice: Money;
  quantity: number;
  imageUrl?: string;
  maxQuantity: number;
  // Variant support
  variantId?: string;
  variantAttributes?: Record<string, string>;  // e.g., {"Color": "Red", "Size": "M"}
  variantSku?: string;
}

/**
 * Generate a unique cart item key combining productId and variantId
 */
export function getCartItemKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}:${variantId}` : productId;
}

export interface Cart {
  items: CartItem[];
  subtotal: Money;
  deliveryFee: Money;
  total: Money;
  itemCount: number;
}
