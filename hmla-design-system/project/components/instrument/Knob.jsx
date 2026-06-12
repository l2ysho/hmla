import React from "react";

/**
 * hmla Knob — rotary control. Drag up/down (or arrow keys) to change value.
 * Sweeps from -135° to +135°. Controlled (`value`+`onChange`) or uncontrolled.
 */
export function Knob({
  label,
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  size = "md",
  unit = "",
  format,
  onChange,
  className = "",
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const val = isControlled ? value : internal;
  const drag = React.useRef(null);

  const pct = (val - min) / (max - min);
  const angle = -135 + pct * 270;

  function commit(next) {
    const clamped = Math.min(max, Math.max(min, Math.round(next / step) * step));
    if (!isControlled) setInternal(clamped);
    onChange && onChange(clamped);
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, v: val };
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    const dy = drag.current.y - e.clientY;            // up = increase
    const range = max - min;
    commit(drag.current.v + (dy / 160) * range);       // full sweep ≈ 160px
  }
  function onPointerUp(e) {
    drag.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  function onKeyDown(e) {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); commit(val + step); }
    if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); commit(val - step); }
  }

  const dialSize = size === "sm" ? "var(--knob-sm)" : size === "lg" ? "var(--knob-lg)" : "var(--knob-md)";
  const shown = format ? format(val) : `${val}${unit}`;

  return (
    <div className={`hmla-knob ${className}`.trim()}>
      <div
        className="hmla-knob__dial"
        style={{ width: dialSize, height: dialSize }}
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
        <span className="hmla-knob__pointer" style={{ transform: `translate(-50%,0) rotate(${angle}deg)` }} />
      </div>
      {label ? <span className="hmla-knob__label">{label}</span> : null}
      <span className="hmla-knob__value hmla-tnum">{shown}</span>
    </div>
  );
}
