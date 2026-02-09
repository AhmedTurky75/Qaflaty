import { Money } from './store.model';

export interface CreateOrderRequest {
  customerInfo: CustomerInfo;
  deliveryAddress: DeliveryAddress;
  items: OrderItemRequest[];
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface CustomerInfo {
  fullName: string;
  phone: string;
  email?: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  district?: string;
  additionalInstructions?: string;
}

export interface OrderItemRequest {
  productId: string;
  quantity: number;
}

export enum PaymentMethod {
  CashOnDelivery = 'CashOnDelivery',
  Card = 'Card'
}

export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  total: Money;
  status: OrderStatus;
  createdAt: string;
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
}

export interface OrderItemDto {
  productName: string;
  unitPrice: Money;
  quantity: number;
  total: Money;
}

export interface OrderPricing {
  subtotal: Money;
  deliveryFee: Money;
  total: Money;
}

export interface DeliveryInfo {
  address: string;
  instructions?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
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
