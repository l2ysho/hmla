import { useEffect, useRef, useState } from "react";
import { Badge } from "./components/ds/Badge";
import { Button } from "./components/ds/Button";
import { Fader } from "./components/ds/Fader";
import { IconButton } from "./components/ds/IconButton";
import { Input } from "./components/ds/Input";
import { LED } from "./components/ds/LED";
import { Panel } from "./components/ds/Panel";
import { Switch } from "./components/ds/Switch";
import { Tag } from "./components/ds/Tag";
import { Transport } from "./components/ds/Transport";
import { SignalMark } from "./components/SignalMark";
import { buildEngine } from "./engine/buildEngine";
import { PRESETS, VOICE_COLORS } from "./engine/constants";
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

function loadPatch(): StoredPatch {
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
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

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
  const setSeed = (next: string) => setPatch((s) => ({ ...s, seed: next }));
  const reseed = () => setSeed(`hmla-${Math.floor(1000 + Math.random() * 9000)}`);
  const toggleTheme = () =>
    setPatch((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }));

  return (
    <div className="app hmla-grain">
      <header className="app__head">
        <div>
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

      <Panel tone="well" className="vizpanel">
        <canvas ref={canvasRef} className="scope" />
      </Panel>

      <div className="statusrow">
        <div className="statusrow__tags">
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
          title={canRecord ? "record output as WAV" : "recording is unavailable in this browser"}
        >
          <span className="recbtn__dot" />
          <span className="hmla-tnum">{recording ? fmt(recSecs) : "rec"}</span>
        </IconButton>
      </div>

      <Panel
        title="engine"
        actions={
          <Badge tone="accent" dot>
            live
          </Badge>
        }
      >
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
      </Panel>

      <div className="footrow">
        <div className="presets">
          {Object.keys(PRESETS).map((name) => (
            <Tag
              key={name}
              className="preset"
              data-active={activePreset === name ? "true" : "false"}
              role="button"
              tabIndex={0}
              onClick={() => applyPreset(name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  applyPreset(name);
                }
              }}
            >
              {name}
            </Tag>
          ))}
          <Switch
            className="shimmer-toggle"
            checked={params.shimmer}
            onChange={(v) => setParam("shimmer", v)}
            label="shimmer"
          />
        </div>
        <div className="seedbox">
          <span className="hmla-field__label">seed</span>
          <Input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            disabled={playing}
            spellCheck={false}
            className="seedbox__input hmla-tnum"
          />
          <IconButton aria-label="regenerate seed" onClick={reseed} disabled={playing}>
            ↻
          </IconButton>
        </div>
      </div>

      <div className="transportbar">
        <Transport playing={playing} onPlayToggle={toggle} onStop={stop} showSkip={false}>
          <span className="hmla-tnum tport-time">{fmt(elapsed)}</span>
          <span className="tport-seed hmla-tnum">{seed}</span>
        </Transport>
        <p className="hint">
          {playing
            ? "patch running — pulse at zero stays pure ambient, higher values bring in the rhythm"
            : "same seed + same settings = same patch, every time"}
        </p>
      </div>
    </div>
  );
}
