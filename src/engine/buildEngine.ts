import * as Tone from "tone";
import { DETUNES, SCALES } from "./constants";
import { makeRng, euclid } from "./prng";
import { audioBufferToWav } from "./wav";
import type { EngineEvent, EngineHandle, Params } from "../types";

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

  let scaleIdx = Math.floor(rnd() * SCALES.length);
  const scale = () => SCALES[scaleIdx];
  emit({ type: "key", name: scale().name });

  /* --- master chain --- */
  const limiter = new Tone.Limiter(-1).toDestination();
  const reverb = new Tone.Reverb({ decay: 9, preDelay: 0.05, wet: 0.5 });
  await reverb.generate();
  reverb.connect(limiter);
  const delay = new Tone.PingPongDelay({ delayTime: 0.42, feedback: 0.45, wet: 0.25 });
  delay.connect(reverb);
  const crusher = new Tone.BitCrusher(8);
  crusher.wet.value = 0.08;
  crusher.connect(delay);
  const filter = new Tone.Filter(1200, "lowpass");
  filter.Q.value = 0.6;
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
    const osc = new Tone.FatOscillator(220, i === 2 ? "triangle" : "sawtooth", 16 + i * 7);
    osc.count = 3;
    const env = new Tone.AmplitudeEnvelope({
      attack: 5 + i * 1.5,
      decay: 2,
      sustain: 0.75,
      release: 7 + i * 2,
    });
    const pan = new Tone.Panner(0);
    const gain = new Tone.Gain(i === 0 ? 0.2 : 0.16);
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
  const sub = new Tone.Oscillator(Tone.Frequency(scale().sub[0]).toFrequency(), "sine");
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
    sub.frequency.rampTo(Tone.Frequency(scale().sub[subStep]).toFrequency(), 8);
  }, 52000);

  /* --- pink noise texture --- */
  const noise = new Tone.Noise("pink").start();
  const noiseFilter = new Tone.Filter(600, "lowpass");
  const noiseGain = new Tone.Gain(0.035);
  const noiseLfo = new Tone.LFO({ frequency: 1 / 29, min: 0.015, max: 0.05 }).start();
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
    const wet = Math.min(0.92, Math.max(0.1, 0.15 + p.space * 0.7 + breath * 0.08));
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
    v.osc.frequency.rampTo(Tone.Frequency(v.note).toFrequency(), 0.4);
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
      let next = Math.floor(rnd() * SCALES.length);
      if (next === scaleIdx) next = (next + 1) % SCALES.length;
      scaleIdx = next;
      voices.forEach((v) => (v.cur = Math.min(v.cur, scale().notes.length - 1)));
      sub.frequency.rampTo(Tone.Frequency(scale().sub[subStep]).toFrequency(), 10);
      refreshPluckPool();
      emit({ type: "key", name: scale().name });
    },
    210000 + rnd() * 110000,
  );

  /* ============================================================
     RHYTHM SECTION — independent PRNG stream (rrnd), Tone.Transport
     ============================================================ */

  const bpm = Math.round(54 + rrnd() * 18);
  try {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.swing = 0.08 + rrnd() * 0.08;
    Tone.Transport.swingSubdivision = "16n";
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

  const boom = new Tone.MembraneSynth({
    pitchDecay: 0.11,
    octaves: 2.3,
    envelope: { attack: 0.001, decay: 0.7, sustain: 0, release: 0.9 },
  });
  const boomFilter = new Tone.Filter(320, "lowpass");
  boomFilter.Q.value = 1.1;
  const boomGain = new Tone.Gain(1.5);
  boom.chain(boomFilter, boomGain, rhythmBus);

  const pluck = new Tone.PluckSynth({ attackNoise: 0.8, dampening: 3200, resonance: 0.92 });
  const pluckGain = new Tone.Gain(0.75);
  pluck.chain(pluckGain, rhythmBus);

  const shaker = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.002, decay: 0.05, sustain: 0 },
  });
  const shakerFilt = new Tone.Filter(5000, "highpass");
  const shakerGain = new Tone.Gain(0.3);
  shaker.chain(shakerFilt, shakerGain, rhythmBus);

  const ping = new Tone.FMSynth({
    harmonicity: 5.07,
    modulationIndex: 14,
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
    pat: boolean[];
  }
  const tracks: Record<"boom" | "pluck" | "shaker" | "ping", Track> = {
    boom: { hits: 2 + (rrnd() < 0.4 ? 1 : 0), rot: 0, thresh: 0.05, pat: [] },
    pluck: { hits: 5, rot: (rrnd() * 16) | 0, thresh: 0.28, pat: [] },
    shaker: { hits: 7, rot: (rrnd() * 16) | 0, thresh: 0.55, pat: [] },
    ping: { hits: 1 + (rrnd() < 0.5 ? 1 : 0), rot: (rrnd() * 16) | 0, thresh: 0.72, pat: [] },
  };
  for (const t of Object.values(tracks)) t.pat = euclid(t.hits, 16, t.rot);

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
        step = (step + 1) % 16;
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
      step = (step + 1) % 16;
    }, "16n");
    Tone.Transport.start("+0.1");
  } catch {
    // ignore
  }

  /* pattern mutations — rhythm evolves lazily */
  every(() => {
    if (rrnd() < 0.6) {
      const keys = Object.keys(tracks) as (keyof typeof tracks)[];
      const k = keys[(rrnd() * keys.length) | 0];
      const t = tracks[k];
      if (rrnd() < 0.5) {
        t.rot = (t.rot + 1 + ((rrnd() * 3) | 0)) % 16;
      } else {
        const max = k === "boom" ? 4 : k === "ping" ? 3 : 9;
        t.hits = Math.max(1, Math.min(max, t.hits + (rrnd() < 0.5 ? -1 : 1)));
      }
      t.pat = euclid(t.hits, 16, t.rot);
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
    reverb.wet.rampTo(0.15 + p.space * 0.7, 0.6);
    delay.feedback.rampTo(0.18 + p.space * 0.5, 0.6);
    delay.wet.rampTo(0.08 + p.space * 0.32, 0.6);
    grainBus.gain.rampTo(p.grain * 0.85, 0.6);
    if (grainA) grainA.player.overlap = 1.5 + p.density * 4;
    voices.forEach((v) => v.gain.gain.rampTo(0.09 + (1 - p.grain * 0.45) * 0.13, 0.6));
    rhythmBus.gain.rampTo(Math.pow(p.pulse, 1.1) * 0.95, 0.6);
    rhythmDry.gain.rampTo(p.pulse * 0.4, 0.6);
    subLevel.gain.rampTo(p.sub * 1.6, 0.6);
    setShimmer(p.shimmer);
    crusher.wet.value = 0.05 + p.lofi * 0.5;
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
