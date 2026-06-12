import type { Params } from "../types";

// Engine identity colors reference the app-level token palette
// (src/styles/engine-signals.css) so nothing is hard-coded and the scope +
// LEDs follow the active theme. LED accepts a raw CSS color; the canvas scope
// resolves these var() refs via getComputedStyle (see useVisual).
export const VOICE_COLORS = ["var(--voice-1)", "var(--voice-2)", "var(--voice-3)"];

export const HIT_COLORS: Record<string, string> = {
  boom: "var(--hit-boom)",
  pluck: "var(--hit-pluck)",
  shaker: "var(--hit-shaker)",
  ping: "var(--hit-ping)",
};

export const DETUNES = [-1200, -500, 0, 0, 0, 700, 1200];

export interface Scale {
  name: string;
  sub: [string, string];
  chord: string[];
  notes: string[];
}

export const SCALES: Scale[] = [
  {
    name: "D mol pent",
    sub: ["D1", "A1"],
    chord: ["D3", "F3", "A3", "C4", "G4"],
    notes: ["D2", "F2", "G2", "A2", "C3", "D3", "F3", "G3", "A3", "C4", "D4", "F4", "G4", "A4"],
  },
  {
    name: "A mol pent",
    sub: ["A1", "E1"],
    chord: ["A2", "C3", "E3", "G3", "D4"],
    notes: ["A2", "C3", "D3", "E3", "G3", "A3", "C4", "D4", "E4", "G4", "A4"],
  },
  {
    name: "F dur pent",
    sub: ["F1", "C2"],
    chord: ["F3", "A3", "C4", "D4", "G4"],
    notes: ["F2", "G2", "A2", "C3", "D3", "F3", "G3", "A3", "C4", "D4", "F4", "G4"],
  },
  {
    name: "C dur pent",
    sub: ["C1", "G1"],
    chord: ["C3", "E3", "G3", "A3", "D4"],
    notes: ["C2", "D2", "E2", "G2", "A2", "C3", "D3", "E3", "G3", "A3", "C4", "D4", "E4", "G4"],
  },
];

export const PRESETS: Record<string, Omit<Params, "lofi"> & { lofi: number }> = {
  calm: {
    density: 0.3,
    brightness: 0.45,
    space: 0.78,
    chaos: 0.15,
    grain: 0.4,
    pulse: 0,
    sub: 0.4,
    shimmer: true,
    lofi: 0.05,
  },
  dense: {
    density: 0.8,
    brightness: 0.6,
    space: 0.55,
    chaos: 0.45,
    grain: 0.7,
    pulse: 0.5,
    sub: 0.6,
    shimmer: false,
    lofi: 0.1,
  },
  puls: {
    density: 0.45,
    brightness: 0.5,
    space: 0.62,
    chaos: 0.3,
    grain: 0.5,
    pulse: 0.72,
    sub: 0.55,
    shimmer: false,
    lofi: 0.12,
  },
  "broken tape": {
    density: 0.45,
    brightness: 0.35,
    space: 0.5,
    chaos: 0.75,
    grain: 0.8,
    pulse: 0.3,
    sub: 0.35,
    shimmer: false,
    lofi: 0.5,
  },
};
