import * as Tone from "tone";
import { DETUNES, SCALES } from "./constants";
import { buildDrums, type Hit } from "./drums";
import { deriveIdentity, type TrackCfg } from "./identity";
import { makeRng, euclid } from "./prng";
import { audioBufferToWav } from "./wav";
import type { EngineEvent, EngineHandle, Params } from "../types";

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

  // Timbre identity — a third independent PRNG (inside deriveIdentity) so
  // each seed sounds like a different "instrument" (voice archetype, filter
  // colour, room, harmonic palette, groove) without disturbing the
  // melody/rhythm draws above. The faders still shape it live on top.
  const {
    arch,
    flt,
    space,
    fQ,
    octaveMul,
    palette,
    scaleIdx: initialScaleIdx,
    groove,
    kit,
    fx,
    padTone,
  } = deriveIdentity(seed);

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

  let scaleIdx = initialScaleIdx;
  const scale = () => SCALES[scaleIdx];
  emit({ type: "key", name: scale().name });

  /* --- master chain --- */
  const limiter = new Tone.Limiter(-1).toDestination();
  // single master gain in front of the limiter — every path (drone wash + dry
  // rhythm) routes through it, so stop() can ramp the whole mix to silence in
  // one place for a smooth fade-out instead of a hard cut.
  const master = new Tone.Gain(1);
  master.connect(limiter);
  const reverb = new Tone.Reverb({ decay: space.decay, preDelay: space.preDelay, wet: 0.5 });
  await reverb.generate();
  const delay = new Tone.PingPongDelay({ delayTime: space.delayTime, feedback: 0.45, wet: 0.25 });
  const crusher = new Tone.BitCrusher(8);
  crusher.wet.value = 0.08;
  const filter = new Tone.Filter(1200, flt.type);
  filter.Q.value = fQ;
  filter.rolloff = flt.rolloff;
  const bus = new Tone.Gain(0);
  bus.connect(filter);

  // Per-seed wet-chain topology (identity.fx.chain): the same three modules
  // in a different order sound like a different machine — "tape" crushes the
  // echoes, "dub" echoes the reverb wash. The crusher always sits before the
  // reverb in every order (the shimmer tap below relies on that).
  type Wet3 = [Tone.ToneAudioNode, Tone.ToneAudioNode, Tone.ToneAudioNode];
  const wetChain: Wet3 = (
    {
      grit: [crusher, delay, reverb],
      tape: [delay, crusher, reverb],
      dub: [crusher, reverb, delay],
    } satisfies Record<typeof fx.chain, Wet3>
  )[fx.chain];
  wetChain[0].connect(wetChain[1]);
  wetChain[1].connect(wetChain[2]);
  wetChain[2].connect(master);

  // Optional per-seed color module (identity.fx.color) on the drone path only
  // — inserted after the filter so the rhythm bus stays untouched and punchy.
  let colorFx: Tone.ToneAudioNode | null = null;
  {
    const d = fx.colorDepth;
    if (fx.color === "chorus")
      colorFx = new Tone.Chorus({
        frequency: 0.2 + d * 0.4,
        delayTime: 4,
        depth: 0.4 + d * 0.4,
        wet: 0.5,
      }).start();
    else if (fx.color === "phaser")
      colorFx = new Tone.Phaser({
        frequency: 0.06 + d * 0.18,
        octaves: 2.5,
        baseFrequency: 320,
        wet: 0.4,
      });
    else if (fx.color === "vibrato")
      colorFx = new Tone.Vibrato({ frequency: 0.8 + d * 2.2, depth: 0.05 + d * 0.07, wet: 0.6 });
    else if (fx.color === "tremolo")
      colorFx = new Tone.Tremolo({
        frequency: 0.7 + d * 2.5,
        depth: 0.35 + d * 0.3,
        wet: 0.5,
      }).start();
    else if (fx.color === "shift") {
      const s = new Tone.FrequencyShifter(0.5 + d * 3);
      s.wet.value = 0.22;
      colorFx = s;
    }
  }
  if (colorFx) {
    filter.connect(colorFx);
    colorFx.connect(wetChain[0]);
  } else {
    filter.connect(wetChain[0]);
  }

  const filtLfo = new Tone.LFO({ frequency: 1 / 47, min: 600, max: 2000, type: "sine" }).start();
  filtLfo.connect(filter.frequency);

  /* --- shimmer (lazy) --- */
  let shimmer: { ps: Tone.PitchShift; g: Tone.Gain } | null = null;
  function setShimmer(on: boolean) {
    try {
      if (on && !shimmer) {
        const ps = new Tone.PitchShift({ pitch: 12, windowSize: 0.25 });
        const g = new Tone.Gain(0);
        // tap the crusher (always upstream of the reverb in every wet-chain
        // order) — tapping the delay would loop back on itself in "dub" order
        crusher.connect(ps);
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
    const wet = clamp(0.15 + p.space * 0.7 + space.wetBias + arch.wet + breath * 0.08, 0.08, 0.95);
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

  const steps = groove.steps;
  emit({ type: "character", instrument: arch.name, space: space.name, groove: groove.name });
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

  /* rhythm bypasses the drone lowpass filter (and the color module): goes
     straight into the head of the wet chain (still gets lo-fi, delay and
     reverb), plus its own dry path direct to the limiter — punch that the
     reverb won't drown */
  const rhythmBus = new Tone.Gain(0);
  rhythmBus.connect(wetChain[0]);
  const rhythmDry = new Tone.Gain(0);
  rhythmBus.connect(rhythmDry);
  rhythmDry.connect(master);

  // Each drum role is built from a per-seed *recipe* (drums.ts, keyed by
  // identity.kit) instead of one fixed synth, so the same groove can sound
  // like a different machine from seed to seed. The groove's kit numbers still
  // set the base character; the recipe chooses how it's synthesised.
  // Voices are closures over their nodes; `keep` collects nodes for disposal.
  const drumNodes: Tone.ToneAudioNode[] = [];
  const keep = (...n: Tone.ToneAudioNode[]): void => void drumNodes.push(...n);
  const drums = buildDrums({ gk: groove.kit, kit, keep, subNote: () => scale().sub[0] }, rhythmBus);

  /* Euclidean patterns: threshold = pulse value at which the track starts playing.
     Polymeter: boom anchors the base grid, but every other track may run a
     cycle a quarter shorter or longer (independent `<seed>-poly` stream), so
     the patterns phase against each other over several bars instead of
     realigning every bar. */
  const prnd = makeRng(`${seed}-poly`);
  const quarter = Math.max(2, Math.round(steps / 4));
  const polyLen = (anchor: boolean) => {
    if (anchor || prnd() < 0.5) return steps;
    return prnd() < 0.5 ? steps - quarter : steps + quarter;
  };
  interface Track {
    hits: number;
    rot: number;
    thresh: number;
    active: boolean;
    len: number;
    pat: boolean[];
  }
  const pickHits = (c: TrackCfg) => c.hits[0] + ((rrnd() * (c.hits[1] - c.hits[0] + 1)) | 0);
  const mkTrack = (c: TrackCfg, anchor = false): Track => ({
    hits: pickHits(c),
    rot: (rrnd() * steps) | 0,
    thresh: c.thresh,
    active: c.active,
    len: polyLen(anchor),
    pat: [],
  });
  const tracks: Record<"boom" | "pluck" | "shaker" | "ping" | "rim", Track> = {
    boom: mkTrack(groove.boom, true),
    pluck: mkTrack(groove.pluck),
    shaker: mkTrack(groove.shaker),
    ping: mkTrack(groove.ping),
    rim: mkTrack(groove.rim),
  };
  for (const t of Object.values(tracks)) t.pat = euclid(t.hits, t.len, t.rot);

  /* pluck tonal material — from the current scale, upper half */
  let pluckPool: string[] = [];
  function refreshPluckPool() {
    const notes = scale().notes;
    const start = Math.floor(notes.length / 2);
    pluckPool = [0, 1, 2].map(() => notes[start + ((rrnd() * (notes.length - start)) | 0)]);
  }
  refreshPluckPool();

  let step = 0; // global step counter — bar position is step % steps
  const gate = (track: keyof typeof tracks, p: Params): boolean | "ghost" => {
    const t = tracks[track];
    if (!t.active) return false;
    if (p.pulse < t.thresh) return false;
    let hit: boolean | "ghost" = t.pat[step % t.len];
    if (hit && rrnd() < p.chaos * 0.25) hit = false; // skip
    if (!hit && rrnd() < p.chaos * 0.08 * p.pulse) hit = "ghost"; // ghost note
    if (!hit) return false;
    const density = (0.65 + p.pulse * 0.35) * (1 + breath * 0.2);
    if (hit !== "ghost" && rrnd() > density) return false;
    return hit;
  };
  const jit = () => (rrnd() - 0.5) * 0.014;

  /* metric accent — downbeat > beats > eighths > offbeats, so the groove has
     a pocket instead of flat random velocity. Full hits are scaled by it;
     ghost notes stay quiet as-is. */
  const accent = (s: number) =>
    s === 0 ? 1 : s % quarter === 0 ? 0.85 : s % 2 === 0 ? 0.68 : 0.55;

  /* fill: one rising bar played right before a pending pattern mutation, so
     the change lands as a phrase instead of a silent swap. Uses the most
     textural active voice. */
  let fillArm = false;
  let fillLeft = 0;
  let pendingMut: (() => void) | null = null;
  const [fillHit, fillTrack]: [Hit, "rim" | "shaker" | "pluck"] = groove.rim.active
    ? [drums.rim, "rim"]
    : groove.shaker.active
      ? [drums.hat, "shaker"]
      : [(time, vel) => drums.pluck(pluckPool[0] || "A4", time, vel), "pluck"];

  let loopId: number | null = null;
  try {
    loopId = Tone.Transport.scheduleRepeat((time) => {
      const p = getParams();
      const barPos = step % steps;
      if (p.pulse <= 0.03) {
        // pulse is down — apply any pending mutation silently, skip the fill
        if (pendingMut) {
          pendingMut();
          pendingMut = null;
        }
        fillArm = false;
        fillLeft = 0;
        step++;
        return;
      }
      const am = 0.55 + 0.45 * accent(barPos);
      let h: boolean | "ghost";
      try {
        if ((h = gate("boom", p))) {
          drums.kick(time + jit(), h === "ghost" ? 0.25 : (0.6 + rrnd() * 0.35) * am);
          emit({ type: "hit", track: "boom" });
        }
        if ((h = gate("pluck", p))) {
          const note = pluckPool[(rrnd() * pluckPool.length) | 0];
          drums.pluck(note, time + jit(), h === "ghost" ? 0.3 : (0.6 + rrnd() * 0.3) * am);
          emit({ type: "hit", track: "pluck" });
        }
        if ((h = gate("shaker", p))) {
          drums.hat(time + jit(), h === "ghost" ? 0.2 : (0.4 + rrnd() * 0.4) * am);
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
          drums.ping(note, 0.25, time + jit(), h === "ghost" ? 0.2 : (0.45 + rrnd() * 0.3) * am);
          emit({ type: "hit", track: "ping" });
        }
        if ((h = gate("rim", p))) {
          drums.rim(time + jit(), h === "ghost" ? 0.2 : (0.45 + rrnd() * 0.35) * am);
          emit({ type: "hit", track: "rim" });
        }
        if (fillArm && barPos === 0) {
          fillArm = false;
          fillLeft = steps;
        }
        if (fillLeft > 0) {
          const prog = 1 - fillLeft / steps;
          if (barPos % 2 === 0 && rrnd() < 0.15 + 0.6 * prog) {
            fillHit(time + jit(), 0.25 + 0.55 * prog);
            emit({ type: "hit", track: fillTrack });
          }
          fillLeft--;
          if (fillLeft === 0 && pendingMut) {
            pendingMut();
            pendingMut = null;
          }
        }
      } catch {
        // ignore — a bad trigger shouldn't stop the transport
      }
      step++;
    }, groove.sub);
    Tone.Transport.start("+0.1");
  } catch {
    // ignore
  }

  /* pattern mutations — rhythm evolves lazily. When the pulse is up, the
     mutation is deferred behind a one-bar fill (armed at the next bar turn);
     when it's quiet, it just swaps in place like before. */
  every(() => {
    if (rrnd() < 0.6) {
      const keys = (Object.keys(tracks) as (keyof typeof tracks)[]).filter((k) => tracks[k].active);
      if (!keys.length) return;
      const k = keys[(rrnd() * keys.length) | 0];
      const t = tracks[k];
      const mutate = () => {
        if (rrnd() < 0.5) {
          t.rot = (t.rot + 1 + ((rrnd() * 3) | 0)) % t.len;
        } else {
          // stay within the groove's character: hits drift inside its configured range
          const cfg = groove[k];
          const max = Math.min(t.len, cfg.hits[1] + 1);
          t.hits = Math.max(cfg.hits[0], Math.min(max, t.hits + (rrnd() < 0.5 ? -1 : 1)));
        }
        t.pat = euclid(t.hits, t.len, t.rot);
        if (k === "pluck") refreshPluckPool();
        emit({ type: "pattern" });
      };
      if (getParams().pulse > 0.4 && !pendingMut) {
        pendingMut = mutate;
        fillArm = true;
      } else {
        mutate();
      }
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
    // arch.cut spreads the instruments bright↔dark; padTone nudges each seed a
    // little within its archetype so even two "warm pad" seeds aren't identical.
    const cutScale = arch.cut * (0.88 + padTone * 0.24);
    const base = (300 + Math.pow(p.brightness, 1.6) * 3300) * cutScale;
    filtLfo.min = base * 0.55;
    filtLfo.max = base * 1.55;
    reverb.wet.rampTo(clamp(0.15 + p.space * 0.7 + space.wetBias + arch.wet, 0.05, 0.95), 0.6);
    delay.feedback.rampTo(0.18 + p.space * 0.5, 0.6);
    delay.wet.rampTo(0.08 + p.space * 0.32, 0.6);
    grainBus.gain.rampTo(p.grain * 0.85, 0.6);
    if (grainA) grainA.player.overlap = 1.5 + p.density * 4;
    voices.forEach((v) =>
      v.gain.gain.rampTo((0.09 + (1 - p.grain * 0.45) * 0.13) * arch.drone, 0.6),
    );
    // keep the pulse forward and dry: most of its level comes from the dry path
    // straight to master, and only a little feeds the reverb/delay wet chain —
    // so the drums don't wash out as the space fader (or a roomy seed) opens up.
    rhythmBus.gain.rampTo(Math.pow(p.pulse, 1.1) * 0.5, 0.6);
    rhythmDry.gain.rampTo(p.pulse * 0.72, 0.6);
    subLevel.gain.rampTo(p.sub * 1.6, 0.6);
    setShimmer(p.shimmer);
    crusher.wet.value = clamp(0.05 + p.lofi * 0.5 + space.crushBias, 0, 0.9);
    crusher.bits.value = Math.round(8 - p.lofi * 3.5);
  }
  apply(getParams());
  bus.gain.rampTo(0.85, 2.5);

  // fade: ramp the whole mix to silence before tearing down, so stop() lets the
  // current notes + reverb tail ring out instead of hard-cutting. Timers and the
  // transport stop right away so nothing *new* triggers during the fade.
  function dispose(fade = 1.6) {
    timers.tos.forEach(clearTimeout);
    timers.ivs.forEach(clearInterval);
    try {
      if (loopId !== null) Tone.Transport.clear(loopId);
      Tone.Transport.stop();
      Tone.Transport.cancel();
    } catch {
      // ignore
    }
    master.gain.rampTo(0, fade);
    setTimeout(
      () => {
        [
          limiter,
          master,
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
          ...(colorFx ? [colorFx] : []),
          ...drumNodes,
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
      },
      fade * 1000 + 250,
    );
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
