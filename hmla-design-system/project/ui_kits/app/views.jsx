/* hmla app — Mixer & Library views. Attached to window for the App shell. */
const { Knob, Fader, Meter, LED, Visualizer, Badge, Tag, Button, IconButton } = window.HmlaDesignSystem_a7a64d;

/* ----- Mixer ----- */
function MixerView({ playing }) {
  const [chans, setChans] = React.useState(window.HMLA_DATA.channels.map(c => ({ ...c, mute: false, solo: false })));
  function set(id, patch) { setChans(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c)); }
  return (
    <div className="rack" style={{ gridTemplateColumns: `repeat(${chans.length + 1}, minmax(92px, 1fr))` }}>
      {chans.map(c => (
        <div className="strip" key={c.id}>
          <span className="strip__name">{c.name}</span>
          <Knob size="sm" label="pan" min={-50} max={50} defaultValue={0} format={v => v === 0 ? "C" : (v < 0 ? `L${-v|0}` : `R${v|0}`)} />
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <Fader label="" value={c.mute ? 0 : c.level} onChange={v => set(c.id, { level: v })} />
            <Meter orient="v" value={(c.mute ? 0 : c.level) / 100 * (playing ? 1 : 0.001)} style={{ height: 150 }} />
          </div>
          <div className="strip__btns">
            <button className="strip__btn" data-kind="m" data-on={c.mute} onClick={() => set(c.id, { mute: !c.mute })}>M</button>
            <button className="strip__btn" data-kind="s" data-on={c.solo} onClick={() => set(c.id, { solo: !c.solo })}>S</button>
          </div>
        </div>
      ))}
      <div className="strip" style={{ borderColor: "var(--accent)", boxShadow: "var(--glow-accent)" }}>
        <span className="strip__name" style={{ color: "var(--accent)" }}>master</span>
        <LED tone="accent" />
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <Fader label="" defaultValue={82} />
          <Meter orient="v" value={playing ? 0.78 : 0.001} style={{ height: 150 }} />
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-hi)" }}>−6.0 dB</span>
      </div>
    </div>
  );
}

/* ----- Library ----- */
function LibraryView({ playing, currentId, onPlay }) {
  return (
    <div className="libgrid">
      {window.HMLA_DATA.presets.map(p => {
        const active = p.id === currentId;
        return (
          <div className="sound" key={p.id} data-active={active} onClick={() => onPlay(p.id)}>
            <div className="sound__viz"><Visualizer mode={p.mode} running={active && playing} height={56} bars={28} /></div>
            <div className="sound__row">
              <span className="sound__name">{p.name}</span>
              {active ? <Badge tone="accent" dot>live</Badge> : <span className="sound__meta">{p.len}</span>}
            </div>
            <div className="sound__tags">
              {p.tags.map(t => <Tag key={t}>{t}</Tag>)}
            </div>
            <div className="sound__row">
              <span className="sound__meta">seed {p.seed}</span>
              <span className="sound__meta">{p.len}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.MixerView = MixerView;
window.LibraryView = LibraryView;
