import { Money } from './store.models';

export interface OrderDto {
  id: string;
  storeId: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItemDto[];
  pricing: OrderPricing;
  payment: PaymentInfo;
  delivery: DeliveryInfo;
  notes: OrderNotes;
  statusHistory: OrderStatusChange[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDto {
  id: string;
  productId: string;
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

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  failureReason?: string;
}

export interface DeliveryInfo {
  address: Address;
  instructions?: string;
}

export interface Address {
  street: string;
  city: string;
  district?: string;
  postalCode?: string;
  country: string;
  additionalInfo?: string;
}

export interface OrderNotes {
  customerNotes?: string;
  merchantNotes?: string;
}

export interface OrderStatusChange {
  id: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedAt: string;
  changedBy?: string;
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

export enum PaymentMethod {
  CashOnDelivery = 'CashOnDelivery',
  Card = 'Card',
  Wallet = 'Wallet'
}

export interface PlaceOrderRequest {
  items: OrderItemRequest[];
  delivery: DeliveryInfo;
  paymentMethod: PaymentMethod;
  customerNotes?: string;
  customerContact: CustomerContact;
}

export interface OrderItemRequest {
  productId: string;
  quantity: number;
}

export interface CustomerContact {
  fullName: string;
  phone: string;
  email?: string;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface AddOrderNoteRequest {
  note: string;
}
