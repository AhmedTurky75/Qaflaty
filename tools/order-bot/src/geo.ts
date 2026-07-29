/**
 * Location and phone data for generated shoppers.
 *
 * The storefront checkout does NOT read locations from /api/storefront/locations — it uses the
 * static tables in clients/qaflaty-workspace/projects/shared/src/lib/models/geo-data.ts, and posts
 * `countryCode` as the ISO 3166-1 *numeric* code (682 = Saudi Arabia), plus a city id from those
 * same tables. The subset below mirrors that file; keep the ids in sync if it changes.
 */

export interface Country {
  isoNumeric: number;
  isoAlpha2: string;
  name: string;
}

export interface City {
  id: number;
  name: string;
  countryIsoNumeric: number;
}

export const COUNTRIES: Country[] = [
  { isoNumeric: 818, isoAlpha2: 'EG', name: 'Egypt' },
  { isoNumeric: 682, isoAlpha2: 'SA', name: 'Saudi Arabia' },
  { isoNumeric: 784, isoAlpha2: 'AE', name: 'United Arab Emirates' },
  { isoNumeric: 414, isoAlpha2: 'KW', name: 'Kuwait' },
  { isoNumeric: 400, isoAlpha2: 'JO', name: 'Jordan' },
];

export const CITIES: Record<number, City[]> = {
  818: [
    { id: 8001, name: 'Cairo', countryIsoNumeric: 818 },
    { id: 8002, name: 'Alexandria', countryIsoNumeric: 818 },
    { id: 8003, name: 'Giza', countryIsoNumeric: 818 },
  ],
  682: [
    { id: 6821, name: 'Riyadh', countryIsoNumeric: 682 },
    { id: 6822, name: 'Jeddah', countryIsoNumeric: 682 },
    { id: 6825, name: 'Dammam', countryIsoNumeric: 682 },
  ],
  784: [
    { id: 7841, name: 'Dubai', countryIsoNumeric: 784 },
    { id: 7842, name: 'Abu Dhabi', countryIsoNumeric: 784 },
  ],
  414: [{ id: 4141, name: 'Kuwait City', countryIsoNumeric: 414 }],
  400: [{ id: 4001, name: 'Amman', countryIsoNumeric: 400 }],
};

/**
 * Mobile number shapes, in *national* format — the API parses `phone` against the alpha-2 region
 * in `phoneCountryCode` and rejects anything libphonenumber considers invalid for that region
 * (PhoneNumber.Create → IsValidNumberForRegion), so these prefixes and lengths are not decorative.
 */
interface PhoneRule {
  prefixes: string[];
  /** Total digits of the national number, prefix included. */
  nationalLength: number;
}

const PHONE_RULES: Record<string, PhoneRule> = {
  EG: { prefixes: ['10', '11', '12', '15'], nationalLength: 10 },
  SA: { prefixes: ['50', '53', '54', '55', '56', '57', '58', '59'], nationalLength: 9 },
  AE: { prefixes: ['50', '52', '54', '55', '56', '58'], nationalLength: 9 },
  KW: { prefixes: ['51', '55', '60', '65', '66', '90', '97', '99'], nationalLength: 8 },
  JO: { prefixes: ['77', '78', '79'], nationalLength: 9 },
};

export function supportedPhoneRegions(): string[] {
  return Object.keys(PHONE_RULES);
}

export function findCountry(isoNumeric: number): Country | undefined {
  return COUNTRIES.find((c) => c.isoNumeric === isoNumeric);
}

export function findCity(isoNumeric: number, cityId: number | null): City | undefined {
  const cities = CITIES[isoNumeric] ?? [];
  if (cityId == null) return cities[0];
  return cities.find((c) => c.id === cityId);
}

/**
 * A mobile number valid for `region`, in national format. `seed` makes the tail deterministic
 * per shopper so a run's numbers don't collide with each other.
 */
export function generateNationalPhone(region: string, seed: number, random: () => number): string {
  const rule = PHONE_RULES[region];
  if (!rule) {
    throw new Error(
      `No phone rule for region '${region}'. Supported: ${supportedPhoneRegions().join(', ')}`,
    );
  }

  const prefix = rule.prefixes[Math.floor(random() * rule.prefixes.length)] ?? rule.prefixes[0]!;
  const tailLength = rule.nationalLength - prefix.length;

  // Low digits come from the seed (collision-free within a run), high digits from the RNG.
  const seedPart = String(seed % 10_000).padStart(Math.min(4, tailLength), '0');
  const randomPart = Array.from({ length: tailLength - seedPart.length }, () =>
    Math.floor(random() * 10),
  ).join('');

  return `${prefix}${randomPart}${seedPart}`;
}
