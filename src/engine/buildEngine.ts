import * as Tone from "tone";
import { DETUNES, SCALES } from "./constants";
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
  reverb.connect(master);
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

  /* rhythm bypasses the drone lowpass filter: goes straight into the crusher
     (still gets lo-fi, delay and reverb), plus its own dry path direct to the
     limiter — punch that the reverb won't drown */
  const rhythmBus = new Tone.Gain(0);
  rhythmBus.connect(crusher);
  const rhythmDry = new Tone.Gain(0);
  rhythmBus.connect(rhythmDry);
  rhythmDry.connect(master);

  const gk = groove.kit;

  // Each drum role is built from a per-seed *method* (identity.kit) instead of
  // one fixed synth, so the same groove can sound like a different machine from
  // seed to seed. The groove's `gk` numbers still set the base character; the
  // method chooses how that character is synthesised (and adds snare/metal).
  // Voices are closures over their nodes; `keep` collects nodes for disposal.
  const drumNodes: Tone.ToneAudioNode[] = [];
  const keep = (...n: Tone.ToneAudioNode[]): void => void drumNodes.push(...n);

  /* kick — membrane, pitch-swept sine body (808), or body + noise click */
  const kick = (() => {
    const out = new Tone.Gain(kit.kick === "membrane" ? 1.5 : 1.15);
    out.connect(rhythmBus);
    if (kit.kick === "membrane") {
      const m = new Tone.MembraneSynth({
        pitchDecay: 0.11,
        octaves: gk.boomOct,
        envelope: { attack: 0.001, decay: gk.boomDecay, sustain: 0, release: 0.9 },
      });
      const f = new Tone.Filter(320, "lowpass");
      f.Q.value = 1.1;
      m.chain(f, out);
      keep(m, f, out);
      return (time: number, vel: number) => m.triggerAttackRelease(scale().sub[0], 0.4, time, vel);
    }
    const startHz = 120 + kit.kickTune * 45;
    const endHz = 42 + kit.kickTune * 12;
    const decay = gk.boomDecay * 0.7;
    const body = new Tone.Oscillator(startHz, "sine");
    const env = new Tone.AmplitudeEnvelope({ attack: 0.001, decay, sustain: 0, release: 0.06 });
    const drive = new Tone.Distortion(0.12);
    drive.wet.value = 0.5;
    body.chain(env, drive, out);
    body.start();
    keep(body, env, drive, out);
    let click: Tone.NoiseSynth | null = null;
    if (kit.kick === "layered") {
      click = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.012, sustain: 0 },
      });
      const hp = new Tone.Filter(1400, "highpass");
      const cg = new Tone.Gain(0.5);
      click.chain(hp, cg, out);
      keep(click, hp, cg);
    }
    return (time: number, vel: number) => {
      body.frequency.setValueAtTime(startHz, time);
      body.frequency.exponentialRampToValueAtTime(endHz, time + 0.08);
      env.triggerAttackRelease(decay, time, vel);
      click?.triggerAttackRelease(0.02, time, vel);
    };
  })();

  /* hat (shaker role) — filtered-noise tick, or metallic MetalSynth */
  const hat = (() => {
    const out = new Tone.Gain(0.3);
    out.connect(rhythmBus);
    if (kit.hat === "metal") {
      const m = new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 3000 + kit.hatTune * 3000,
        octaves: 1.5,
        envelope: { attack: 0.001, decay: gk.shakerDecay + 0.02, release: 0.02 },
      });
      const hp = new Tone.Filter(gk.shakerHz * 0.7, "highpass");
      m.chain(hp, out);
      keep(m, hp, out);
      return (time: number, vel: number) =>
        m.triggerAttackRelease("C5", gk.shakerDecay + 0.02, time, vel);
    }
    const n = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.002, decay: gk.shakerDecay, sustain: 0 },
    });
    const f = new Tone.Filter(gk.shakerHz, "highpass");
    n.chain(f, out);
    keep(n, f, out);
    return (time: number, vel: number) => n.triggerAttackRelease(0.06, time, vel);
  })();

  /* pluck role — tonal Karplus pluck, or a layered tone+noise snare */
  const pluckVoice = (() => {
    const out = new Tone.Gain(0.75);
    out.connect(rhythmBus);
    if (kit.pluckVoice === "snare") {
      const o = new Tone.Oscillator(180, "triangle");
      const oe = new Tone.AmplitudeEnvelope({
        attack: 0.001,
        decay: 0.12,
        sustain: 0,
        release: 0.04,
      });
      o.chain(oe, out);
      o.start();
      const n = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
      });
      const bp = new Tone.Filter(2400, "bandpass");
      bp.Q.value = 0.8;
      const ng = new Tone.Gain(0.8);
      n.chain(bp, ng, out);
      keep(o, oe, n, bp, ng, out);
      return (_note: string, time: number, vel: number) => {
        oe.triggerAttackRelease(0.12, time, vel * 0.7);
        n.triggerAttackRelease(0.2, time, vel);
      };
    }
    const pl = new Tone.PluckSynth({
      attackNoise: 0.8,
      dampening: gk.pluckDamp,
      resonance: gk.pluckRes,
    });
    pl.connect(out);
    keep(pl, out);
    return (note: string, time: number, _vel: number) => pl.triggerAttack(note, time);
  })();

  /* ping — bright tonal blip: FM (default) or AM */
  const ping = (() => {
    const out = new Tone.Gain(0.2);
    out.connect(rhythmBus);
    if (kit.ping === "am") {
      const s = new Tone.AMSynth({
        harmonicity: gk.pingHarm * 0.5,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
      });
      s.connect(out);
      keep(s, out);
      return (note: string, dur: number, time: number, vel: number) =>
        s.triggerAttackRelease(note, dur, time, vel);
    }
    const s = new Tone.FMSynth({
      harmonicity: gk.pingHarm,
      modulationIndex: gk.pingMod,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
      modulation: { type: "sine" },
      modulationEnvelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
    });
    s.connect(out);
    keep(s, out);
    return (note: string, dur: number, time: number, vel: number) =>
      s.triggerAttackRelease(note, dur, time, vel);
  })();

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
          kick(time + jit(), h === "ghost" ? 0.25 : 0.6 + rrnd() * 0.35);
          emit({ type: "hit", track: "boom" });
        }
        if ((h = gate("pluck", p))) {
          const note = pluckPool[(rrnd() * pluckPool.length) | 0];
          pluckVoice(note, time + jit(), h === "ghost" ? 0.3 : 0.6 + rrnd() * 0.3);
          emit({ type: "hit", track: "pluck" });
        }
        if ((h = gate("shaker", p))) {
          hat(time + jit(), h === "ghost" ? 0.2 : 0.4 + rrnd() * 0.4);
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
          ping(note, 0.25, time + jit(), h === "ghost" ? 0.2 : 0.45 + rrnd() * 0.3);
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
