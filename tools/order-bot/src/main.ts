import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiError, StorefrontClient } from './api/client.ts';
import {
  getPaymentMethods,
  getProducts,
  getStore,
  resolvePaymentMethod,
} from './api/storefront.ts';
import type { OrderLocation } from './api/orders.ts';
import { loadScenario, type Scenario } from './config.ts';
import { findCity, findCountry } from './geo.ts';
import { createRandom } from './random.ts';
import { printAttempt, printSummary, RunReport } from './report.ts';
import { buildCatalog, placeOneOrder, type JourneyContext } from './shopper.ts';

const TOOL_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const USAGE = `
qaflaty order-bot — places storefront orders for volume testing

  node bot.mjs run <scenario.json> [options]

Options
  --orders <n>     Override the scenario's order count
  --allow-remote   Permit a non-loopback target (asks for nothing; be sure)
  --help           Show this message

Example
  node bot.mjs run scenarios/smoke.json --orders 25
`;

async function main(argv: string[]): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h') || argv.length === 0) {
    console.log(USAGE.trim());
    return 0;
  }

  const [command, scenarioPath, ...rest] = argv;

  if (command !== 'run') {
    console.error(`Unknown command '${command}'. Try --help.`);
    return 2;
  }
  if (!scenarioPath) {
    console.error('A scenario file is required, e.g. scenarios/smoke.json');
    return 2;
  }

  const scenario = await loadScenario(scenarioPath, {
    orders: readNumberFlag(rest, '--orders'),
    allowRemote: rest.includes('--allow-remote'),
  });

  return runScenario(scenario);
}

async function runScenario(scenario: Scenario): Promise<number> {
  const runId = createRunId();
  const random = createRandom(scenario.seed);

  const client = new StorefrontClient({
    baseUrl: scenario.baseUrl,
    storeSlug: scenario.storeSlug,
    userAgent: scenario.userAgent,
    timeoutMs: scenario.timeoutMs,
  });

  console.log(`order-bot: '${scenario.name}' → ${scenario.baseUrl} (store '${scenario.storeSlug}')`);

  const store = await getStore(client);
  console.log(`  store    ${store.name}`);

  const paymentMethod =
    scenario.paymentMethod.toLowerCase() === 'auto'
      ? resolvePaymentMethod(await getPaymentMethods(client))
      : scenario.paymentMethod;
  console.log(`  payment  ${paymentMethod}`);

  const discovered = await getProducts(client);
  const catalog = buildCatalog(scenario.products, discovered);

  if (catalog.length === 0) {
    throw new Error(
      `Store '${scenario.storeSlug}' has no in-stock products to order. Publish a product, ` +
        "or list explicit product ids in the scenario's 'products'.",
    );
  }

  const productNames = new Map(discovered.map((product) => [product.id, product.name]));
  const productSlugs = new Map(discovered.map((product) => [product.id, product.slug]));

  // Configured ids are trusted only as far as the catalog can confirm them — a stale id would
  // otherwise fail on every single order with an opaque Order.ProductNotFound.
  const unknownIds = scenario.products
    .map((product) => product.id)
    .filter((id) => discovered.length > 0 && !productNames.has(id));
  if (unknownIds.length > 0) {
    console.log(
      `  warning  ${unknownIds.length} configured product id(s) are not in this store's catalog: ` +
        `${unknownIds.join(', ')}`,
    );
  }

  console.log(`  catalog  ${catalog.length} product(s)`);

  const location = resolveLocation(scenario);
  console.log(`  ship to  ${location.cityName}, ${location.countryName}`);

  const context: JourneyContext = {
    scenario,
    catalog,
    productNames,
    productSlugs,
    paymentMethod,
    location,
    runId,
    random,
  };

  const report = new RunReport(scenario, runId, join(TOOL_ROOT, 'runs'));
  await report.open();

  console.log(`  placing  ${scenario.orders} order(s)`);
  console.log('');

  for (let index = 1; index <= scenario.orders; index += 1) {
    const attempt = await placeOneOrder(context, index);
    await report.record(attempt);
    printAttempt(attempt);
  }

  const summary = await report.close();
  printSummary(summary, report.path);

  return summary.failed === 0 ? 0 : 1;
}

/**
 * Compact and collision-free: two runs started in the same second must not share a report
 * directory, and the id also lands in generated email addresses.
 */
function createRunId(): string {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
  return `${stamp}-${randomBytes(2).toString('hex')}`;
}

function resolveLocation(scenario: Scenario): OrderLocation {
  // Validated in config.ts, so both lookups resolve here.
  const country = findCountry(scenario.location.countryCode)!;
  const city = findCity(scenario.location.countryCode, scenario.location.cityId)!;

  return {
    countryCode: country.isoNumeric,
    countryName: country.name,
    cityName: city.name,
    cityId: city.id,
    districtId: scenario.location.districtId,
  };
}

function readNumberFlag(args: string[], flag: string): number | undefined {
  const position = args.indexOf(flag);
  if (position === -1) return undefined;

  const raw = args[position + 1];
  const value = Number(raw);
  if (raw === undefined || !Number.isFinite(value)) {
    throw new Error(`${flag} needs a number, got '${raw ?? ''}'`);
  }
  return value;
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (cause) {
  if (cause instanceof ApiError) {
    console.error(`\n${cause.message}`);
    if (cause.code === 'Tenant.Required' || cause.code === 'Store.NotFound') {
      console.error(
        "Check 'storeSlug' — the API resolves the store from the X-Store-Slug header and the " +
          'store must exist and be Active.',
      );
    }
  } else {
    console.error(`\n${cause instanceof Error ? cause.message : String(cause)}`);
  }
  process.exitCode = 1;
}
