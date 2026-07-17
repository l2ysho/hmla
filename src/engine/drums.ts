import * as Tone from "tone";
import type { Groove, KitChoice } from "./identity";

/**
 * Drum-voice recipes — each role (kick/hat/pluck/ping/rim) is a small registry
 * of synthesis methods keyed by the per-seed `KitChoice`, so adding a new drum
 * sound is one entry here instead of another branch in buildEngine. The
 * groove's `gk` numbers set the base character; the method decides how that
 * character is synthesised.
 */

/** Context a recipe builds against: the groove's base kit numbers, the
 * per-seed method + tune choices, a disposal collector, and the current scale
 * root (for tonal kicks — read at trigger time so key changes carry over). */
export interface DrumCtx {
  gk: Groove["kit"];
  kit: KitChoice;
  keep: (...n: Tone.ToneAudioNode[]) => void;
  subNote: () => string;
}

export type Hit = (time: number, vel: number) => void;
export type NoteHit = (note: string, time: number, vel: number) => void;
export type PingHit = (note: string, dur: number, time: number, vel: number) => void;

export interface DrumVoices {
  kick: Hit;
  hat: Hit;
  pluck: NoteHit;
  ping: PingHit;
  rim: Hit;
}

type Builder<T> = (ctx: DrumCtx, dest: Tone.ToneAudioNode) => T;

/* ---- kick — deep membrane, pitch-swept sine body (808), body + noise click,
   or a tight hand-drum knock ---- */

function sweepKick(ctx: DrumCtx, dest: Tone.ToneAudioNode, layered: boolean): Hit {
  const { gk, kit, keep } = ctx;
  const out = new Tone.Gain(1.15);
  out.connect(dest);
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
  if (layered) {
    click = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.012, sustain: 0 },
    });
    const hp = new Tone.Filter(1400, "highpass");
    const cg = new Tone.Gain(0.5);
    click.chain(hp, cg, out);
    keep(click, hp, cg);
  }
  return (time, vel) => {
    body.frequency.setValueAtTime(startHz, time);
    body.frequency.exponentialRampToValueAtTime(endHz, time + 0.08);
    env.triggerAttackRelease(decay, time, vel);
    click?.triggerAttackRelease(0.02, time, vel);
  };
}

const KICKS: Record<KitChoice["kick"], Builder<Hit>> = {
  membrane(ctx, dest) {
    const out = new Tone.Gain(1.5);
    out.connect(dest);
    const m = new Tone.MembraneSynth({
      pitchDecay: 0.11,
      octaves: ctx.gk.boomOct,
      envelope: { attack: 0.001, decay: ctx.gk.boomDecay, sustain: 0, release: 0.9 },
    });
    const f = new Tone.Filter(320, "lowpass");
    f.Q.value = 1.1;
    m.chain(f, out);
    ctx.keep(m, f, out);
    return (time, vel) => m.triggerAttackRelease(ctx.subNote(), 0.4, time, vel);
  },
  synth: (ctx, dest) => sweepKick(ctx, dest, false),
  layered: (ctx, dest) => sweepKick(ctx, dest, true),
  knock(ctx, dest) {
    const out = new Tone.Gain(1.3);
    out.connect(dest);
    const m = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 1.6,
      envelope: { attack: 0.001, decay: ctx.gk.boomDecay * 0.4, sustain: 0, release: 0.2 },
    });
    const f = new Tone.Filter(260 + ctx.kit.kickTune * 120, "bandpass");
    f.Q.value = 1;
    m.chain(f, out);
    ctx.keep(m, f, out);
    return (time, vel) => m.triggerAttackRelease(90 + ctx.kit.kickTune * 70, 0.25, time, vel);
  },
};

/* ---- hat (shaker role) — filtered-noise tick, metallic MetalSynth, or a
   soft brushy dust ---- */

const HATS: Record<KitChoice["hat"], Builder<Hit>> = {
  noise(ctx, dest) {
    const out = new Tone.Gain(0.3);
    out.connect(dest);
    const n = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.002, decay: ctx.gk.shakerDecay, sustain: 0 },
    });
    const f = new Tone.Filter(ctx.gk.shakerHz, "highpass");
    n.chain(f, out);
    ctx.keep(n, f, out);
    return (time, vel) => n.triggerAttackRelease(0.06, time, vel);
  },
  metal(ctx, dest) {
    const out = new Tone.Gain(0.3);
    out.connect(dest);
    const m = new Tone.MetalSynth({
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 3000 + ctx.kit.hatTune * 3000,
      octaves: 1.5,
      envelope: { attack: 0.001, decay: ctx.gk.shakerDecay + 0.02, release: 0.02 },
    });
    const hp = new Tone.Filter(ctx.gk.shakerHz * 0.7, "highpass");
    m.chain(hp, out);
    ctx.keep(m, hp, out);
    return (time, vel) => m.triggerAttackRelease("C5", ctx.gk.shakerDecay + 0.02, time, vel);
  },
  dust(ctx, dest) {
    const out = new Tone.Gain(0.24);
    out.connect(dest);
    const dur = ctx.gk.shakerDecay * 2.4;
    const n = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.004, decay: dur, sustain: 0 },
    });
    const bp = new Tone.Filter(5200 + ctx.kit.hatTune * 3000, "bandpass");
    bp.Q.value = 1.4;
    n.chain(bp, out);
    ctx.keep(n, bp, out);
    return (time, vel) => n.triggerAttackRelease(dur, time, vel);
  },
};

/* ---- pluck role — tonal Karplus pluck, layered tone+noise snare, or a soft
   FM bell an octave up ---- */

const PLUCKS: Record<KitChoice["pluckVoice"], Builder<NoteHit>> = {
  pluck(ctx, dest) {
    const out = new Tone.Gain(0.75);
    out.connect(dest);
    const pl = new Tone.PluckSynth({
      attackNoise: 0.8,
      dampening: ctx.gk.pluckDamp,
      resonance: ctx.gk.pluckRes,
    });
    pl.connect(out);
    ctx.keep(pl, out);
    return (note, time, _vel) => pl.triggerAttack(note, time);
  },
  snare(ctx, dest) {
    const out = new Tone.Gain(0.75);
    out.connect(dest);
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
    ctx.keep(o, oe, n, bp, ng, out);
    return (_note, time, vel) => {
      oe.triggerAttackRelease(0.12, time, vel * 0.7);
      n.triggerAttackRelease(0.2, time, vel);
    };
  },
  bell(ctx, dest) {
    const out = new Tone.Gain(0.5);
    out.connect(dest);
    const s = new Tone.FMSynth({
      harmonicity: 3.01,
      modulationIndex: 7,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 1.1, sustain: 0, release: 0.4 },
      modulation: { type: "sine" },
      modulationEnvelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.2 },
    });
    s.connect(out);
    ctx.keep(s, out);
    return (note, time, vel) => {
      let n = note;
      try {
        n = Tone.Frequency(note).transpose(12).toNote();
      } catch {
        // keep the untransposed note
      }
      s.triggerAttackRelease(n, 0.8, time, vel * 0.6);
    };
  },
};

/* ---- ping — bright tonal blip: FM, AM, or a soft square chip-blip ---- */

const PINGS: Record<KitChoice["ping"], Builder<PingHit>> = {
  fm(ctx, dest) {
    const out = new Tone.Gain(0.2);
    out.connect(dest);
    const s = new Tone.FMSynth({
      harmonicity: ctx.gk.pingHarm,
      modulationIndex: ctx.gk.pingMod,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
      modulation: { type: "sine" },
      modulationEnvelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
    });
    s.connect(out);
    ctx.keep(s, out);
    return (note, dur, time, vel) => s.triggerAttackRelease(note, dur, time, vel);
  },
  am(ctx, dest) {
    const out = new Tone.Gain(0.2);
    out.connect(dest);
    const s = new Tone.AMSynth({
      harmonicity: ctx.gk.pingHarm * 0.5,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
    });
    s.connect(out);
    ctx.keep(s, out);
    return (note, dur, time, vel) => s.triggerAttackRelease(note, dur, time, vel);
  },
  blip(ctx, dest) {
    const out = new Tone.Gain(0.18);
    out.connect(dest);
    const s = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
    });
    const lp = new Tone.Filter(2400, "lowpass");
    s.chain(lp, out);
    ctx.keep(s, lp, out);
    return (note, dur, time, vel) => s.triggerAttackRelease(note, Math.min(dur, 0.12), time, vel);
  },
};

/* ---- rim — short percussive interjection: rimshot snap, woodblock knock,
   or a dry tick ---- */

const RIMS: Record<KitChoice["rim"], Builder<Hit>> = {
  rim(ctx, dest) {
    const out = new Tone.Gain(0.5);
    out.connect(dest);
    const o = new Tone.Oscillator(1500 + ctx.kit.rimTune * 700, "triangle");
    const oe = new Tone.AmplitudeEnvelope({
      attack: 0.001,
      decay: 0.03,
      sustain: 0,
      release: 0.01,
    });
    o.chain(oe, out);
    o.start();
    const n = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0 },
    });
    const hp = new Tone.Filter(3000, "highpass");
    const ng = new Tone.Gain(0.6);
    n.chain(hp, ng, out);
    ctx.keep(o, oe, n, hp, ng, out);
    return (time, vel) => {
      oe.triggerAttackRelease(0.03, time, vel);
      n.triggerAttackRelease(0.02, time, vel * 0.8);
    };
  },
  wood(ctx, dest) {
    const out = new Tone.Gain(0.55);
    out.connect(dest);
    const m = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 0.7,
      envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.03 },
    });
    m.connect(out);
    ctx.keep(m, out);
    return (time, vel) => m.triggerAttackRelease(620 + ctx.kit.rimTune * 420, 0.06, time, vel);
  },
  click(ctx, dest) {
    const out = new Tone.Gain(0.4);
    out.connect(dest);
    const s = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.0005, decay: 0.016, sustain: 0, release: 0.01 },
    });
    const hp = new Tone.Filter(2200, "highpass");
    s.chain(hp, out);
    ctx.keep(s, hp, out);
    return (time, vel) => s.triggerAttackRelease(1800 + ctx.kit.rimTune * 1200, 0.02, time, vel);
  },
};

export function buildDrums(ctx: DrumCtx, dest: Tone.ToneAudioNode): DrumVoices {
  return {
    kick: KICKS[ctx.kit.kick](ctx, dest),
    hat: HATS[ctx.kit.hat](ctx, dest),
    pluck: PLUCKS[ctx.kit.pluckVoice](ctx, dest),
    ping: PINGS[ctx.kit.ping](ctx, dest),
    rim: RIMS[ctx.kit.rim](ctx, dest),
  };
}
