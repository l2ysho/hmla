// Seeds are always `hmla-<digits>`. The user can only edit the numeric suffix,
// so a shared link or social card can never be crafted to render an arbitrary
// word. Every entry point (app input, OG image, meta tags) funnels through
// these helpers so the canonical form is identical everywhere.

export const SEED_PREFIX = "hmla-";
const MAX_DIGITS = 6;

/** The digit suffix of a seed, sanitised (non-digits dropped, capped length). */
export const seedDigits = (seed: string): string => {
  const body = seed.startsWith(SEED_PREFIX) ? seed.slice(SEED_PREFIX.length) : seed;
  return body.replace(/\D/g, "").slice(0, MAX_DIGITS);
};

/** Build a canonical seed from a digit string (empty → a stable default). */
export const makeSeed = (digits: string): string => `${SEED_PREFIX}${digits || "0000"}`;

/** Coerce any input (URL param, localStorage, paste) to `hmla-<digits>`. */
export const canonSeed = (seed: string): string => makeSeed(seedDigits(seed));

/** A fresh random seed, `hmla-` + 4 digits. */
export const randomSeed = (): string => makeSeed(String(1000 + Math.floor(Math.random() * 9000)));
