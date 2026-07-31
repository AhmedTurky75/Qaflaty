import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { findCity, findCountry, supportedPhoneRegions } from './geo.ts';
import { PACING_MODES, type PacingMode } from './pacing.ts';

export interface ProductSelector {
  id: string;
  quantityMin: number;
  quantityMax: number;
  weight: number;
  variantId: string | null;
}

export interface Scenario {
  name: string;
  baseUrl: string;
  storeSlug: string;
  orders: number;
  /** How many shoppers place orders at the same time. */
  concurrency: number;
  /** Spreads worker start times across this many seconds, instead of starting them all at once. */
  rampUpSeconds: number;
  pacing: PacingMode;
  /** Empty means "discover from the catalog at run time". */
  products: ProductSelector[];
  itemsPerOrder: { min: number; max: number };
  identity: { phoneRegion: string; emailDomain: string; namePrefix: string };
  location: { countryCode: number; cityId: number | null; districtId: number | null };
  /** A payment method key, or "auto" to take the first enabled one from the store. */
  paymentMethod: string;
  promoCode: string | null;
  notes: string | null;
  otp: { mode: 'mock' | 'none'; code: string };
  userAgent: string;
  timeoutMs: number;
  /** Extra hosts this scenario may target, beyond loopback. */
  allowedHosts: string[];
  /** Deterministic runs when set. */
  seed: number | null;
}

export interface Overrides {
  orders?: number;
  allowRemote?: boolean;
}

const MAX_ORDERS = 500;
const MAX_CONCURRENCY = 20;

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']);

export async function loadScenario(path: string, overrides: Overrides): Promise<Scenario> {
  const absolutePath = resolve(path);

  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Could not read scenario '${absolutePath}': ${reason}`);
  }

  if (raw == null || typeof raw !== 'object') {
    throw new Error(`Scenario '${absolutePath}' must be a JSON object.`);
  }

  const input = raw as Record<string, unknown>;
  const scenario = applyDefaults(input, absolutePath);

  if (overrides.orders !== undefined) scenario.orders = overrides.orders;

  validate(scenario, overrides.allowRemote === true);
  return scenario;
}

function applyDefaults(input: Record<string, unknown>, path: string): Scenario {
  const identity = (input.identity ?? {}) as Record<string, unknown>;
  const location = (input.location ?? {}) as Record<string, unknown>;
  const itemsPerOrder = (input.itemsPerOrder ?? {}) as Record<string, unknown>;
  const otp = (input.otp ?? {}) as Record<string, unknown>;

  return {
    name: str(input.name, 'unnamed'),
    baseUrl: str(input.baseUrl, ''),
    storeSlug: str(input.storeSlug, ''),
    orders: num(input.orders, 1),
    concurrency: num(input.concurrency, 1),
    rampUpSeconds: num(input.rampUpSeconds, 0),
    pacing: str(input.pacing, 'fast') as PacingMode,
    products: parseProducts(input.products, path),
    itemsPerOrder: {
      min: num(itemsPerOrder.min, 1),
      max: num(itemsPerOrder.max, 1),
    },
    identity: {
      phoneRegion: str(identity.phoneRegion, 'SA').toUpperCase(),
      emailDomain: str(identity.emailDomain, 'qaflaty-bot.test'),
      namePrefix: str(identity.namePrefix, 'Bot'),
    },
    location: {
      countryCode: num(location.countryCode, 682),
      cityId: numOrNull(location.cityId),
      districtId: numOrNull(location.districtId),
    },
    paymentMethod: str(input.paymentMethod, 'auto'),
    promoCode: strOrNull(input.promoCode),
    notes: strOrNull(input.notes),
    otp: {
      mode: str(otp.mode, 'mock') === 'none' ? 'none' : 'mock',
      code: str(otp.code, '000000'),
    },
    userAgent: str(input.userAgent, 'qaflaty-order-bot/0.1'),
    timeoutMs: num(input.timeoutMs, 15_000),
    allowedHosts: Array.isArray(input.allowedHosts) ? input.allowedHosts.map(String) : [],
    seed: numOrNull(input.seed),
  };
}

function parseProducts(value: unknown, path: string): ProductSelector[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`Scenario '${path}': 'products' must be an array.`);

  return value.map((entry, index) => {
    if (entry == null || typeof entry !== 'object') {
      throw new Error(`Scenario '${path}': products[${index}] must be an object.`);
    }
    const product = entry as Record<string, unknown>;
    const id = str(product.id, '');
    if (id === '') throw new Error(`Scenario '${path}': products[${index}].id is required.`);

    const quantityMin = num(product.quantityMin, 1);
    return {
      id,
      quantityMin,
      quantityMax: num(product.quantityMax, quantityMin),
      weight: num(product.weight, 1),
      variantId: strOrNull(product.variantId),
    };
  });
}

function validate(scenario: Scenario, allowRemote: boolean): void {
  const problems: string[] = [];

  if (scenario.baseUrl === '') problems.push("'baseUrl' is required, e.g. http://localhost:5000/api");
  if (scenario.storeSlug === '') problems.push("'storeSlug' is required");

  let url: URL | null = null;
  if (scenario.baseUrl !== '') {
    try {
      url = new URL(scenario.baseUrl);
    } catch {
      problems.push(`'baseUrl' is not a valid URL: ${scenario.baseUrl}`);
    }
  }

  if (!Number.isInteger(scenario.orders) || scenario.orders < 1) {
    problems.push("'orders' must be a positive integer");
  } else if (scenario.orders > MAX_ORDERS) {
    problems.push(`'orders' is capped at ${MAX_ORDERS} (asked for ${scenario.orders})`);
  }

  if (!Number.isInteger(scenario.concurrency) || scenario.concurrency < 1) {
    problems.push("'concurrency' must be a positive integer");
  } else if (scenario.concurrency > MAX_CONCURRENCY) {
    problems.push(`'concurrency' is capped at ${MAX_CONCURRENCY} (asked for ${scenario.concurrency})`);
  }

  if (!Number.isFinite(scenario.rampUpSeconds) || scenario.rampUpSeconds < 0) {
    problems.push("'rampUpSeconds' must be zero or a positive number");
  }

  if (!PACING_MODES.includes(scenario.pacing)) {
    problems.push(`'pacing' must be one of ${PACING_MODES.join(', ')} (got '${scenario.pacing}')`);
  }

  if (scenario.itemsPerOrder.min < 1) problems.push("'itemsPerOrder.min' must be at least 1");
  if (scenario.itemsPerOrder.max < scenario.itemsPerOrder.min) {
    problems.push("'itemsPerOrder.max' must be greater than or equal to 'itemsPerOrder.min'");
  }

  for (const [index, product] of scenario.products.entries()) {
    if (product.quantityMin < 1) problems.push(`products[${index}].quantityMin must be at least 1`);
    if (product.quantityMax < product.quantityMin) {
      problems.push(`products[${index}].quantityMax must be >= quantityMin`);
    }
    if (product.weight <= 0) problems.push(`products[${index}].weight must be greater than 0`);
  }

  if (!supportedPhoneRegions().includes(scenario.identity.phoneRegion)) {
    problems.push(
      `'identity.phoneRegion' must be one of ${supportedPhoneRegions().join(', ')} ` +
        `(got '${scenario.identity.phoneRegion}'). The API validates the number against this region.`,
    );
  }

  const country = findCountry(scenario.location.countryCode);
  if (!country) {
    problems.push(
      `'location.countryCode' ${scenario.location.countryCode} is not in the bot's geo table. ` +
        'Use an ISO 3166-1 numeric code, e.g. 682 (Saudi Arabia) or 818 (Egypt).',
    );
  } else if (!findCity(scenario.location.countryCode, scenario.location.cityId)) {
    problems.push(
      `'location.cityId' ${scenario.location.cityId} is not a known city of ${country.name}.`,
    );
  }

  if (url && !allowRemote && !isLocalHost(url.hostname, scenario.allowedHosts)) {
    problems.push(
      `refusing to target '${url.hostname}' — it is not loopback and not in 'allowedHosts'. ` +
        'Add it there, or pass --allow-remote to confirm deliberately.',
    );
  }

  if (problems.length > 0) {
    throw new Error(`Invalid scenario '${scenario.name}':\n  - ${problems.join('\n  - ')}`);
  }
}

function isLocalHost(hostname: string, allowedHosts: string[]): boolean {
  return LOOPBACK_HOSTS.has(hostname) || allowedHosts.includes(hostname);
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function numOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
