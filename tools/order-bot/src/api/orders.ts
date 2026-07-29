import type { StorefrontClient } from './client.ts';

export interface OrderItemInput {
  productId: string;
  quantity: number;
  variantId?: string | null;
}

export interface OrderLocation {
  /** ISO 3166-1 numeric country code, as the storefront checkout sends it. */
  countryCode: number;
  countryName: string;
  cityName: string;
  cityId: number | null;
  districtId: number | null;
}

interface Money {
  amount: number;
  currency: string;
}

export interface OrderCalculation {
  isDeliveryAvailable: boolean;
  subtotal: Money;
  deliveryFee: Money;
  total: Money;
}

export interface PlacedOrder {
  id: string;
  orderNumber: string;
  /**
   * Customer-facing status, not the raw domain status: CustomerFacingOrderStatus maps Blocked to
   * Confirmed, so a bot can only ever observe Pending or Confirmed here.
   */
  status: string;
  pricing: { subtotal: Money; deliveryFee: Money; total: Money };
}

export interface OrderTracking {
  orderNumber: string;
  status: string;
}

export function calculateOrder(
  client: StorefrontClient,
  guestId: string,
  items: OrderItemInput[],
  location: OrderLocation,
  paymentMethod: string,
): Promise<OrderCalculation> {
  return client.post<OrderCalculation>('order-calculate', '/storefront/orders/calculate', {
    guestId,
    body: {
      items: items.map(toItemPayload),
      countryCode: location.countryCode,
      cityId: location.cityId,
      districtId: location.districtId,
      paymentMethod,
    },
  });
}

export interface PlaceOrderInput {
  fullName: string;
  phone: string;
  phoneCountryCode: string;
  email: string;
  street: string;
  location: OrderLocation;
  paymentMethod: string;
  items: OrderItemInput[];
  notes: string | null;
  promoCode: string | null;
}

export function placeOrder(
  client: StorefrontClient,
  guestId: string,
  input: PlaceOrderInput,
): Promise<PlacedOrder> {
  return client.post<PlacedOrder>('order-place', '/storefront/orders', {
    guestId,
    body: {
      customerInfo: {
        fullName: input.fullName,
        phone: input.phone,
        phoneCountryCode: input.phoneCountryCode,
        email: input.email,
      },
      deliveryAddress: {
        street: input.street,
        city: input.location.cityName,
        district: null,
        additionalInstructions: null,
        countryCode: input.location.countryCode,
        country: input.location.countryName,
        cityId: input.location.cityId,
        districtId: input.location.districtId,
      },
      items: input.items.map(toItemPayload),
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      promoCode: input.promoCode,
    },
  });
}

export function verifyOtp(
  client: StorefrontClient,
  guestId: string,
  orderNumber: string,
  otpCode: string,
): Promise<PlacedOrder> {
  return client.post<PlacedOrder>(
    'order-verify-otp',
    `/storefront/orders/${encodeURIComponent(orderNumber)}/verify`,
    { guestId, body: { otpCode } },
  );
}

export function trackOrder(
  client: StorefrontClient,
  orderNumber: string,
  contact: string,
): Promise<OrderTracking> {
  return client.get<OrderTracking>(
    'order-track',
    `/storefront/orders/track/${encodeURIComponent(orderNumber)}`,
    { query: { contact } },
  );
}

function toItemPayload(item: OrderItemInput) {
  return {
    productId: item.productId,
    quantity: item.quantity,
    variantId: item.variantId ?? null,
  };
}
