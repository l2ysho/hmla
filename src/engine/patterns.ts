// Strudel is the source of every rhythm in hmla. It is used purely as a
// *pattern* engine — it decides when things happen, and Tone.js (drums.ts)
// still performs all synthesis. No Strudel audio output is loaded.
import "@strudel/core"; // registers the combinators used on Pattern below
import { mini } from "@strudel/mini";
import type { Pattern } from "@strudel/core";

/**
 * Euclidean rhythm patterns.
 *
 * hmla previously built these from a hand-rolled onset test (`euclid()` in
 * prng.ts). That variant disagreed with the canonical Bjorklund algorithm for
 * many (hits, steps) pairs — E(5,8) came out as `x.x.xx.x` rather than
 * `x.xx.x.x` — so patterns now come from Strudel, which implements Bjorklund
 * properly and brings its combinator vocabulary along with it.
 *
 * A track is described by a mini-notation string (`x(5,16,3)`) so the pattern
 * is inspectable and portable rather than an opaque boolean array. The onset
 * symbol is arbitrary: only the timing of each event is ever read.
 */

/** Mini-notation for one Euclidean track: `hits` onsets over `len` steps. */
export const trackSrc = (hits: number, len: number, rot: number): string =>
  `x(${hits},${len},${rot})`;

/**
 * Parse a track source into a reusable pattern. Parsing is the expensive part
 * (~0.3ms), so callers hold onto the result and re-query it per bar instead of
 * re-parsing.
 */
export const parseTrack = (src: string): Pattern => mini(src);

/**
 * Render one cycle of `pat` onto a grid of `len` steps.
 *
 * `drop` (0–1) thins the pattern via Strudel's `degradeBy`, which — unlike a
 * plain coin flip — is a deterministic function of cycle position, so a given
 * seed always thins the same bar the same way. `seed` selects which random
 * stream to draw from, keeping two hmla seeds from degrading identically; it
 * is applied outside `degradeBy` because that is the only order in which it
 * reaches the underlying `rand` signal.
 */
export function renderGrid(
  pat: Pattern,
  len: number,
  cycle: number,
  drop: number,
  seed: number,
): boolean[] {
  const grid: boolean[] = Array.from({ length: len }, () => false);
  const shaped = drop > 0 ? pat.degradeBy(drop).seed(seed) : pat;
  for (const hap of shaped.queryArc(cycle, cycle + 1)) {
    // fragments (events clipped by the query window) carry no onset of their own
    if (!hap.whole) continue;
    const i = Math.round((Number(hap.whole.begin) - cycle) * len);
    if (i >= 0 && i < len) grid[i] = true;
  }
  return grid;
}
