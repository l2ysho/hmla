import type { SVGProps } from "react";

/**
 * hmla signal mark — the lemniscate (infinity loop) brand glyph. Strokes use
 * currentColor so it inherits the accent in the wordmark lockup. Ported from
 * the design system (assets/signal-mark.svg).
 */
export function SignalMark({ ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 64"
      fill="none"
      role="img"
      aria-label="hmla signal mark"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M60 32 C60 14, 86 14, 86 32 C86 50, 60 50, 60 32 C60 14, 34 14, 34 32 C34 50, 60 50, 60 32 Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="32" r="3.4" fill="currentColor" />
    </svg>
  );
}
