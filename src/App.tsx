import { useEffect, useRef, useState } from "react";
import { Badge } from "./components/ds/Badge";
import { Button } from "./components/ds/Button";
import { Fader } from "./components/ds/Fader";
import { IconButton } from "./components/ds/IconButton";
import { Input } from "./components/ds/Input";
import { LED } from "./components/ds/LED";
import { Switch } from "./components/ds/Switch";
import { Tag } from "./components/ds/Tag";
import { Transport } from "./components/ds/Transport";
import { SignalMark } from "./components/SignalMark";
import { buildEngine } from "./engine/buildEngine";
import { PRESETS, VOICE_COLORS } from "./engine/constants";
import { makeRng } from "./engine/prng";
import { decodeEngine, encodeEngine } from "./engine/share";
import { useVisual } from "./engine/useVisual";
import type { EngineEvent, EngineHandle, Params } from "./types";

const DEFAULT_PARAMS: Params = {
  density: 0.5,
  brightness: 0.55,
  space: 0.6,
  chaos: 0.35,
  grain: 0.55,
  pulse: 0.35,
  sub: 0.5,
  lofi: 0.1,
  shimmer: false,
};

const CHANNELS: { key: Exclude<keyof Params, "shimmer">; label: string; tone: string }[] = [
  { key: "density", label: "density", tone: "cyan" },
  { key: "brightness", label: "bright", tone: "amber" },
  { key: "space", label: "space", tone: "blue" },
  { key: "chaos", label: "chaos", tone: "red" },
  { key: "grain", label: "grain", tone: "green" },
  { key: "sub", label: "sub", tone: "var(--ch-sub)" },
  { key: "pulse", label: "pulse", tone: "accent" },
  { key: "lofi", label: "lofi", tone: "var(--ch-lofi)" },
];

const STORAGE_KEY = "hmla.patch.v1";

interface StoredPatch {
  params: Params;
  seed: string;
  theme: "dark" | "light";
}

// Each seed deterministically maps to one of the presets via an independent
// PRNG stream, so a given seed always implies the same starting mix.
const PRESET_NAMES = Object.keys(PRESETS);
function presetForSeed(seed: string): string {
  return PRESET_NAMES[Math.floor(makeRng(`${seed}-preset`)() * PRESET_NAMES.length)];
}
// the full param set a seed implies (its preset, over the defaults)
function paramsForSeed(seed: string): Params {
  return { ...DEFAULT_PARAMS, ...PRESETS[presetForSeed(seed)] };
}
// name of the preset whose values exactly match these params, else null
function matchPreset(p: Params): string | null {
  for (const [name, preset] of Object.entries(PRESETS)) {
    const ok = (Object.keys(preset) as (keyof Params)[]).every((k) =>
      typeof preset[k] === "number" && typeof p[k] === "number"
        ? Math.round((preset[k] as number) * 100) === Math.round((p[k] as number) * 100)
        : preset[k] === p[k],
    );
    if (ok) return name;
  }
  return null;
}

function readStored(): StoredPatch {
  const fallback: StoredPatch = {
    params: DEFAULT_PARAMS,
    seed: `hmla-${Math.floor(1000 + Math.random() * 9000)}`,
    theme: "dark",
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredPatch>;
    return {
      params: { ...DEFAULT_PARAMS, ...parsed.params },
      seed: parsed.seed ?? fallback.seed,
      theme: parsed.theme ?? fallback.theme,
    };
  } catch {
    return fallback;
  }
}

// Share/restore order: URL wins, then localStorage, then defaults.
//   ?e present → exact shared mix; ?s only → that seed's preset.
function loadPatch(): StoredPatch {
  const stored = readStored();
  const q = new URLSearchParams(window.location.search);
  const urlSeed = q.get("s");
  const urlEng = q.get("e");
  const seed = urlSeed ?? stored.seed;
  const params = urlEng
    ? (decodeEngine(urlEng) ?? stored.params)
    : urlSeed
      ? paramsForSeed(urlSeed)
      : stored.params;
  return { params, seed, theme: stored.theme };
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function App() {
  const [{ params, seed, theme }, setPatch] = useState(loadPatch);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("—");
  const [bpm, setBpm] = useState<number | null>(null);
  const [lastNotes, setLastNotes] = useState(["—", "—", "—"]);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [canRecord, setCanRecord] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(() => matchPreset(params));
  const [elapsed, setElapsed] = useState(0);
  const [character, setCharacter] = useState<string | null>(null);

  const paramsRef = useRef(params);
  paramsRef.current = params;
  const engineRef = useRef<EngineHandle | null>(null);
  const eventsRef = useRef<EngineEvent[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useVisual(canvasRef, playing, eventsRef, theme);

  useEffect(() => {
    engineRef.current?.apply(params);
  }, [params]);

  useEffect(() => () => engineRef.current?.dispose(), []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ params, seed, theme }));
  }, [params, seed, theme]);

  // keep the address bar a live, shareable link to the current patch. drop ?e
  // while the mix still equals what the seed implies — it's only needed once
  // the user actually edits a fader away from the seed's preset.
  // debounced: fast fader drags fire dozens of param changes/sec, and Chrome
  // throttles history.replaceState to ~100 calls per 10s (throws past that,
  // crashing the app with no error boundary).
  useEffect(() => {
    const t = setTimeout(() => {
      const q = new URLSearchParams({ s: seed });
      const e = encodeEngine(params);
      if (e !== encodeEngine(paramsForSeed(seed))) q.set("e", e);
      window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
    }, 300);
    return () => clearTimeout(t);
  }, [params, seed]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setRecSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (!playing) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [playing]);

  const play = async () => {
    if (busy || playing) return;
    setBusy(true);
    setErr(null);
    try {
      // small guard so a rapid stop->play doesn't overlap with the prior
      // engine's audio nodes still tearing down
      await new Promise((r) => setTimeout(r, 150));
      engineRef.current = await buildEngine(
        seed,
        () => paramsRef.current,
        (ev) => {
          eventsRef.current.push(ev);
          if (ev.type === "note") {
            setLastNotes((prev) => {
              const next = [...prev];
              next[ev.voice] = ev.note;
              return next;
            });
          } else if (ev.type === "key") {
            setKeyName(ev.name);
          } else if (ev.type === "bpm") {
            setBpm(ev.value);
          } else if (ev.type === "character") {
            setCharacter(`${ev.instrument} · ${ev.space} · ${ev.groove}`);
          }
        },
      );
      setCanRecord(engineRef.current.canRecord);
      setPlaying(true);
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
      engineRef.current = null;
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (busy || !playing) return;
    if (recording) await stopRec();
    engineRef.current?.dispose();
    engineRef.current = null;
    setPlaying(false);
  };

  const toggle = () => (playing ? stop() : play());

  const startRec = () => {
    engineRef.current?.startRec();
    setRecSecs(0);
    setRecording(true);
  };
  const stopRec = async () => {
    setRecording(false);
    const result = await engineRef.current?.stopRec();
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hmla-${seed}-${Date.now()}.${result.ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const setParam = <K extends keyof Params>(key: K, value: Params[K]) => {
    setActivePreset(null);
    setPatch((s) => ({ ...s, params: { ...s.params, [key]: value } }));
  };
  const applyPreset = (name: string) => {
    setActivePreset(name);
    setPatch((s) => ({ ...s, params: { ...s.params, ...PRESETS[name] } }));
  };
  const setSeed = (next: string) => {
    setCharacter(null); // character is only known once the engine for this seed builds
    setPatch((s) => ({ ...s, seed: next }));
  };
  // commit a seed and snap the mix to the preset that seed maps to (used by
  // reseed + the seed field's blur/Enter — not per keystroke, so faders don't
  // thrash while typing)
  const commitSeed = (next: string) => {
    const name = presetForSeed(next);
    setActivePreset(name);
    setCharacter(null);
    setPatch((s) => ({ ...s, seed: next, params: { ...s.params, ...PRESETS[name] } }));
  };
  const reseed = () => commitSeed(`hmla-${Math.floor(1000 + Math.random() * 9000)}`);
  const toggleTheme = () =>
    setPatch((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }));

  return (
    <div className="stage">
      <div className="chassis hmla-grain">
        <span className="chassis__screw chassis__screw--tl" aria-hidden="true" />
        <span className="chassis__screw chassis__screw--tr" aria-hidden="true" />
        <span className="chassis__screw chassis__screw--bl" aria-hidden="true" />
        <span className="chassis__screw chassis__screw--br" aria-hidden="true" />

        <header className="chassis__head">
          <div className="brand">
            <div className="lockup">
              <h1 className="wordmark">hmla</h1>
              <SignalMark className="signalmark" />
            </div>
            <p className="tagline">generative ambient — seeded, ever-evolving</p>
          </div>
          <div className="head-tools">
            <Badge tone={playing ? "accent" : "default"} dot>
              {playing ? "live" : "idle"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === "dark" ? "light" : "dark"}
            </Button>
          </div>
        </header>

        {err ? (
          <p className="error">
            <span className="error__label">signal error</span> {err}
          </p>
        ) : null}

        <div className="controlbar">
          <Transport playing={playing} onPlayToggle={toggle} onStop={stop} showSkip={false}>
            <span className="hmla-tnum tport-time">{fmt(elapsed)}</span>
            <span className="tport-seed hmla-tnum">{seed}</span>
          </Transport>
        </div>

        <div className="screen">
          <div className="screen__display">
            <canvas ref={canvasRef} className="scope" />
            <span className="screen__char">{character ?? "—"}</span>
          </div>
          <div className="screen__strip">
            <div className="screen__tags">
              <Tag>
                <LED tone="cyan" on={playing} size={8} /> {keyName}
              </Tag>
              <Tag>
                <LED tone="accent" on={playing && params.pulse > 0.03} size={8} />{" "}
                {bpm ? `${bpm} bpm` : "—"}
              </Tag>
              <span className="sep" />
              {lastNotes.map((n, i) => (
                <Tag key={i} className="voicenote">
                  <LED tone={VOICE_COLORS[i]} on={playing} size={8} /> {n}
                </Tag>
              ))}
            </div>
            <IconButton
              aria-label="record"
              className="recbtn"
              active={recording}
              onClick={recording ? stopRec : startRec}
              disabled={!playing || !canRecord}
              title={
                canRecord ? "record output as WAV" : "recording is unavailable in this browser"
              }
            >
              <span className="recbtn__dot" />
              <span className="hmla-tnum">{recording ? fmt(recSecs) : "rec"}</span>
            </IconButton>
          </div>
        </div>

        <section className="module">
          <div className="module__head">
            <span className="hmla-label">engine</span>
          </div>
          <div className="rack">
            {CHANNELS.map((c) => (
              <div className="ch" key={c.key}>
                <LED tone={c.tone} on={playing} size={9} />
                <Fader
                  label={c.label}
                  min={0}
                  max={1}
                  step={0.01}
                  value={params[c.key]}
                  onChange={(v) => setParam(c.key, v)}
                />
                <span className="ch__val hmla-tnum">{Math.round(params[c.key] * 100)}</span>
              </div>
            ))}
          </div>
          <div className="module__aux">
            <Switch
              checked={params.shimmer}
              onChange={(v) => setParam("shimmer", v)}
              label="shimmer"
              title="octave-up reverb halo — adds a bright, airy tail above the drone"
            />
            <span className="aux__hint">octave-up reverb halo</span>
          </div>
        </section>

        <section className="module module--row">
          <div className="presets">
            <span className="hmla-label presets__label">preset</span>
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                type="button"
                className="preset"
                data-active={activePreset === name ? "true" : "false"}
                onClick={() => applyPreset(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="seedbox">
            <span className="hmla-field__label">seed</span>
            <Input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              onBlur={(e) => commitSeed(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              disabled={playing}
              spellCheck={false}
              maxLength={9}
              className="seedbox__input hmla-tnum"
            />
            <IconButton aria-label="regenerate seed" onClick={reseed} disabled={playing}>
              ↻
            </IconButton>
          </div>
        </section>

        <p className="hint">
          {playing
            ? "patch running — pulse at zero stays pure ambient, higher values bring in the rhythm"
            : "same seed + same settings = same patch, every time"}
        </p>
      </div>
    </div>
  );
}
