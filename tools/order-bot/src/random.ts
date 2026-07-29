/**
 * Small seedable PRNG (mulberry32). Seeded runs reproduce the same shoppers, product mix and
 * quantities, which matters when a failure needs to be replayed against a fix.
 */
export function createRandom(seed: number | null): () => number {
  if (seed === null) return Math.random;

  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

/**
 * Derives an independent, deterministic seed per shopper from the scenario's base seed.
 *
 * Every shopper needs its own RNG rather than sharing one draw-by-draw: under concurrency,
 * several shoppers' random() calls interleave in whatever order their network calls happen to
 * resolve in, so a single shared generator would make a "seeded" run different every time it's
 * replayed. Keying by index instead makes shopper #7 always the same shopper, however many
 * workers are running or in what order they finish.
 */
export function seedForIndex(baseSeed: number | null, index: number): number | null {
  return baseSeed === null ? null : (baseSeed + index * 104_729) >>> 0;
}
