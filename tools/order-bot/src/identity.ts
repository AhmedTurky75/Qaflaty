import { randomUUID } from 'node:crypto';
import { generateNationalPhone } from './geo.ts';

export interface IdentityConfig {
  /** ISO 3166-1 alpha-2 region the phone number is validated against, e.g. "SA". */
  phoneRegion: string;
  /** Domain for generated emails. Keep it non-routable so bot mail never leaves the box. */
  emailDomain: string;
  /** Prefixes every generated surname, so bot customers are recognisable in the dashboard. */
  namePrefix: string;
}

export interface Shopper {
  /** 1-based index within the run. */
  index: number;
  guestId: string;
  fullName: string;
  phone: string;
  phoneCountryCode: string;
  email: string;
  street: string;
}

const FIRST_NAMES = [
  'Omar', 'Sara', 'Youssef', 'Layla', 'Karim', 'Nour', 'Hassan', 'Mona',
  'Tariq', 'Rana', 'Adel', 'Hala', 'Bilal', 'Dina', 'Fadi', 'Salma',
];

const STREETS = [
  'King Fahd Road', 'Olaya Street', 'Tahrir Street', 'Corniche Road',
  'Prince Sultan Street', 'Al Nasr Street', 'University Road', 'Airport Road',
];

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] ?? items[0]!;
}

/**
 * Builds one virtual shopper. The run tag lands in the surname, the email local part and the
 * order notes, so bot orders stay filterable in the dashboard and the database without any
 * cleanup tooling — bot data should never be indistinguishable from real data.
 */
export function createShopper(
  index: number,
  runId: string,
  config: IdentityConfig,
  random: () => number,
): Shopper {
  const first = pick(FIRST_NAMES, random);
  const phone = generateNationalPhone(config.phoneRegion, index, random);

  return {
    index,
    guestId: randomUUID(),
    // PersonName.CreateFromFullName splits on whitespace and needs 2–50 chars per part.
    fullName: `${first} ${config.namePrefix}${index}`,
    phone,
    phoneCountryCode: config.phoneRegion,
    email: `bot-${runId}-${index}@${config.emailDomain}`,
    street: `${Math.floor(random() * 200) + 1} ${pick(STREETS, random)}`,
  };
}
