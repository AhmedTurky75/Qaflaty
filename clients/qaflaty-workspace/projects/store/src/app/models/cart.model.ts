import { Money } from './store.model';

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  unitPrice: Money;
  quantity: number;
  imageUrl?: string;
  maxQuantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: Money;
  deliveryFee: Money;
  total: Money;
  itemCount: number;
}
