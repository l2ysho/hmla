import * as Tone from "tone";
import { parseTrack, renderEvents } from "./patterns";
import { makeRng } from "./prng";
import { audioBufferToWav } from "./wav";
import type { Pattern } from "@strudel/core";
import type { EngineEvent, EngineHandle, Params } from "../types";

/**
 * Lo-fi hip hop engine — the "beat" counterpart to the ambient engine.
 *
 * Where buildEngine.ts grows a texture out of Euclidean grids, this one plays
 * a *tune*: a four-bar jazz progression, a bass following its roots, a Rhodes
 * comping on top, brushed boom-bap drums behind it, and a bed of vinyl noise
 * over the lot.
 *
 * Strudel does all the arranging. Every part is a mini-notation string — the
 * progression, the kick, the bass, the melody — queried a bar at a time and
 * scheduled straight onto the Tone transport at fractional cycle positions, so
 * swing, `ply` rolls and `off` echoes land where the pattern says rather than
 * being rounded onto a step grid. Tone.js is left doing what it is good at:
 * synthesis. No samples are used — everything is generated, as in the ambient
 * engine.
 */

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/* ============================================================
   HARMONY — chord names in, note names out
   ============================================================ */

const NOTE_SEMI: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const CHROMA = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Chord qualities, as semitone offsets from the root. Deliberately 7th- and
 *  9th-heavy: plain triads sound too bright and pop for this. */
const QUALITIES: Record<string, number[]> = {
  maj7: [0, 4, 7, 11],
  maj9: [0, 4, 7, 11, 14],
  m7: [0, 3, 7, 10],
  m9: [0, 3, 7, 10, 14],
  m11: [0, 3, 7, 10, 14, 17],
  "7": [0, 4, 7, 10],
  "9": [0, 4, 7, 10, 14],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
};

interface Chord {
  name: string;
  /** midi-ish semitone of the root, relative to C */
  root: number;
  /** semitone offsets from the root */
  offsets: number[];
}

/** Parse `dm9` / `cmaj7` / `a7` into a root and a set of offsets. */
function parseChord(name: string): Chord | null {
  const m = /^([a-g])([#b]?)(.*)$/.exec(name.trim().toLowerCase());
  if (!m) return null;
  const offsets = QUALITIES[m[3]];
  if (!offsets) return null;
  const accidental = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  return { name, root: NOTE_SEMI[m[1]] + accidental, offsets };
}

/** Semitone (relative to C0) → a note name Tone understands. */
const spell = (semi: number): string =>
  `${CHROMA[((semi % 12) + 12) % 12]}${Math.floor(semi / 12)}`;

/**
 * Voice a chord around the middle of the keyboard.
 *
 * Roots are dropped from anything richer than a 7th — the bass already has the
 * root, and doubling it is what makes generated jazz sound stiff — and the
 * remaining tones are stacked upward from the third so voicings stay inside
 * roughly an octave instead of spanning the whole keyboard.
 */
function voice(chord: Chord, octave: number): string[] {
  const tones = chord.offsets.length > 4 ? chord.offsets.slice(1) : chord.offsets;
  const base = chord.root + octave * 12;
  const out: number[] = [];
  let prev = -Infinity;
  for (const t of tones) {
    let n = base + t;
    while (n <= prev) n += 12; // keep the stack ascending
    prev = n;
    out.push(n);
  }
  return out.map(spell);
}

/** The nth chord tone, wrapping up an octave each time round. */
function chordTone(chord: Chord, index: number, octave: number): string {
  const n = chord.offsets.length;
  const wrapped = ((index % n) + n) % n;
  const octaveUp = Math.floor(index / n);
  return spell(chord.root + octave * 12 + chord.offsets[wrapped] + octaveUp * 12);
}

/* ============================================================
   THE SEED'S ARRANGEMENT — every part is mini-notation
   ============================================================ */

/** Four-bar progressions, one chord per bar. `<>` alternates per cycle. */
const PROGRESSIONS = [
  "<dm9 g7 cmaj9 cmaj9>", // ii–V–I, the standard
  "<am9 dm9 g7 cmaj9>", // vi–ii–V–I
  "<cmaj9 am9 fmaj9 g7>", // I–vi–IV–V, the doo-wop turn
  "<fmaj9 em7 am9 am9>", // IV–iii–vi, wistful
  "<em7 a7 dm9 g7>", // rolling secondary dominants
  "<cmaj9 c7 fmaj9 fm7>", // I–I7–IV–iv, the minor-plagal ache
  "<am9 fmaj9 cmaj9 g7>",
  "<dm9 dm9 g7 cmaj9>",
];

/** Kick patterns over eight eighth-notes. Boom-bap: downbeat plus a push. */
const KICKS = [
  "bd ~ ~ bd ~ ~ bd ~",
  "bd ~ ~ ~ ~ bd ~ ~",
  "bd ~ bd ~ ~ ~ bd ~",
  "bd ~ ~ bd ~ ~ ~ bd",
  "bd ~ ~ ~ bd ~ ~ ~",
];

/** Snare on 2 and 4 — the one thing that is never up for negotiation. */
const SNARES = ["~ ~ sd ~ ~ ~ sd ~", "~ ~ sd ~ ~ ~ sd [~ sd]", "~ ~ sd ~ ~ ~ sd ~"];

/** Hat grids. Swing and rolls are applied on top, per seed. */
const HATS = ["hh*8", "hh*8", "hh*16", "[hh hh ~ hh]*2"];

/** Bass figures. Numbers index chord tones — 0 is the root. */
const BASSES = ["0 ~ ~ 0 ~ ~ 0 ~", "0 ~ ~ ~ 2 ~ 0 ~", "0 ~ 0 ~ ~ 4 ~ ~", "0 ~ ~ 2 ~ ~ 4 ~"];

/** Melody figures, also chord-tone indices. Sparse on purpose. */
const MELODIES = [
  "~ ~ 4 ~ ~ 2 ~ ~",
  "~ 5 ~ ~ 3 ~ ~ ~",
  "~ ~ ~ 6 ~ ~ 4 2",
  "4 ~ ~ ~ ~ 5 ~ ~",
  "~ ~ 2 4 ~ ~ ~ 6",
];

/** Rhodes comping rhythm — where in the bar the chord is struck. */
const COMPS = ["0 ~ ~ ~ 0 ~ ~ ~", "0 ~ ~ 0 ~ ~ ~ ~", "~ 0 ~ ~ ~ 0 ~ ~", "0 ~ ~ ~ ~ ~ 0 ~"];

const pick = <T>(rnd: () => number, xs: T[]): T => xs[(rnd() * xs.length) | 0];

interface Arrangement {
  progression: string;
  bpm: number;
  swing: number;
  chord: Pattern;
  kick: Pattern;
  snare: Pattern;
  hat: Pattern;
  bass: Pattern;
  melody: Pattern;
  comp: Pattern;
  /** per-seed random stream for Strudel's own degrade/sometimes decisions */
  randSeed: number;
  name: string;
}

/**
 * Derive the whole arrangement from the seed. Uses its own PRNG stream
 * (`<seed>-lofi`) so it neither disturbs nor is disturbed by the ambient
 * engine's draws — the same seed can be played in either mode.
 */
function arrange(seed: string): Arrangement {
  const rnd = makeRng(`${seed}-lofi`);
  const progression = pick(rnd, PROGRESSIONS);
  const swing = 0.02 + rnd() * 0.05;
  const hatSrc = pick(rnd, HATS);
  // Swing the hats against the eighth-note grid, then let a few of them
  // stutter into double time — that flam is most of the "human drummer" feel.
  const hat = parseTrack(hatSrc)
    .swingBy(swing * 4, 8)
    .sometimesBy(0.12, (p) => p.ply(2));
  return {
    progression,
    bpm: Math.round(70 + rnd() * 20),
    swing,
    chord: parseTrack(progression),
    // the kick gets a ghost echo a 16th later on some seeds
    kick:
      rnd() < 0.4
        ? parseTrack(pick(rnd, KICKS)).off(0.0625, (p) => p)
        : parseTrack(pick(rnd, KICKS)),
    snare: parseTrack(pick(rnd, SNARES)),
    hat,
    bass: parseTrack(pick(rnd, BASSES)),
    melody: parseTrack(pick(rnd, MELODIES)),
    comp: parseTrack(pick(rnd, COMPS)),
    randSeed: (rnd() * 0x7fffffff) | 0,
    name: progression.replace(/[<>]/g, ""),
  };
}

/** The readouts a seed implies in lo-fi mode, without building the engine —
 *  mirrors previewSeed() in identity.ts so the idle panel stays live. */
export function previewLofi(seed: string): { key: string; bpm: number; character: string } {
  const a = arrange(seed);
  const first = renderEvents<string>(a.chord, 0)[0];
  return {
    key: first ? first.value : a.name.split(" ")[0],
    bpm: a.bpm,
    character: "rhodes · vinyl · boom bap",
  };
}

/* ============================================================
   THE ENGINE
   ============================================================ */

export async function buildLofiEngine(
  seed: string,
  getParams: () => Params,
  emit: (ev: EngineEvent) => void,
): Promise<EngineHandle> {
  await Tone.start();
  const a = arrange(seed);
  const nodes: Tone.ToneAudioNode[] = [];
  const keep = <T extends Tone.ToneAudioNode>(n: T): T => {
    nodes.push(n);
    return n;
  };

  /* --- master chain ---------------------------------------------------
     Order matters for the character: everything is glued by a slow
     compressor, rolled off up top, then crushed and wobbled, so the
     lo-fi damage lands on the *mix* rather than on each voice. */
  const limiter = keep(new Tone.Limiter(-1).toDestination());
  const master = keep(new Tone.Gain(0));
  master.connect(limiter);
  // slow, deep glue — the pumping is part of the genre
  const glue = keep(
    new Tone.Compressor({ threshold: -18, ratio: 3.5, attack: 0.02, release: 0.3 }),
  );
  glue.connect(master);
  const crusher = keep(new Tone.BitCrusher(7));
  crusher.wet.value = 0.2;
  crusher.connect(glue);
  // wow & flutter — the tape-warble that says "this was dubbed off something"
  const wobble = keep(new Tone.Vibrato({ frequency: 0.7, depth: 0.06, wet: 0.6 }));
  wobble.connect(crusher);
  const tone = keep(new Tone.Filter(3200, "lowpass"));
  tone.rolloff = -24;
  tone.connect(wobble);

  const reverb = keep(new Tone.Reverb({ decay: 2.6, preDelay: 0.012, wet: 0.24 }));
  await reverb.generate();
  reverb.connect(tone);
  const delay = keep(new Tone.FeedbackDelay({ delayTime: 0.3, feedback: 0.28, wet: 0.14 }));
  delay.connect(reverb);

  /** Musical voices go through the wet path; drums stay drier and closer. */
  const musicBus = keep(new Tone.Gain(1));
  musicBus.connect(delay);
  const drumBus = keep(new Tone.Gain(1));
  drumBus.connect(tone);
  const drumSend = keep(new Tone.Gain(0.18));
  drumBus.connect(drumSend);
  drumSend.connect(reverb);

  /* --- vinyl bed ------------------------------------------------------
     Two layers: continuous surface hiss, plus sporadic crackle pops
     scheduled per bar. Runs into the tone stage so it is filtered and
     crushed along with everything else. */
  const vinylGain = keep(new Tone.Gain(0));
  vinylGain.connect(tone);
  const hiss = keep(new Tone.Noise("pink"));
  const hissFilter = keep(new Tone.Filter(1800, "bandpass"));
  hissFilter.Q.value = 0.6;
  const hissGain = keep(new Tone.Gain(0.055));
  hiss.chain(hissFilter, hissGain, vinylGain);
  hiss.start();
  const crackle = keep(
    new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0 },
    }),
  );
  const crackleFilter = keep(new Tone.Filter(2600, "highpass"));
  crackle.chain(crackleFilter, vinylGain);

  /* --- drums ----------------------------------------------------------
     Soft, dusty and slightly detuned: a rounded kick, a snare that is
     mostly filtered noise with a little body, and a short closed hat. */
  const kickOut = keep(new Tone.Gain(1.1));
  kickOut.connect(drumBus);
  const kick = keep(
    new Tone.MembraneSynth({
      pitchDecay: 0.06,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.34, sustain: 0, release: 0.5 },
    }),
  );
  const kickFilter = keep(new Tone.Filter(220, "lowpass"));
  kick.chain(kickFilter, kickOut);

  const snareOut = keep(new Tone.Gain(0.5));
  snareOut.connect(drumBus);
  const snare = keep(
    new Tone.NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0 },
    }),
  );
  const snareFilter = keep(new Tone.Filter(1500, "bandpass"));
  snareFilter.Q.value = 0.9;
  snare.chain(snareFilter, snareOut);
  const snareBody = keep(
    new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.09, sustain: 0 },
    }),
  );
  const snareBodyGain = keep(new Tone.Gain(0.25));
  snareBody.chain(snareBodyGain, snareOut);

  const hatOut = keep(new Tone.Gain(0.16));
  hatOut.connect(drumBus);
  const hat = keep(
    new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.035, sustain: 0 },
    }),
  );
  const hatFilter = keep(new Tone.Filter(7000, "highpass"));
  hat.chain(hatFilter, hatOut);

  /* --- Rhodes ---------------------------------------------------------
     An FM pair with a bell-ish index and a slow tremolo is the cheapest
     convincing electric piano; the chorus widens it into the classic
     "warm keys" sound. */
  const keysOut = keep(new Tone.Gain(0.28));
  const chorus = keep(new Tone.Chorus({ frequency: 0.35, delayTime: 3.5, depth: 0.5, wet: 0.4 }));
  chorus.start();
  const tremolo = keep(new Tone.Tremolo({ frequency: 2.6, depth: 0.18 }));
  tremolo.start();
  keysOut.chain(chorus, tremolo, musicBus);
  const rhodes = keep(
    new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01,
      modulationIndex: 6.5,
      oscillator: { type: "sine" },
      envelope: { attack: 0.008, decay: 1.1, sustain: 0.12, release: 1.4 },
      modulation: { type: "sine" },
      modulationEnvelope: { attack: 0.004, decay: 0.4, sustain: 0, release: 0.4 },
    }),
  );
  rhodes.maxPolyphony = 12;
  rhodes.connect(keysOut);

  /* --- bass -----------------------------------------------------------
     Round triangle with a touch of glide, filtered well down. */
  const bassOut = keep(new Tone.Gain(0.5));
  bassOut.connect(musicBus);
  const bassFilter = keep(new Tone.Filter(420, "lowpass"));
  bassFilter.Q.value = 1.2;
  bassFilter.connect(bassOut);
  const bass = keep(
    new Tone.MonoSynth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.012, decay: 0.3, sustain: 0.5, release: 0.5 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4, baseFrequency: 120 },
      portamento: 0.02,
    }),
  );
  bass.connect(bassFilter);

  /* --- melody ---------------------------------------------------------
     A soft triangle bell over the top, one note at a time. */
  const leadOut = keep(new Tone.Gain(0.14));
  leadOut.connect(musicBus);
  const lead = keep(
    new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.006, decay: 0.5, sustain: 0.05, release: 0.9 },
    }),
  );
  lead.connect(leadOut);

  /* --- transport ------------------------------------------------------ */
  try {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = a.bpm;
    Tone.Transport.swing = 0;
  } catch {
    // ignore — a hostile transport shouldn't stop the graph being built
  }
  emit({ type: "bpm", value: a.bpm });
  emit({ type: "character", instrument: "rhodes", space: "vinyl", groove: "boom bap" });

  let cycle = 0;
  let currentChord: Chord | null = null;

  /* Monophonic Tone voices reject a trigger scheduled at or before their
     previous one ("start time must be strictly greater"), which throws mid-bar
     and would abandon the rest of it. Patterns can legitimately collide — an
     `off` echo landing on an existing onset, a `ply` roll, crackle pops at
     random offsets — so every trigger goes through this monotonic clock, which
     nudges a colliding time just past the last one for that voice. */
  const lastAt = new Map<string, number>();
  const slot = (voiceKey: string, t: number): number => {
    const prev = lastAt.get(voiceKey) ?? -Infinity;
    const next = t > prev + 0.0005 ? t : prev + 0.0015;
    lastAt.set(voiceKey, next);
    return next;
  };

  /** Schedule one bar. Every part is queried from its pattern at `cycle`. */
  const playBar = (time: number) => {
    const p = getParams();
    const bar = Tone.Time("1m").toSeconds();
    const at = (e: { at: number }) => time + e.at * bar;
    const rs = a.randSeed;

    // --- harmony: one chord for the bar, everything else keys off it
    const chordEv = renderEvents<string>(a.chord, cycle)[0];
    const chord = (chordEv && parseChord(chordEv.value)) || currentChord;
    if (!chord) return;
    if (chord.name !== currentChord?.name) {
      currentChord = chord;
      emit({ type: "key", name: chord.name });
    }

    // --- drums. Chaos thins them; pulse gates the section entirely.
    if (p.pulse > 0.03) {
      const thin = <T>(pat: Pattern, amount: number) =>
        renderEvents<T>(amount > 0 ? pat.degradeBy(amount).seed(rs) : pat, cycle);
      const vel = 0.5 + p.pulse * 0.45;

      for (const e of thin(a.kick, p.chaos * 0.15)) {
        kick.triggerAttackRelease(spell(chord.root + 12), 0.4, slot("kick", at(e)), vel * 0.9);
        emit({ type: "hit", track: "boom" });
      }
      for (const e of thin(a.snare, p.chaos * 0.1)) {
        const t = slot("snare", at(e));
        snare.triggerAttackRelease(0.18, t, vel * 0.8);
        snareBody.triggerAttackRelease(190, 0.08, slot("snareBody", t), vel * 0.5);
        emit({ type: "hit", track: "rim" });
      }
      // hats carry most of the density fader — they are what makes it busy
      for (const e of thin(a.hat, 0.45 - p.density * 0.4 + p.chaos * 0.1)) {
        hat.triggerAttackRelease(0.04, slot("hat", at(e)), (0.3 + p.density * 0.4) * vel);
        emit({ type: "hit", track: "shaker" });
      }
    }

    // --- bass: chord tones, an octave and a half below the keys
    for (const e of renderEvents<number>(a.bass, cycle)) {
      const note = chordTone(chord, e.value, 2);
      const t = slot("bass", at(e));
      bass.triggerAttackRelease(note, Math.max(0.12, e.dur * bar * 0.9), t, 0.6 + p.sub * 0.3);
      emit({ type: "note", voice: 0, note });
    }

    // --- Rhodes comping
    for (const e of renderEvents(a.comp, cycle)) {
      const notes = voice(chord, 4);
      rhodes.triggerAttackRelease(notes, bar * 0.62, slot("rhodes", at(e)), 0.42);
      emit({ type: "hit", track: "pluck" });
      emit({ type: "note", voice: 1, note: notes[0] });
    }

    // --- melody: density opens it up, chaos frays it
    const melodyDrop = clamp(0.75 - p.density * 0.7 + p.chaos * 0.2, 0, 0.95);
    for (const e of renderEvents<number>(a.melody.degradeBy(melodyDrop).seed(rs), cycle)) {
      const note = chordTone(chord, e.value, 5);
      lead.triggerAttackRelease(note, 0.4, slot("lead", at(e)), 0.5);
      emit({ type: "note", voice: 2, note });
      emit({ type: "hit", track: "ping" });
    }

    // --- vinyl crackle: a handful of pops per bar, scaled by grain.
    // Offsets are sorted before scheduling — one NoiseSynth can only be
    // triggered in ascending time order.
    const pops = Math.round(p.grain * 14);
    const offsets = Array.from({ length: pops }, () => Math.random() * bar).toSorted(
      (x, y) => x - y,
    );
    for (const o of offsets) {
      crackle.triggerAttackRelease(0.01, slot("crackle", time + o), 0.15 + Math.random() * 0.5);
    }
    if (cycle % 4 === 0) emit({ type: "pattern" });
  };

  let loopId: number | null = null;
  try {
    loopId = Tone.Transport.scheduleRepeat((time) => {
      try {
        playBar(time);
      } catch {
        // a bad bar shouldn't stop the transport
      } finally {
        // advance in `finally`: if a voice throws mid-bar the arrangement must
        // still move on, or the progression sticks on its first chord forever
        cycle++;
      }
    }, "1m");
    Tone.Transport.start("+0.1");
  } catch {
    // ignore
  }

  /* --- recorder --- */
  let recorder: Tone.Recorder | null = null;
  try {
    recorder = new Tone.Recorder();
    limiter.connect(recorder);
  } catch {
    recorder = null;
  }

  /* --- params ---------------------------------------------------------
     The eight faders keep their names but mean lo-fi things here: `lofi`
     drives crush + wow depth, `grain` the vinyl bed, `space` the room. */
  function apply(p: Params) {
    tone.frequency.rampTo(900 + Math.pow(p.brightness, 1.5) * 6500, 0.4);
    reverb.wet.rampTo(clamp(0.08 + p.space * 0.4, 0.05, 0.6), 0.5);
    delay.wet.rampTo(0.05 + p.space * 0.25, 0.5);
    delay.feedback.rampTo(0.15 + p.space * 0.3, 0.5);
    vinylGain.gain.rampTo(p.grain * 1.2, 0.5);
    bassOut.gain.rampTo(0.2 + p.sub * 0.55, 0.4);
    drumBus.gain.rampTo(0.25 + Math.pow(p.pulse, 1.1) * 1.0, 0.4);
    keysOut.gain.rampTo(0.16 + (1 - p.grain * 0.3) * 0.2, 0.4);
    leadOut.gain.rampTo(p.shimmer ? 0.22 : 0.12, 0.4);
    crusher.wet.value = clamp(0.1 + p.lofi * 0.6, 0, 0.85);
    crusher.bits.value = Math.round(8 - p.lofi * 4);
    wobble.depth.value = clamp(0.02 + p.lofi * 0.14, 0, 0.2);
    wobble.frequency.value = 0.4 + p.lofi * 1.4;
  }
  apply(getParams());
  // Short fade-in only — just enough to avoid a click on the first sample.
  // The ambient engine can afford a long 2.5s swell because its texture is
  // continuous, but a beat that fades in over a bar reads as "the first bar is
  // missing": bar 0 lands inside the ramp and is swallowed. Target sits below
  // unity so the limiter shapes transients instead of catching them flat.
  master.gain.rampTo(0.82, 0.25);

  function dispose(fade = 1.4) {
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
        try {
          hiss.stop();
        } catch {
          // ignore
        }
        nodes.forEach((n) => n.dispose());
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
