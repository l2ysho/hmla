import type { SVGProps } from "react";

// Bar heights, centered on the 64px viewBox midline (y=32).
const BAR_HEIGHTS = [24, 40, 56, 32, 16];
const BAR_WIDTH = 10;
const BAR_GAP = 14;

/**
 * hmla signal mark — a waveform/level-meter glyph. Bars use currentColor so
 * it inherits the accent in the wordmark lockup.
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
      {BAR_HEIGHTS.map((h, i) => (
        <rect
          key={i}
          x={7 + i * (BAR_WIDTH + BAR_GAP)}
          y={32 - h / 2}
          width={BAR_WIDTH}
          height={h}
          rx={5}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
