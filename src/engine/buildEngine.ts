import * as Tone from "tone";
import { DETUNES, SCALES } from "./constants";
import { makeRng, euclid } from "./prng";
import { audioBufferToWav } from "./wav";
import type { EngineEvent, EngineHandle, Params } from "../types";

type Wave = Tone.ToneOscillatorType;

/** Per-seed "instrument" — how the 3 drone voices + sub are voiced. All calm. */
interface Archetype {
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

const ARCHETYPES: Archetype[] = [
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
const FILTERS: { type: BiquadFilterType; rolloff: Tone.FilterRollOff }[] = [
  { type: "lowpass", rolloff: -24 },
  { type: "lowpass", rolloff: -12 },
  { type: "lowpass", rolloff: -24 },
  { type: "lowpass", rolloff: -48 },
  { type: "bandpass", rolloff: -12 },
];

/** Per-seed room. decay/preDelay/delayTime are seed-fixed; the bias terms nudge
 * the fader-driven wet/crush so spaces differ even at the same fader setting. */
interface Space {
  name: string;
  decay: number;
  preDelay: number;
  delayTime: number;
  wetBias: number;
  crushBias: number;
}
const SPACES: Space[] = [
  { name: "intimate", decay: 3.5, preDelay: 0.02, delayTime: 0.3, wetBias: -0.08, crushBias: 0 },
  { name: "hall", decay: 9, preDelay: 0.05, delayTime: 0.42, wetBias: 0, crushBias: 0 },
  { name: "cavern", decay: 13, preDelay: 0.09, delayTime: 0.52, wetBias: 0.1, crushBias: 0 },
  { name: "shimmer", decay: 11, preDelay: 0.04, delayTime: 0.38, wetBias: 0.06, crushBias: 0 },
  { name: "tape", decay: 6, preDelay: 0.03, delayTime: 0.34, wetBias: -0.02, crushBias: 0.08 },
];

/** Per-seed groove identity — the feel of the pulse: grid, tempo, swing, which
 * drum voices play and how busy, plus kit-timbre tweaks. All kept gentle — no
 * odd meters, no busy/glitch patterns. */
interface TrackCfg {
  active: boolean;
  hits: [number, number]; // min/max Euclidean hits; the seed fills in within range
  thresh: number; // pulse value at which the track starts playing
}
interface Groove {
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

const GROOVES: Groove[] = [
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

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/**
 * Builds the full audio graph + Markov melody/rhythm engine for a given seed.
 * `getParams` is read live on every scheduled tick so fader changes apply
 * without rebuilding; `emit` streams events for UI readouts and the visualizer.
 */
export async function buildEngine(
  seed: string,
  getParams: () => Params,
  emit: (ev: EngineEvent) => void,
): Promise<EngineHandle> {
  await Tone.start();
  const rnd = makeRng(seed); // melodic stream (kept compatible with v2)
  const rrnd = makeRng(seed + "-rhythm"); // independent rhythm stream

  // Timbre stream — a third independent PRNG so each seed sounds like a
  // different "instrument" (voice archetype, filter colour, room, harmonic
  // palette) without disturbing the melody/rhythm draws above. The faders still
  // shape it live on top.
  const trnd = makeRng(seed + "-timbre");
  const tPick = <T>(arr: readonly T[]): T => arr[(trnd() * arr.length) | 0];
  const tRange = (lo: number, hi: number) => lo + trnd() * (hi - lo);

  const arch = tPick(ARCHETYPES);
  const flt = tPick(FILTERS);
  const space = tPick(SPACES);
  const fQ = tRange(0.4, flt.type === "bandpass" ? 1.4 : 1.0);
  const octaveMul = 2 ** (arch.octave / 12);

  // Each seed wanders a fixed 4-scale subset of the pool so it keeps a coherent
  // harmonic mood instead of cycling through every mode.
  const palette = (() => {
    const idx = SCALES.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = (trnd() * (i + 1)) | 0;
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx.slice(0, 4);
  })();

  const timers = {
    tos: new Set<ReturnType<typeof setTimeout>>(),
    ivs: new Set<ReturnType<typeof setInterval>>(),
  };
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.tos.delete(t);
      fn();
    }, ms);
    timers.tos.add(t);
    return t;
  };
  const every = (fn: () => void, ms: number) => {
    const t = setInterval(fn, ms);
    timers.ivs.add(t);
    return t;
  };

  let scaleIdx = palette[(trnd() * palette.length) | 0];
  const scale = () => SCALES[scaleIdx];
  emit({ type: "key", name: scale().name });

  /* --- master chain --- */
  const limiter = new Tone.Limiter(-1).toDestination();
  const reverb = new Tone.Reverb({ decay: space.decay, preDelay: space.preDelay, wet: 0.5 });
  await reverb.generate();
  reverb.connect(limiter);
  const delay = new Tone.PingPongDelay({ delayTime: space.delayTime, feedback: 0.45, wet: 0.25 });
  delay.connect(reverb);
  const crusher = new Tone.BitCrusher(8);
  crusher.wet.value = 0.08;
  crusher.connect(delay);
  const filter = new Tone.Filter(1200, flt.type);
  filter.Q.value = fQ;
  filter.rolloff = flt.rolloff;
  filter.connect(crusher);
  const bus = new Tone.Gain(0);
  bus.connect(filter);

  const filtLfo = new Tone.LFO({ frequency: 1 / 47, min: 600, max: 2000, type: "sine" }).start();
  filtLfo.connect(filter.frequency);

  /* --- shimmer (lazy) --- */
  let shimmer: { ps: Tone.PitchShift; g: Tone.Gain } | null = null;
  function setShimmer(on: boolean) {
    try {
      if (on && !shimmer) {
        const ps = new Tone.PitchShift({ pitch: 12, windowSize: 0.25 });
        const g = new Tone.Gain(0);
        delay.connect(ps);
        ps.chain(g, reverb);
        shimmer = { ps, g };
      }
      if (shimmer) shimmer.g.gain.rampTo(on ? 0.35 : 0, 1.2);
    } catch {
      // ignore — shimmer is best-effort
    }
  }

  /* --- 3 drone voices --- */
  const voices = [0, 1, 2].map((i) => {
    const osc = new Tone.FatOscillator(220, arch.waves[i], arch.spread + i * 4);
    osc.count = arch.count;
    const env = new Tone.AmplitudeEnvelope({
      attack: arch.env.a + i * 1.2,
      decay: arch.env.d,
      sustain: arch.env.s,
      release: arch.env.r + i * 2,
    });
    const pan = new Tone.Panner(0);
    const gain = new Tone.Gain((i === 0 ? 0.2 : 0.16) * arch.drone);
    const panLfo = new Tone.LFO({ frequency: 1 / (17 + i * 9), min: -0.7, max: 0.7 }).start();
    panLfo.connect(pan.pan);
    osc.chain(env, pan, gain, bus);
    osc.start();
    return {
      osc,
      env,
      pan,
      gain,
      panLfo,
      cur: Math.floor(rnd() * scale().notes.length),
      note: null as string | null,
    };
  });

  /* --- sub bass --- */
  // The raw scale sub notes (octave 1) are inaudibly low on most speakers, so
  // the sub oscillator runs one octave above them.
  const subHz = (note: string) => Tone.Frequency(note).toFrequency() * 2;
  const sub = new Tone.Oscillator(subHz(scale().sub[0]), arch.subWave);
  const subGain = new Tone.Gain(0.16);
  const subLevel = new Tone.Gain(0.8); // fader: subLfo writes subGain, fader writes subLevel
  const subLfo = new Tone.LFO({ frequency: 1 / 38, min: 0.1, max: 0.18 }).start();
  subLfo.connect(subGain.gain);
  sub.chain(subGain, subLevel, bus);
  sub.start();
  let subStep = 0;
  every(() => {
    if (rnd() < 0.55) return;
    subStep = (subStep + 1) % 2;
    sub.frequency.rampTo(subHz(scale().sub[subStep]), 8);
  }, 52000);

  /* --- pink noise texture --- */
  const noise = new Tone.Noise("pink").start();
  const noiseFilter = new Tone.Filter(600, "lowpass");
  const noiseGain = new Tone.Gain(0.035 * arch.noise);
  const noiseLfo = new Tone.LFO({
    frequency: 1 / 29,
    min: 0.015 * arch.noise,
    max: 0.05 * arch.noise,
  }).start();
  const noiseFiltLfo = new Tone.LFO({ frequency: 1 / 61, min: 300, max: 900 }).start();
  noiseLfo.connect(noiseGain.gain);
  noiseFiltLfo.connect(noiseFilter.frequency);
  noise.chain(noiseFilter, noiseGain, bus);

  /* --- granular capture --- */
  const grainBus = new Tone.Gain(0.45);
  grainBus.connect(bus);
  let grainA: { player: Tone.GrainPlayer; g: Tone.Gain } | null = null;

  async function renderGrainBuffer() {
    const live = voices.map((v) => v.note).filter((n): n is string => !!n);
    const pool = [...new Set([...live, ...scale().chord])].slice(0, 5);
    const offsets = pool.map(() => rnd());
    return Tone.Offline(() => {
      pool.forEach((n, i) => {
        const o = new Tone.FatOscillator(n, "sawtooth", 28);
        o.count = 2;
        const g = new Tone.Gain(0.1).toDestination();
        const l = new Tone.LFO(0.15 + 0.12 * offsets[i], 0.04, 0.13).start(0);
        l.connect(g.gain);
        o.connect(g);
        o.start(0.07 * i);
      });
    }, 7);
  }

  function makeGrain(buffer: Tone.ToneAudioBuffer) {
    const player = new Tone.GrainPlayer({
      url: buffer,
      loop: true,
      grainSize: 0.2,
      overlap: 3,
      playbackRate: 1,
      loopStart: 0,
      loopEnd: 6.5,
    });
    const g = new Tone.Gain(0);
    player.connect(g);
    g.connect(grainBus);
    player.start();
    return { player, g };
  }

  async function capture(first = false) {
    try {
      const buffer = await renderGrainBuffer();
      const next = makeGrain(buffer);
      next.g.gain.rampTo(1, first ? 0.5 : 2);
      if (grainA) {
        const old = grainA;
        old.g.gain.rampTo(0, 2);
        later(() => {
          old.player.stop();
          old.player.dispose();
          old.g.dispose();
        }, 2400);
      }
      grainA = next;
      if (!first) emit({ type: "capture" });
    } catch {
      // ignore — best-effort capture
    }
  }
  await capture(true);
  every(() => capture(), 28000 + rnd() * 12000);

  /* grain mutations */
  every(() => {
    const p = getParams();
    if (grainA && rnd() < 0.35 + p.chaos * 0.55) {
      const gp = grainA.player;
      gp.detune = DETUNES[(rnd() * DETUNES.length) | 0];
      gp.grainSize = 0.07 + rnd() * (0.15 + p.chaos * 0.3);
      const ls = rnd() * 5;
      gp.loopStart = ls;
      gp.loopEnd = ls + 1.2 + rnd();
      gp.reverse = rnd() < p.chaos * 0.5;
      emit({ type: "grain" });
    }
  }, 2200);

  /* --- breath meta-LFO --- */
  let breath = 0;
  let breathT = rnd() * 1000;
  const breathPeriod = 380 + rnd() * 120;
  every(() => {
    breathT += 1;
    breath = Math.sin((breathT * 2 * Math.PI) / breathPeriod);
    const p = getParams();
    const wet = clamp(0.15 + p.space * 0.7 + space.wetBias + breath * 0.08, 0.08, 0.95);
    reverb.wet.rampTo(wet, 1);
  }, 1000);

  /* --- Markov --- */
  function nextIndex(cur: number, len: number, chaos: number) {
    const opts: [number, number][] = [];
    const add = (d: number, w: number) => {
      const t = cur + d;
      if (t >= 0 && t < len) opts.push([t, w]);
    };
    add(-1, 4);
    add(1, 4);
    add(-2, 3);
    add(2, 3);
    add(-3, 1.5);
    add(3, 1.5);
    add(0, 1);
    add(-4, 1);
    add(4, 1);
    if (rnd() < chaos * 0.6) {
      add(-6, 3);
      add(6, 3);
    }
    let sum = 0;
    for (const o of opts) sum += o[1];
    let x = rnd() * sum;
    for (const [t, w] of opts) if ((x -= w) <= 0) return t;
    return cur;
  }

  function scheduleVoice(i: number) {
    const p = getParams();
    const v = voices[i];
    const notes = scale().notes;
    v.cur = Math.min(notes.length - 1, nextIndex(v.cur, notes.length, p.chaos));
    v.note = notes[v.cur];
    v.osc.frequency.rampTo(Tone.Frequency(v.note).toFrequency() * octaveMul, 0.4);
    const dur = 6 + rnd() * 8;
    v.env.triggerAttackRelease(dur);
    emit({ type: "note", voice: i, note: v.note });
    const densityEff = Math.min(1, Math.max(0, p.density + breath * 0.12));
    const gap = dur * 0.6 + (2 + rnd() * 13) * (1.35 - densityEff);
    later(() => scheduleVoice(i), gap * 1000);
  }
  voices.forEach((_, i) => later(() => scheduleVoice(i), 400 + i * 2600));

  /* --- key changes --- */
  every(
    () => {
      let k = (rnd() * palette.length) | 0;
      if (palette[k] === scaleIdx) k = (k + 1) % palette.length;
      scaleIdx = palette[k];
      voices.forEach((v) => (v.cur = Math.min(v.cur, scale().notes.length - 1)));
      sub.frequency.rampTo(subHz(scale().sub[subStep]), 10);
      refreshPluckPool();
      emit({ type: "key", name: scale().name });
    },
    210000 + rnd() * 110000,
  );

  /* ============================================================
     RHYTHM SECTION — independent PRNG stream (rrnd), Tone.Transport
     ============================================================ */

  const groove = tPick(GROOVES);
  const steps = groove.steps;
  const bpm = Math.round(groove.bpm[0] + rrnd() * (groove.bpm[1] - groove.bpm[0]));
  try {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.swing = groove.swing[0] + rrnd() * (groove.swing[1] - groove.swing[0]);
    Tone.Transport.swingSubdivision = groove.sub;
  } catch {
    // ignore
  }
  emit({ type: "bpm", value: bpm });

  /* delay synced to tempo: dotted eighth */
  delay.delayTime.value = (60 / bpm) * 0.75;

  /* rhythm bypasses the drone lowpass filter: goes straight into the crusher
     (still gets lo-fi, delay and reverb), plus its own dry path direct to the
     limiter — punch that the reverb won't drown */
  const rhythmBus = new Tone.Gain(0);
  rhythmBus.connect(crusher);
  const rhythmDry = new Tone.Gain(0);
  rhythmBus.connect(rhythmDry);
  rhythmDry.connect(limiter);

  const kit = groove.kit;
  const boom = new Tone.MembraneSynth({
    pitchDecay: 0.11,
    octaves: kit.boomOct,
    envelope: { attack: 0.001, decay: kit.boomDecay, sustain: 0, release: 0.9 },
  });
  const boomFilter = new Tone.Filter(320, "lowpass");
  boomFilter.Q.value = 1.1;
  const boomGain = new Tone.Gain(1.5);
  boom.chain(boomFilter, boomGain, rhythmBus);

  const pluck = new Tone.PluckSynth({
    attackNoise: 0.8,
    dampening: kit.pluckDamp,
    resonance: kit.pluckRes,
  });
  const pluckGain = new Tone.Gain(0.75);
  pluck.chain(pluckGain, rhythmBus);

  const shaker = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.002, decay: kit.shakerDecay, sustain: 0 },
  });
  const shakerFilt = new Tone.Filter(kit.shakerHz, "highpass");
  const shakerGain = new Tone.Gain(0.3);
  shaker.chain(shakerFilt, shakerGain, rhythmBus);

  const ping = new Tone.FMSynth({
    harmonicity: kit.pingHarm,
    modulationIndex: kit.pingMod,
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
    modulation: { type: "sine" },
    modulationEnvelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
  });
  const pingGain = new Tone.Gain(0.2);
  ping.chain(pingGain, rhythmBus);

  /* Euclidean patterns: threshold = pulse value at which the track starts playing */
  interface Track {
    hits: number;
    rot: number;
    thresh: number;
    active: boolean;
    pat: boolean[];
  }
  const pickHits = (c: TrackCfg) => c.hits[0] + ((rrnd() * (c.hits[1] - c.hits[0] + 1)) | 0);
  const mkTrack = (c: TrackCfg): Track => ({
    hits: pickHits(c),
    rot: (rrnd() * steps) | 0,
    thresh: c.thresh,
    active: c.active,
    pat: [],
  });
  const tracks: Record<"boom" | "pluck" | "shaker" | "ping", Track> = {
    boom: mkTrack(groove.boom),
    pluck: mkTrack(groove.pluck),
    shaker: mkTrack(groove.shaker),
    ping: mkTrack(groove.ping),
  };
  for (const t of Object.values(tracks)) t.pat = euclid(t.hits, steps, t.rot);

  /* pluck tonal material — from the current scale, upper half */
  let pluckPool: string[] = [];
  function refreshPluckPool() {
    const notes = scale().notes;
    const start = Math.floor(notes.length / 2);
    pluckPool = [0, 1, 2].map(() => notes[start + ((rrnd() * (notes.length - start)) | 0)]);
  }
  refreshPluckPool();

  let step = 0;
  const gate = (track: keyof typeof tracks, p: Params): boolean | "ghost" => {
    const t = tracks[track];
    if (!t.active) return false;
    if (p.pulse < t.thresh) return false;
    let hit: boolean | "ghost" = t.pat[step];
    if (hit && rrnd() < p.chaos * 0.25) hit = false; // skip
    if (!hit && rrnd() < p.chaos * 0.08 * p.pulse) hit = "ghost"; // ghost note
    if (!hit) return false;
    const density = (0.65 + p.pulse * 0.35) * (1 + breath * 0.2);
    if (hit !== "ghost" && rrnd() > density) return false;
    return hit;
  };
  const jit = () => (rrnd() - 0.5) * 0.014;

  let loopId: number | null = null;
  try {
    loopId = Tone.Transport.scheduleRepeat((time) => {
      const p = getParams();
      if (p.pulse <= 0.03) {
        step = (step + 1) % steps;
        return;
      }
      let h: boolean | "ghost";
      try {
        if ((h = gate("boom", p))) {
          boom.triggerAttackRelease(
            scale().sub[0],
            0.4,
            time + jit(),
            h === "ghost" ? 0.25 : 0.6 + rrnd() * 0.35,
          );
          emit({ type: "hit", track: "boom" });
        }
        if ((h = gate("pluck", p))) {
          const note = pluckPool[(rrnd() * pluckPool.length) | 0];
          pluck.triggerAttack(note, time + jit());
          emit({ type: "hit", track: "pluck" });
        }
        if ((h = gate("shaker", p))) {
          shaker.triggerAttackRelease(0.06, time + jit(), h === "ghost" ? 0.2 : 0.4 + rrnd() * 0.4);
          emit({ type: "hit", track: "shaker" });
        }
        if ((h = gate("ping", p))) {
          const base = pluckPool[0] || "A4";
          let note = "A5";
          try {
            note = Tone.Frequency(base).transpose(12).toNote();
          } catch {
            // keep fallback note
          }
          ping.triggerAttackRelease(
            note,
            0.25,
            time + jit(),
            h === "ghost" ? 0.2 : 0.45 + rrnd() * 0.3,
          );
          emit({ type: "hit", track: "ping" });
        }
      } catch {
        // ignore — a bad trigger shouldn't stop the transport
      }
      step = (step + 1) % steps;
    }, groove.sub);
    Tone.Transport.start("+0.1");
  } catch {
    // ignore
  }

  /* pattern mutations — rhythm evolves lazily */
  every(() => {
    if (rrnd() < 0.6) {
      const keys = (Object.keys(tracks) as (keyof typeof tracks)[]).filter((k) => tracks[k].active);
      if (!keys.length) return;
      const k = keys[(rrnd() * keys.length) | 0];
      const t = tracks[k];
      if (rrnd() < 0.5) {
        t.rot = (t.rot + 1 + ((rrnd() * 3) | 0)) % steps;
      } else {
        // stay within the groove's character: hits drift inside its configured range
        const cfg = groove[k];
        const max = Math.min(steps, cfg.hits[1] + 1);
        t.hits = Math.max(cfg.hits[0], Math.min(max, t.hits + (rrnd() < 0.5 ? -1 : 1)));
      }
      t.pat = euclid(t.hits, steps, t.rot);
      if (k === "pluck") refreshPluckPool();
      emit({ type: "pattern" });
    }
  }, 52000);

  /* --- recorder --- */
  let recorder: Tone.Recorder | null = null;
  try {
    recorder = new Tone.Recorder();
    limiter.connect(recorder);
  } catch {
    recorder = null;
  }

  /* --- params --- */
  function apply(p: Params) {
    const base = 300 + Math.pow(p.brightness, 1.6) * 3300;
    filtLfo.min = base * 0.55;
    filtLfo.max = base * 1.55;
    reverb.wet.rampTo(clamp(0.15 + p.space * 0.7 + space.wetBias, 0.05, 0.95), 0.6);
    delay.feedback.rampTo(0.18 + p.space * 0.5, 0.6);
    delay.wet.rampTo(0.08 + p.space * 0.32, 0.6);
    grainBus.gain.rampTo(p.grain * 0.85, 0.6);
    if (grainA) grainA.player.overlap = 1.5 + p.density * 4;
    voices.forEach((v) =>
      v.gain.gain.rampTo((0.09 + (1 - p.grain * 0.45) * 0.13) * arch.drone, 0.6),
    );
    rhythmBus.gain.rampTo(Math.pow(p.pulse, 1.1) * 0.95, 0.6);
    rhythmDry.gain.rampTo(p.pulse * 0.4, 0.6);
    subLevel.gain.rampTo(p.sub * 1.6, 0.6);
    setShimmer(p.shimmer);
    crusher.wet.value = clamp(0.05 + p.lofi * 0.5 + space.crushBias, 0, 0.9);
    crusher.bits.value = Math.round(8 - p.lofi * 3.5);
  }
  apply(getParams());
  bus.gain.rampTo(0.85, 2.5);

  function dispose() {
    timers.tos.forEach(clearTimeout);
    timers.ivs.forEach(clearInterval);
    try {
      if (loopId !== null) Tone.Transport.clear(loopId);
      Tone.Transport.stop();
      Tone.Transport.cancel();
    } catch {
      // ignore
    }
    bus.gain.rampTo(0, 0.35);
    setTimeout(() => {
      [
        limiter,
        reverb,
        delay,
        crusher,
        filter,
        bus,
        filtLfo,
        sub,
        subGain,
        subLevel,
        subLfo,
        noise,
        noiseFilter,
        noiseGain,
        noiseLfo,
        noiseFiltLfo,
        grainBus,
        rhythmBus,
        rhythmDry,
        boom,
        boomFilter,
        boomGain,
        pluck,
        pluckGain,
        shaker,
        shakerFilt,
        shakerGain,
        ping,
        pingGain,
      ].forEach((n) => n.dispose());
      voices.forEach((v) => {
        v.osc.dispose();
        v.env.dispose();
        v.pan.dispose();
        v.gain.dispose();
        v.panLfo.dispose();
      });
      if (grainA) {
        grainA.player.dispose();
        grainA.g.dispose();
      }
      if (shimmer) {
        shimmer.ps.dispose();
        shimmer.g.dispose();
      }
      recorder?.dispose();
    }, 450);
  }

  return {
    apply,
    dispose,
    canRecord: !!recorder,
    startRec: () => recorder?.start(),
    stopRec: async () => {
      if (!recorder) return null;
      const blob = await recorder.stop();
      try {
        const ab = await blob.arrayBuffer();
        const decoded = await Tone.getContext().decodeAudioData(ab.slice(0));
        return { blob: audioBufferToWav(decoded), ext: "wav" };
      } catch {
        const ext = blob.type.includes("mp4") ? "m4a" : "webm";
        return { blob, ext };
      }
    },
  };
}
