export type PacingMode = 'burst' | 'fast' | 'human';

/** Seconds, inclusive range. */
type ThinkRange = [number, number];

export interface PacingProfile {
  mode: PacingMode;
  /** Reading a product page before adding anything to the cart. */
  afterProductView: ThinkRange;
  /** Between adding each line item to the cart. */
  betweenCartItems: ThinkRange;
  /** Filling in the checkout form before the order is placed. */
  beforePlaceOrder: ThinkRange;
}

/**
 * Three fixed personas rather than free-form numbers: 'burst' proves what an unthrottled,
 * zero-delay attacker looks like today; 'human' proves ordinary traffic isn't mistaken for one;
 * 'fast' is the everyday default for just filling a store with data.
 */
const PROFILES: Record<PacingMode, PacingProfile> = {
  burst: {
    mode: 'burst',
    afterProductView: [0, 0],
    betweenCartItems: [0, 0],
    beforePlaceOrder: [0, 0],
  },
  fast: {
    mode: 'fast',
    afterProductView: [0.1, 0.3],
    betweenCartItems: [0.05, 0.15],
    beforePlaceOrder: [0.2, 0.5],
  },
  human: {
    mode: 'human',
    afterProductView: [1.5, 4],
    betweenCartItems: [0.5, 1.5],
    beforePlaceOrder: [2, 5],
  },
};

export const PACING_MODES = Object.keys(PROFILES) as PacingMode[];

export function profileFor(mode: PacingMode): PacingProfile {
  return PROFILES[mode];
}

/** Waits a random duration within `range`, seeded so it's reproducible per shopper. */
export async function think(range: ThinkRange, random: () => number): Promise<void> {
  const [min, max] = range;
  if (max <= 0) return;

  const seconds = min + random() * (max - min);
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
