import type * as Tone from "tone";
import { SCALES } from "./constants";
import { makeRng } from "./prng";

type Wave = Tone.ToneOscillatorType;

/** Per-seed "instrument" — how the 3 drone voices + sub are voiced. All calm. */
export interface Archetype {
  name: string;
  waves: [Wave, Wave, Wave];
  count: number; // FatOscillator unison voices
  spread: number; // detune width (cents)
  env: { a: number; d: number; s: number; r: number };
  octave: number; // register shift in semitones (e.g. +12 = glassy & high)
  drone: number; // drone gain scaler
  noise: number; // pink-noise bed scaler
  subWave: Wave;
}

export const ARCHETYPES: Archetype[] = [
  {
    name: "warm pad",
    waves: ["sawtooth", "sawtooth", "triangle"],
    count: 3,
    spread: 24,
    env: { a: 4, d: 2, s: 0.82, r: 9 },
    octave: 0,
    drone: 1.0,
    noise: 0.9,
    subWave: "sine",
  },
  {
    name: "glass",
    waves: ["triangle", "sine", "triangle"],
    count: 2,
    spread: 12,
    env: { a: 6, d: 3, s: 0.72, r: 12 },
    octave: 12,
    drone: 0.9,
    noise: 0.7,
    subWave: "sine",
  },
  {
    name: "air",
    waves: ["triangle", "triangle", "sine"],
    count: 3,
    spread: 30,
    env: { a: 7, d: 2, s: 0.76, r: 11 },
    octave: 0,
    drone: 0.8,
    noise: 1.7,
    subWave: "sine",
  },
  {
    name: "analog",
    waves: ["sawtooth", "sawtooth", "sawtooth"],
    count: 3,
    spread: 32,
    env: { a: 3, d: 2, s: 0.86, r: 8 },
    octave: 0,
    drone: 1.1,
    noise: 0.8,
    subWave: "triangle",
  },
  {
    name: "hollow",
    waves: ["square", "triangle", "triangle"],
    count: 2,
    spread: 16,
    env: { a: 5, d: 2, s: 0.7, r: 9 },
    octave: 0,
    drone: 0.95,
    noise: 0.9,
    subWave: "sine",
  },
];

/** Per-seed master filter colour. Lowpass-dominant to protect the low end. */
export const FILTERS: { type: BiquadFilterType; rolloff: Tone.FilterRollOff }[] = [
  { type: "lowpass", rolloff: -24 },
  { type: "lowpass", rolloff: -12 },
  { type: "lowpass", rolloff: -24 },
  { type: "lowpass", rolloff: -48 },
  { type: "bandpass", rolloff: -12 },
];

/** Per-seed room. decay/preDelay/delayTime are seed-fixed; the bias terms nudge
 * the fader-driven wet/crush so spaces differ even at the same fader setting. */
export interface Space {
  name: string;
  decay: number;
  preDelay: number;
  delayTime: number;
  wetBias: number;
  crushBias: number;
}
export const SPACES: Space[] = [
  { name: "intimate", decay: 3.5, preDelay: 0.02, delayTime: 0.3, wetBias: -0.08, crushBias: 0 },
  { name: "hall", decay: 9, preDelay: 0.05, delayTime: 0.42, wetBias: 0, crushBias: 0 },
  { name: "cavern", decay: 13, preDelay: 0.09, delayTime: 0.52, wetBias: 0.1, crushBias: 0 },
  { name: "shimmer", decay: 11, preDelay: 0.04, delayTime: 0.38, wetBias: 0.06, crushBias: 0 },
  { name: "tape", decay: 6, preDelay: 0.03, delayTime: 0.34, wetBias: -0.02, crushBias: 0.08 },
];

/** Per-seed groove identity — the feel of the pulse: grid, tempo, swing, which
 * drum voices play and how busy, plus kit-timbre tweaks. All kept gentle — no
 * odd meters, no busy/glitch patterns. */
export interface TrackCfg {
  active: boolean;
  hits: [number, number]; // min/max Euclidean hits; the seed fills in within range
  thresh: number; // pulse value at which the track starts playing
}
export interface Groove {
  name: string;
  bpm: [number, number];
  sub: "16n" | "8n" | "8t"; // grid: straight 16ths / spacious 8ths / triplet lilt
  steps: number; // pattern length (>= every track's max hits)
  swing: [number, number];
  boom: TrackCfg;
  pluck: TrackCfg;
  shaker: TrackCfg;
  ping: TrackCfg;
  kit: {
    boomDecay: number;
    boomOct: number;
    pluckDamp: number;
    pluckRes: number;
    shakerHz: number;
    shakerDecay: number;
    pingHarm: number;
    pingMod: number;
  };
}

export const GROOVES: Groove[] = [
  {
    name: "dub", // slow, deep kick, sparse, no hats
    bpm: [50, 62],
    sub: "16n",
    steps: 16,
    swing: [0.06, 0.12],
    boom: { active: true, hits: [2, 3], thresh: 0.04 },
    pluck: { active: true, hits: [2, 4], thresh: 0.4 },
    shaker: { active: false, hits: [4, 6], thresh: 0.55 },
    ping: { active: true, hits: [1, 2], thresh: 0.6 },
    kit: {
      boomDecay: 0.9,
      boomOct: 2.6,
      pluckDamp: 2600,
      pluckRes: 0.9,
      shakerHz: 5000,
      shakerDecay: 0.05,
      pingHarm: 5,
      pingMod: 12,
    },
  },
  {
    name: "shuffle", // triplet lilt, woody pluck + shaker
    bpm: [64, 80],
    sub: "8t",
    steps: 12,
    swing: [0.12, 0.22],
    boom: { active: true, hits: [2, 3], thresh: 0.05 },
    pluck: { active: true, hits: [4, 6], thresh: 0.25 },
    shaker: { active: true, hits: [6, 8], thresh: 0.5 },
    ping: { active: true, hits: [1, 2], thresh: 0.7 },
    kit: {
      boomDecay: 0.6,
      boomOct: 2.2,
      pluckDamp: 1800,
      pluckRes: 0.95,
      shakerHz: 4200,
      shakerDecay: 0.05,
      pingHarm: 4,
      pingMod: 10,
    },
  },
  {
    name: "minimal", // just kick + occasional ping
    bpm: [54, 68],
    sub: "16n",
    steps: 16,
    swing: [0.05, 0.1],
    boom: { active: true, hits: [1, 2], thresh: 0.04 },
    pluck: { active: false, hits: [2, 4], thresh: 0.4 },
    shaker: { active: false, hits: [4, 6], thresh: 0.55 },
    ping: { active: true, hits: [1, 2], thresh: 0.55 },
    kit: {
      boomDecay: 0.7,
      boomOct: 2.3,
      pluckDamp: 3000,
      pluckRes: 0.9,
      shakerHz: 5000,
      shakerDecay: 0.05,
      pingHarm: 6,
      pingMod: 14,
    },
  },
  {
    name: "motorik", // steady even pulse, crisp hats
    bpm: [76, 88],
    sub: "8n",
    steps: 16,
    swing: [0, 0.04],
    boom: { active: true, hits: [3, 4], thresh: 0.05 },
    pluck: { active: true, hits: [3, 5], thresh: 0.3 },
    shaker: { active: true, hits: [8, 12], thresh: 0.45 },
    ping: { active: true, hits: [1, 2], thresh: 0.75 },
    kit: {
      boomDecay: 0.5,
      boomOct: 2.1,
      pluckDamp: 3200,
      pluckRes: 0.92,
      shakerHz: 6000,
      shakerDecay: 0.04,
      pingHarm: 5,
      pingMod: 12,
    },
  },
  {
    name: "glacial", // long sparse phrase, deep slow kick
    bpm: [48, 58],
    sub: "16n",
    steps: 24,
    swing: [0.05, 0.1],
    boom: { active: true, hits: [1, 2], thresh: 0.04 },
    pluck: { active: true, hits: [2, 3], thresh: 0.45 },
    shaker: { active: false, hits: [3, 5], thresh: 0.55 },
    ping: { active: true, hits: [1, 2], thresh: 0.6 },
    kit: {
      boomDecay: 1.0,
      boomOct: 2.6,
      pluckDamp: 2200,
      pluckRes: 0.93,
      shakerHz: 4500,
      shakerDecay: 0.06,
      pingHarm: 4,
      pingMod: 9,
    },
  },
];

export interface SeedIdentity {
  arch: Archetype;
  flt: { type: BiquadFilterType; rolloff: Tone.FilterRollOff };
  space: Space;
  fQ: number;
  octaveMul: number;
  palette: number[];
  scaleIdx: number;
  groove: Groove;
}

/**
 * Derives the per-seed "instrument" identity — voice archetype, filter
 * colour, room, harmonic palette, and groove — from an independent
 * `<seed>-timbre` PRNG stream. Pure and side-effect free, so it can run
 * both in the audio engine and in contexts that never touch Tone.js
 * (e.g. generating share-link preview images).
 */
export function deriveIdentity(seed: string): SeedIdentity {
  const trnd = makeRng(`${seed}-timbre`);
  const tPick = <T>(arr: readonly T[]): T => arr[(trnd() * arr.length) | 0];
  const tRange = (lo: number, hi: number) => lo + trnd() * (hi - lo);

  const arch = tPick(ARCHETYPES);
  const flt = tPick(FILTERS);
  const space = tPick(SPACES);
  const fQ = tRange(0.4, flt.type === "bandpass" ? 1.4 : 1.0);
  const octaveMul = 2 ** (arch.octave / 12);

  // Each seed wanders a fixed 4-scale subset of the pool so it keeps a
  // coherent harmonic mood instead of cycling through every mode.
  const palette = (() => {
    const idx = SCALES.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = (trnd() * (i + 1)) | 0;
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx.slice(0, 4);
  })();

  const scaleIdx = palette[(trnd() * palette.length) | 0];
  const groove = tPick(GROOVES);

  return { arch, flt, space, fQ, octaveMul, palette, scaleIdx, groove };
}
