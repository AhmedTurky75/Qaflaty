import { ApiError, StorefrontClient, type StepTiming } from './api/client.ts';
import { addCartItem, heartbeat, leavePresence } from './api/cart.ts';
import {
  calculateOrder,
  placeOrder,
  trackOrder,
  verifyOtp,
  type OrderItemInput,
  type OrderLocation,
} from './api/orders.ts';
import { viewProduct, type PublicProduct } from './api/storefront.ts';
import type { ProductSelector, Scenario } from './config.ts';
import { createShopper } from './identity.ts';
import { randomInt } from './random.ts';

export interface AttemptItem {
  productId: string;
  productName: string;
  quantity: number;
  variantId: string | null;
}

export interface OrderAttempt {
  index: number;
  guestId: string;
  customerName: string;
  phone: string;
  email: string;
  items: AttemptItem[];
  outcome: 'placed' | 'failed';
  orderNumber: string | null;
  /** Customer-facing status after the whole journey (Confirmed, or Pending if OTP was skipped). */
  status: string | null;
  total: number | null;
  otpVerified: boolean;
  error: { step: string; status: number; code: string; detail: string } | null;
  steps: StepTiming[];
  durationMs: number;
}

export interface JourneyContext {
  scenario: Scenario;
  catalog: ProductSelector[];
  /** Product id → catalog entry, for naming items in the report. */
  productNames: Map<string, string>;
  /** Product id → slug, so the bot can view a product page like a real visitor. */
  productSlugs: Map<string, string>;
  paymentMethod: string;
  location: OrderLocation;
  runId: string;
  random: () => number;
}

/**
 * Walks one virtual shopper through the storefront the way the Angular app does: look at a
 * product, fill a guest cart, preview the totals, place the order, and clear OTP if the store
 * asks for it. Failures are captured, not thrown — one bad order should not end the run.
 */
export async function placeOneOrder(
  context: JourneyContext,
  index: number,
): Promise<OrderAttempt> {
  const { scenario, random } = context;
  const shopper = createShopper(index, context.runId, scenario.identity, random);
  const client = new StorefrontClient({
    baseUrl: scenario.baseUrl,
    storeSlug: scenario.storeSlug,
    userAgent: scenario.userAgent,
    timeoutMs: scenario.timeoutMs,
  });

  const selection = selectItems(context, index);
  const items: OrderItemInput[] = selection.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    variantId: item.variantId,
  }));

  const startedAt = performance.now();

  const attempt: OrderAttempt = {
    index,
    guestId: shopper.guestId,
    customerName: shopper.fullName,
    phone: shopper.phone,
    email: shopper.email,
    items: selection,
    outcome: 'failed',
    orderNumber: null,
    status: null,
    total: null,
    otpVerified: false,
    error: null,
    steps: client.steps,
    durationMs: 0,
  };

  try {
    const firstSlug = context.productSlugs.get(selection[0]!.productId) ?? null;
    await heartbeat(client, shopper.guestId, firstSlug);

    // A run should leave the same footprint a browsing customer would, not just an order row.
    if (firstSlug) await viewProduct(client, firstSlug, shopper.guestId);

    for (const item of items) {
      await addCartItem(client, shopper.guestId, item);
    }

    // Not required to place the order, but it is what the checkout page does first and it surfaces
    // an undeliverable address as a clean flag instead of an Order.DeliveryNotAvailable failure.
    const calculation = await calculateOrder(
      client,
      shopper.guestId,
      items,
      context.location,
      context.paymentMethod,
    );

    if (!calculation.isDeliveryAvailable) {
      throw new ApiError({
        step: 'order-calculate',
        method: 'POST',
        path: '/storefront/orders/calculate',
        status: 200,
        code: 'Order.DeliveryNotAvailable',
        detail:
          `Delivery is not available to ${context.location.cityName}, ${context.location.countryName}. ` +
          'Enable the delivery zone for this location, or point location.* at one that is enabled.',
        body: calculation,
      });
    }

    let order = await placeOrder(client, shopper.guestId, {
      fullName: shopper.fullName,
      phone: shopper.phone,
      phoneCountryCode: shopper.phoneCountryCode,
      email: shopper.email,
      street: shopper.street,
      location: context.location,
      paymentMethod: context.paymentMethod,
      items,
      notes: buildNotes(scenario, context.runId),
      promoCode: scenario.promoCode,
    });

    attempt.orderNumber = order.orderNumber;
    attempt.status = order.status;
    attempt.total = order.pricing?.total?.amount ?? null;

    // Pending means the store has RequireOtpOnPlaceOrder switched on. With MockOtp enabled the
    // code is fixed, so no mailbox is involved; with otp.mode "none" the order is left Pending
    // on purpose and reported as such.
    if (order.status === 'Pending' && scenario.otp.mode === 'mock') {
      order = await verifyOtp(client, shopper.guestId, order.orderNumber, scenario.otp.code);
      attempt.status = order.status;
      attempt.otpVerified = true;
    }

    const tracking = await trackOrder(client, order.orderNumber, shopper.email);
    attempt.status = tracking.status;

    await leavePresence(client, shopper.guestId);

    attempt.outcome = 'placed';
  } catch (cause) {
    attempt.error = toAttemptError(cause);
  }

  attempt.durationMs = performance.now() - startedAt;
  return attempt;
}

function buildNotes(scenario: Scenario, runId: string): string {
  const tag = `[order-bot ${scenario.name} run:${runId}]`;
  return scenario.notes ? `${scenario.notes} ${tag}` : tag;
}

function selectItems(context: JourneyContext, index: number): AttemptItem[] {
  const { scenario, catalog, random } = context;
  const count = Math.min(
    randomInt(random, scenario.itemsPerOrder.min, scenario.itemsPerOrder.max),
    catalog.length,
  );

  const chosen: AttemptItem[] = [];
  const used = new Set<string>();

  // A single product configured with itemsPerOrder.max > 1 would otherwise spin here forever;
  // the attempt budget bounds the search and the distinct-product set bounds the result.
  for (let attempts = 0; chosen.length < count && attempts < count * 10; attempts += 1) {
    const selector = pickWeighted(catalog, random);
    const key = `${selector.id}:${selector.variantId ?? ''}`;
    if (used.has(key)) continue;

    used.add(key);
    chosen.push({
      productId: selector.id,
      productName: context.productNames.get(selector.id) ?? selector.id,
      quantity: randomInt(random, selector.quantityMin, selector.quantityMax),
      variantId: selector.variantId,
    });
  }

  if (chosen.length === 0) {
    const fallback = catalog[index % catalog.length]!;
    chosen.push({
      productId: fallback.id,
      productName: context.productNames.get(fallback.id) ?? fallback.id,
      quantity: randomInt(random, fallback.quantityMin, fallback.quantityMax),
      variantId: fallback.variantId,
    });
  }

  return chosen;
}

function pickWeighted(catalog: ProductSelector[], random: () => number): ProductSelector {
  const totalWeight = catalog.reduce((sum, entry) => sum + entry.weight, 0);
  let threshold = random() * totalWeight;

  for (const entry of catalog) {
    threshold -= entry.weight;
    if (threshold <= 0) return entry;
  }

  return catalog[catalog.length - 1]!;
}

function toAttemptError(cause: unknown): OrderAttempt['error'] {
  if (cause instanceof ApiError) {
    return {
      step: cause.step,
      status: cause.status,
      code: cause.code,
      detail: cause.message.split('—').slice(1).join('—').trim() || cause.message,
    };
  }

  return {
    step: 'unknown',
    status: 0,
    code: 'BotError',
    detail: cause instanceof Error ? cause.message : String(cause),
  };
}

/** Builds the product pool: explicit config when given, otherwise whatever is in stock. */
export function buildCatalog(
  configured: ProductSelector[],
  discovered: PublicProduct[],
): ProductSelector[] {
  if (configured.length > 0) return configured;

  return discovered
    .filter((product) => product.inStock)
    .map((product) => ({
      id: product.id,
      quantityMin: 1,
      quantityMax: 3,
      weight: 1,
      variantId: null,
    }));
}
