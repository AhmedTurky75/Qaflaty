import { Money } from './store.model';

export interface CalculateOrderRequest {
  items: { productId: string; quantity: number; variantId?: string }[];
  countryCode: number;
  cityId?: number;
  districtId?: number;
  paymentMethod?: string;
}

export interface OrderCalculation {
  isDeliveryAvailable: boolean;
  subtotal: Money;
  deliveryFee: Money;
  paymentAdjustment: Money;
  paymentAdjustmentLabel?: string;
  total: Money;
  tax?: Money;
  taxLabel?: string | null;
  pricesIncludeTax?: boolean;
}

export interface CreateOrderRequest {
  customerInfo: CustomerInfo;
  deliveryAddress: DeliveryAddress;
  items: OrderItemRequest[];
  paymentMethod: string;
  notes?: string;
  promoCode?: string;
}

export interface CustomerInfo {
  fullName: string;
  phone: string;
  phoneCountryCode: string;
  email: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  district?: string;
  additionalInstructions?: string;
  countryCode?: number;
  country?: string; // Country name resolved from countryCode (so the order stores the customer's country, not a default)
  cityId?: number;
  districtId?: number;
}

export interface OrderItemRequest {
  productId: string;
  quantity: number;
  variantId?: string;
  variantAttributes?: Record<string, string>;
}


export interface OrderResponse {
  id: string;
  orderNumber: string;
  pricing: { total: Money };
  status: OrderStatus;
  createdAt: string;
}

export interface Shipment {
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippedAt: string;
  estimatedDeliveryDate?: string | null;
}

export interface OrderTracking {
  orderNumber: string;
  status: OrderStatus;
  items: OrderItemDto[];
  pricing: OrderPricing;
  delivery: DeliveryInfo;
  payment: PaymentInfo;
  statusHistory: OrderStatusChange[];
  createdAt: string;
  updatedAt: string;
  shipment?: Shipment | null;
}

export interface OrderItemDto {
  productId: string;
  productName: string;
  unitPrice: Money;
  quantity: number;
  total: Money;
  variantId?: string;
  variantAttributes?: Record<string, string>;
}

export interface OrderPricing {
  subtotal: Money;
  deliveryFee: Money;
  total: Money;
  discountAmount?: Money;
  taxAmount?: Money;
}

export interface DeliveryInfo {
  address: string;
  instructions?: string;
}

export interface PaymentInfo {
  method: PaymentMethodData;
  status: PaymentStatus;
}

export interface OrderStatusChange {
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedAt: string;
  notes?: string;
}

export enum OrderStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Failed = 'Failed',
  Refunded = 'Refunded'
}
