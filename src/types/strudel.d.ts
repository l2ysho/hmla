/**
 * Minimal ambient types for Strudel.
 *
 * The `@strudel/*` packages ship no `.d.ts` files (their package.json has no
 * `types` field), so the small slice of the pattern API that hmla actually
 * uses is declared here rather than pulling the whole surface in as `any`.
 * Everything below mirrors @strudel/core 1.2.6.
 */

declare module "@strudel/core" {
  /** Rational time, in cycles. `Number(f)` converts it to a float. */
  export interface Fraction {
    valueOf(): number;
  }

  export interface TimeSpan {
    begin: Fraction;
    end: Fraction;
  }

  /** A single event. `whole` is null for pattern fragments (query overhangs). */
  export interface Hap {
    whole: TimeSpan | null;
    part: TimeSpan;
    value: unknown;
  }

  export interface Pattern {
    /** Events between two cycle positions. Pure — no audio, no side effects. */
    queryArc(begin: number, end: number): Hap[];
    /** Randomly drop a proportion (0–1) of events. Deterministic per cycle. */
    degradeBy(amount: number): Pattern;
    /**
     * Set the seed for random signals inside this pattern. Must be applied
     * *outside* the operation it should affect — `p.degradeBy(x).seed(n)`
     * seeds the degrade, whereas `p.seed(n).degradeBy(x)` does not.
     */
    seed(n: number): Pattern;
  }
}

declare module "@strudel/mini" {
  import type { Pattern } from "@strudel/core";

  /** Parse Tidal mini-notation, e.g. `mini("x(5,16,3)")`. */
  export function mini(...sources: string[]): Pattern;
}
