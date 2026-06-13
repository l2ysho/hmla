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

// --- scale generation ---------------------------------------------------
// Scales are generated from a root + interval pattern so the pool can be wide
// without hand-listing every note. The mode set is curated to stay calm and
// consonant — no Phrygian/Locrian/harmonic-minor tension — but spans real mood
// (bright Lydian, melancholy Aeolian, warm Dorian, contemplative Japanese).
const CHROMA = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const spell = (rootSemi: number, baseOct: number, add: number): string => {
  const total = rootSemi + add;
  return `${CHROMA[((total % 12) + 12) % 12]}${baseOct + Math.floor(total / 12)}`;
};

// semitone patterns within one octave
const MODES: Record<string, number[]> = {
  "min pent": [0, 3, 5, 7, 10],
  "maj pent": [0, 2, 4, 7, 9],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  hirajoshi: [0, 2, 3, 7, 8],
  kumoi: [0, 2, 3, 7, 9],
  "sus/quartal": [0, 2, 5, 7, 10],
};

const buildScale = (root: string, baseOct: number, mode: string): Scale => {
  const rootSemi = CHROMA.indexOf(root);
  const intervals = MODES[mode];
  const notes: string[] = [];
  for (let o = 0; o < 3; o++)
    for (const iv of intervals) notes.push(spell(rootSemi, baseOct + o, iv));
  const deg = (k: number) =>
    intervals[k % intervals.length] + 12 * Math.floor(k / intervals.length);
  return {
    name: `${root} ${mode}`,
    sub: [spell(rootSemi, baseOct - 1, 0), spell(rootSemi, baseOct - 1, 7)],
    chord: [
      spell(rootSemi, baseOct + 1, deg(0)),
      spell(rootSemi, baseOct + 1, deg(2)),
      spell(rootSemi, baseOct + 1, deg(4)),
      spell(rootSemi, baseOct + 2, deg(0)),
    ],
    notes,
  };
};

// roots vary the tonal centre; each seed wanders a fixed subset (see buildEngine)
const SCALE_SPECS: [string, string][] = [
  ["D", "min pent"],
  ["A", "min pent"],
  ["F", "maj pent"],
  ["C", "maj pent"],
  ["D", "dorian"],
  ["G", "lydian"],
  ["C", "lydian"],
  ["A", "aeolian"],
  ["E", "mixolydian"],
  ["D", "hirajoshi"],
  ["A", "kumoi"],
  ["G", "sus/quartal"],
];

export const SCALES: Scale[] = SCALE_SPECS.map(([root, mode]) => buildScale(root, 2, mode));

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
