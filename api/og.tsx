import { ImageResponse } from "@vercel/og";
import { PRESETS } from "../src/engine/constants";
import { deriveIdentity } from "../src/engine/identity";
import { makeRng } from "../src/engine/prng";
import { canonSeed } from "../src/engine/seed";

export const config = { runtime: "edge" };

const PRESET_NAMES = Object.keys(PRESETS);

// near-black panel + signal-orange, matching the hardware chassis (see
// src/styles/ds/tokens/colors.css: --surface-well, --accent)
const INK_900 = "#0d0d10";
const INK_850 = "#131316";
const INK_100 = "#e8e7e3";
const INK_400 = "#6b6b75";
const ACCENT = "#ff5c38";

// hmla signal mark — the waveform brand glyph (src/components/SignalMark.tsx),
// inlined here since the edge runtime renders via Satori, not React/CSS.
const BAR_HEIGHTS = [24, 40, 56, 32, 16];
const BAR_WIDTH = 10;
const BAR_GAP = 14;
const SignalMark = ({ size }: { size: number }) => (
  <svg width={size} height={(size * 64) / 120} viewBox="0 0 120 64" fill="none">
    {BAR_HEIGHTS.map((h, i) => (
      <rect
        key={i}
        x={7 + i * (BAR_WIDTH + BAR_GAP)}
        y={32 - h / 2}
        width={BAR_WIDTH}
        height={h}
        rx={5}
        fill={ACCENT}
      />
    ))}
  </svg>
);

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  // canonical `hmla-<digits>` — the brand lives in the seed itself, so the
  // card shows it once (no separate wordmark) and never an arbitrary word.
  const seed = canonSeed(searchParams.get("s") || "hmla-0000");

  const { arch, space, groove } = deriveIdentity(seed);
  const preset = PRESET_NAMES[Math.floor(makeRng(`${seed}-preset`)() * PRESET_NAMES.length)];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "26px",
        background: `linear-gradient(180deg, ${INK_850}, ${INK_900})`,
        color: INK_100,
        fontFamily: "monospace",
      }}
    >
      <SignalMark size={56} />

      <span style={{ fontSize: 104, fontWeight: 700, letterSpacing: "0.02em" }}>{seed}</span>

      <span style={{ fontSize: 32, color: INK_400, letterSpacing: "0.08em" }}>
        {arch.name} &middot; {space.name} &middot; {groove.name}
      </span>

      <span
        style={{
          fontSize: 26,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: ACCENT,
          border: `2px solid ${ACCENT}`,
          borderRadius: "6px",
          padding: "8px 24px",
          marginTop: "12px",
        }}
      >
        {preset}
      </span>
    </div>,
    { width: 1200, height: 630 },
  );
}
