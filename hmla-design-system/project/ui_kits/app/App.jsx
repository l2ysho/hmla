/* hmla app — shell + Engine view. Mounts the interactive studio. */
const { Knob, Visualizer, Transport, Tabs, Button, IconButton, Badge, LED, Meter, Switch, Input } = window.HmlaDesignSystem_a7a64d;

const MARK = (
  <svg viewBox="0 0 120 64" fill="none">
    <path d="M60 32 C60 14, 86 14, 86 32 C86 50, 60 50, 60 32 C60 14, 34 14, 34 32 C34 50, 60 50, 60 32 Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="60" cy="32" r="3.4" fill="currentColor" />
  </svg>
);
const I = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const ICO = {
  sun: I(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></>),
  moon: I(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />),
  refresh: I(<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>),
  dice: I(<><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" /><circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" /></>),
  download: I(<><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M4 21h16" /></>),
};

const PRESETS = window.HMLA_DATA.presets;

function rngSeed() { return "0x" + Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0"); }

function EngineView({ playing, preset, seed, onReseed, frozen, setFrozen }) {
  return (
    <React.Fragment>
      <div className="viz-hero">
        <Visualizer mode={preset.mode} running={playing} height={188} bars={64} />
        <div className="viz-hero__meta">
          <Badge tone={playing ? "accent" : "default"} dot>{playing ? "live" : "idle"}</Badge>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-muted)" }}>seed {seed}</span>
          <IconButton aria-label="regenerate seed" onClick={onReseed}>{ICO.refresh}</IconButton>
          <IconButton aria-label="randomize" onClick={onReseed}>{ICO.dice}</IconButton>
          <div style={{ flex: 1 }} />
          <Switch label="freeze ∞" checked={frozen} onChange={setFrozen} />
        </div>
      </div>

      <div className="hmla-panel">
        <div className="hmla-panel__head">
          <span className="hmla-panel__title">generative engine</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)" }}>{preset.name}</span>
        </div>
        <div className="rack">
          <Knob label="density" min={0} max={1} step={0.01} defaultValue={0.62} format={v => v.toFixed(2)} />
          <Knob label="character" min={0} max={100} defaultValue={48} format={v => `${v | 0}`} />
          <Knob label="space" min={0} max={100} defaultValue={66} format={v => `${v | 0}%`} />
          <Knob label="drift" min={0} max={100} defaultValue={22} format={v => `${v | 0}`} />
          <Knob label="lowpass" min={20} max={20000} step={10} defaultValue={8200} format={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`} />
          <Knob label="output" min={-60} max={6} defaultValue={-6} format={v => `${v.toFixed(1)}`} />
        </div>
      </div>
    </React.Fragment>
  );
}

function App() {
  const [theme, setTheme] = React.useState("dark");
  const [view, setView] = React.useState("engine");
  const [playing, setPlaying] = React.useState(true);
  const [currentId, setCurrentId] = React.useState("deep");
  const [seed, setSeed] = React.useState("0x4F2A");
  const [frozen, setFrozen] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(184);

  React.useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [playing]);

  const preset = PRESETS.find(p => p.id === currentId) || PRESETS[0];
  const MixerView = window.MixerView, LibraryView = window.LibraryView;

  function play(id) { setCurrentId(id); setPlaying(true); setSeed(PRESETS.find(p => p.id === id).seed); }
  function fmt(s) { const m = (s / 60) | 0, ss = s % 60; return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`; }

  return (
    <div className="app">
      {/* top bar */}
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">{MARK}</span>
          <span className="brand__word">hmla</span>
        </div>
        <div style={{ marginLeft: 8 }}>
          <Tabs items={[{ id: "engine", label: "engine" }, { id: "mixer", label: "mixer" }, { id: "library", label: "library" }]} value={view} onChange={setView} />
        </div>
        <div className="topbar__spacer" />
        <span className="topbar__readout"><LED tone="blue" /> sync · 120.00 bpm</span>
        <span className="topbar__readout">48k / 24-bit</span>
        <IconButton aria-label="export" >{ICO.download}</IconButton>
        <IconButton aria-label="toggle theme" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>{theme === "dark" ? ICO.sun : ICO.moon}</IconButton>
      </header>

      {/* stage */}
      <div className="stage">
        <aside className="rail">
          <div className="rail__section">
            <Input label="search" placeholder="filter presets…" />
          </div>
          <div className="rail__section" style={{ gridRow: "span 2", gridTemplateRows: "auto 1fr" }}>
            <div className="rail__title">
              <span className="hmla-label">library</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>{PRESETS.length}</span>
            </div>
            <div className="rail__list">
              {PRESETS.map((p, i) => (
                <button className="preset" key={p.id} data-active={p.id === currentId} onClick={() => play(p.id)}>
                  <span className="preset__idx">{String(i + 1).padStart(2, "0")}</span>
                  <span className="preset__name">{p.name}</span>
                  <span className="preset__len">{p.len}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="content">
          <div className="content__head">
            <div className="content__title">
              <h1>{view === "engine" ? preset.name : view === "mixer" ? "mixer" : "sound library"}</h1>
              <span className="sub">{view === "engine" ? `generative · ${frozen ? "frozen" : "evolving"} · seed ${seed}` : view === "mixer" ? "5 channels → master bus" : "load a field or start from silence"}</span>
            </div>
            <Button variant="accent" icon={ICO.download}>render</Button>
          </div>
          {view === "engine" && <EngineView playing={playing} preset={preset} seed={seed} frozen={frozen} setFrozen={setFrozen} onReseed={() => setSeed(rngSeed())} />}
          {view === "mixer" && <MixerView playing={playing} />}
          {view === "library" && <LibraryView playing={playing} currentId={currentId} onPlay={play} />}
        </main>
      </div>

      {/* transport */}
      <footer className="transportbar">
        <div className="tb__now">
          <div className="tb__art"><Visualizer mode="bars" running={playing} height={40} bars={14} /></div>
          <div className="tb__meta">
            <b>{preset.name}</b>
            <span>seed {seed} · {frozen ? "frozen" : "live"}</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", flex: 1 }}>
          <Transport playing={playing} onPlayToggle={() => setPlaying(p => !p)} onStop={() => { setPlaying(false); setElapsed(0); }} onPrev={() => play(PRESETS[(PRESETS.findIndex(p => p.id === currentId) + PRESETS.length - 1) % PRESETS.length].id)} onNext={() => play(PRESETS[(PRESETS.findIndex(p => p.id === currentId) + 1) % PRESETS.length].id)}>
            <span className="tb__time">{fmt(elapsed)} / {preset.len}</span>
          </Transport>
        </div>
        <div className="tb__master">
          <span className="hmla-label">master</span>
          <Meter value={playing ? 0.72 : 0.001} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-hi)" }}>−6.0</span>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
