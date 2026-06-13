import { ImageResponse } from "@vercel/og";
import { PRESETS } from "../src/engine/constants";
import { deriveIdentity } from "../src/engine/identity";
import { makeRng } from "../src/engine/prng";

export const config = { runtime: "edge" };

const PRESET_NAMES = Object.keys(PRESETS);

// near-black panel + signal-orange, matching the hardware chassis (see
// src/styles/ds/tokens/colors.css: --surface-well, --accent)
const INK_900 = "#0d0d10";
const INK_850 = "#131316";
const INK_100 = "#e8e7e3";
const INK_400 = "#6b6b75";
const ACCENT = "#ff5c38";

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const seed = (searchParams.get("s") || "hmla").slice(0, 9);

  const { arch, space, groove } = deriveIdentity(seed);
  const preset = PRESET_NAMES[Math.floor(makeRng(`${seed}-preset`)() * PRESET_NAMES.length)];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        background: `linear-gradient(180deg, ${INK_850}, ${INK_900})`,
        color: INK_100,
        fontFamily: "monospace",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: "0.16em" }}>hmla</span>
        <span style={{ fontSize: 40, color: ACCENT }}>&#8734;&#8734;</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <span style={{ fontSize: 88, fontWeight: 700, letterSpacing: "0.04em" }}>{seed}</span>
        <span style={{ fontSize: 32, color: INK_400, letterSpacing: "0.08em" }}>
          {arch.name} &middot; {space.name} &middot; {groove.name}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span
          style={{
            fontSize: 26,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: ACCENT,
            border: `2px solid ${ACCENT}`,
            borderRadius: "6px",
            padding: "8px 20px",
          }}
        >
          {preset}
        </span>
        <span style={{ fontSize: 26, color: INK_400, letterSpacing: "0.04em" }}>
          generative ambient &mdash; seeded, ever-evolving
        </span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
