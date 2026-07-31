import type { StorefrontClient } from './client.ts';

export interface StoreSummary {
  id: string;
  name: string;
  slug: string;
}

export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  inStock: boolean;
}

interface Paginated<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}

export interface PaymentMethodOption {
  paymentMethod: string;
  isEnabled: boolean;
  displayLabel: string | null;
  defaultLabel: string;
}

export function getStore(client: StorefrontClient): Promise<StoreSummary> {
  return client.get<StoreSummary>('store', '/storefront/store');
}

export async function getProducts(
  client: StorefrontClient,
  pageSize = 100,
): Promise<PublicProduct[]> {
  const page = await client.get<Paginated<PublicProduct>>('products', '/storefront/products', {
    query: { pageNumber: 1, pageSize },
  });
  return page.items ?? [];
}

export function viewProduct(client: StorefrontClient, slug: string, guestId: string): Promise<unknown> {
  return client.get('product-detail', `/storefront/products/${encodeURIComponent(slug)}`, { guestId });
}

export function getPaymentMethods(client: StorefrontClient): Promise<PaymentMethodOption[]> {
  return client.get<PaymentMethodOption[]>('payment-methods', '/storefront/payment-methods');
}

/**
 * Picks a usable payment method key.
 *
 * PlaceOrderCommandHandler only validates the key when the store has configured adjustments: with
 * none configured any key is accepted, but with some configured an unlisted key fails outright
 * (Order.PaymentMethodNotConfigured) and a disabled one fails too (Order.PaymentMethodDisabled).
 * So "no methods returned" is not an error — it means the store never customised them.
 */
export function resolvePaymentMethod(methods: PaymentMethodOption[]): string {
  if (methods.length === 0) return 'COD';

  const enabled = methods.filter((method) => method.isEnabled);
  if (enabled.length === 0) {
    throw new Error(
      'The store has payment methods configured but every one of them is disabled — ' +
        'no order can be placed until one is enabled in the merchant dashboard.',
    );
  }

  const cod = enabled.find((method) => method.paymentMethod.toUpperCase() === 'COD');
  return (cod ?? enabled[0]!).paymentMethod;
}
