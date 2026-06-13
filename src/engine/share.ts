import type { Params } from "../types";

/* Shareable patch state in the URL.
 *   ?s=<seed>   — the seed, left human-readable so links stay editable
 *   ?e=<token>  — the 8 faders (0–100) + shimmer, packed into one base36 token
 *
 * Packing: each fader is an integer 0–100 (101 states), accumulated in base 101,
 * with shimmer as a trailing bit, then rendered base36. That's ~11 chars and
 * round-trips the exact displayed values. KEYS order is part of the wire format —
 * never reorder it or old links break. */
const KEYS = [
  "density",
  "brightness",
  "space",
  "chaos",
  "grain",
  "sub",
  "pulse",
  "lofi",
] as const satisfies (keyof Params)[];

const q100 = (n: number) => Math.max(0, Math.min(100, Math.round(n * 100)));

export function encodeEngine(p: Params): string {
  let n = 0n;
  for (const k of KEYS) n = n * 101n + BigInt(q100(p[k]));
  n = n * 2n + (p.shimmer ? 1n : 0n);
  return n.toString(36);
}

export function decodeEngine(token: string): Params | null {
  if (!/^[0-9a-z]+$/.test(token)) return null;
  let n = 0n;
  for (const ch of token) n = n * 36n + BigInt(parseInt(ch, 36));
  const shimmer = n % 2n === 1n;
  n /= 2n;
  const vals: number[] = [];
  for (let i = 0; i < KEYS.length; i++) {
    vals.unshift(Number(n % 101n));
    n /= 101n;
  }
  if (n !== 0n) return null; // token carried more than we encode — reject as garbage
  const out = { shimmer } as Params;
  KEYS.forEach((k, i) => {
    out[k] = vals[i] / 100;
  });
  return out;
}
