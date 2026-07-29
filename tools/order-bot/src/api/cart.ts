import type { StorefrontClient } from './client.ts';

export interface CartItemInput {
  productId: string;
  quantity: number;
  variantId?: string | null;
}

/** Feeds the merchant dashboard's live "active users" metric. */
export function heartbeat(
  client: StorefrontClient,
  guestId: string,
  productSlug: string | null,
): Promise<unknown> {
  return client.post('presence-heartbeat', '/storefront/presence/heartbeat', {
    guestId,
    body: { productSlug },
  });
}

export function addCartItem(
  client: StorefrontClient,
  guestId: string,
  item: CartItemInput,
): Promise<unknown> {
  return client.post('cart-add-item', '/storefront/guest-cart/items', {
    guestId,
    body: {
      productId: item.productId,
      quantity: item.quantity,
      variantId: item.variantId ?? null,
    },
  });
}

export function getCart(client: StorefrontClient, guestId: string): Promise<unknown> {
  return client.get('cart-get', '/storefront/guest-cart', { guestId });
}

export function leavePresence(client: StorefrontClient, guestId: string): Promise<unknown> {
  return client.post('presence-leave', '/storefront/presence/leave', { guestId });
}
