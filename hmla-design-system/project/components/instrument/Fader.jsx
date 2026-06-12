import React from "react";

/**
 * hmla Fader — vertical channel fader. Drag the cap (or arrow keys) to set
 * level. Controlled (`value`+`onChange`) or uncontrolled (`defaultValue`).
 */
export function Fader({
  label,
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className = "",
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const val = isControlled ? value : internal;
  const trackRef = React.useRef(null);
  const dragging = React.useRef(false);

  const pct = (val - min) / (max - min);

  function commit(next) {
    const clamped = Math.min(max, Math.max(min, Math.round(next / step) * step));
    if (!isControlled) setInternal(clamped);
    onChange && onChange(clamped);
  }
  function fromClientY(clientY) {
    const r = trackRef.current.getBoundingClientRect();
    const pad = 10;
    const t = 1 - (clientY - (r.top + pad)) / (r.height - pad * 2);
    return min + Math.min(1, Math.max(0, t)) * (max - min);
  }
  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    commit(fromClientY(e.clientY));
  }
  function onPointerMove(e) { if (dragging.current) commit(fromClientY(e.clientY)); }
  function onPointerUp(e) { dragging.current = false; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {} }
  function onKeyDown(e) {
    if (e.key === "ArrowUp") { e.preventDefault(); commit(val + step); }
    if (e.key === "ArrowDown") { e.preventDefault(); commit(val - step); }
  }

  return (
    <div className={`hmla-fader ${className}`.trim()}>
      <div
        ref={trackRef}
        className="hmla-fader__track"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={val}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <span className="hmla-fader__slot" />
        <span className="hmla-fader__fill" style={{ height: `calc((100% - 20px) * ${pct})` }} />
        <span className="hmla-fader__cap" style={{ bottom: `calc(10px + (100% - 20px) * ${pct})` }} />
      </div>
      {label ? <span className="hmla-fader__label">{label}</span> : null}
    </div>
  );
}
