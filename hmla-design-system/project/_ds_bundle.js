/* @ds-bundle: {"format":3,"namespace":"HmlaDesignSystem_a7a64d","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Select","sourcePath":"components/core/Select.jsx"},{"name":"Switch","sourcePath":"components/core/Switch.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Fader","sourcePath":"components/instrument/Fader.jsx"},{"name":"Knob","sourcePath":"components/instrument/Knob.jsx"},{"name":"LED","sourcePath":"components/instrument/LED.jsx"},{"name":"Meter","sourcePath":"components/instrument/Meter.jsx"},{"name":"Transport","sourcePath":"components/instrument/Transport.jsx"},{"name":"Visualizer","sourcePath":"components/instrument/Visualizer.jsx"},{"name":"Panel","sourcePath":"components/layout/Panel.jsx"},{"name":"Tabs","sourcePath":"components/layout/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"4c0c6545f424","components/core/Button.jsx":"439514fc1882","components/core/IconButton.jsx":"0864b2582df9","components/core/Input.jsx":"0aef3eae6e73","components/core/Select.jsx":"84cd03598a14","components/core/Switch.jsx":"ad626b39d63b","components/core/Tag.jsx":"60249cfa8b5d","components/instrument/Fader.jsx":"f302e09d938d","components/instrument/Knob.jsx":"b5aa8a4f8c83","components/instrument/LED.jsx":"5f94a25ca685","components/instrument/Meter.jsx":"d33bcdf32326","components/instrument/Transport.jsx":"044c64c68c3e","components/instrument/Visualizer.jsx":"b3ed25355006","components/layout/Panel.jsx":"a81ea2ec53d0","components/layout/Tabs.jsx":"1acac1dde8a0","ui_kits/app/App.jsx":"4f4204a5f109","ui_kits/app/data.js":"c5a054841c96","ui_kits/app/views.jsx":"ac9601275442"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HmlaDesignSystem_a7a64d = window.HmlaDesignSystem_a7a64d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla Badge — small status chip. `tone` maps to the signal palette.
 * `dot` prefixes a glowing status dot.
 */
function Badge({
  tone = "default",
  dot = false,
  className = "",
  children,
  ...rest
}) {
  const cls = ["hmla-badge", tone !== "default" ? `hmla-badge--${tone}` : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    className: "hmla-badge__dot"
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla Button — uppercase mono control. Variants map to signal hierarchy:
 * accent = the one live/commit action; default = neutral panel control;
 * ghost = low-emphasis; danger = destructive.
 */
function Button({
  variant = "default",
  size = "md",
  icon = null,
  iconRight = null,
  block = false,
  className = "",
  children,
  ...rest
}) {
  const cls = ["hmla-btn", variant !== "default" ? `hmla-btn--${variant}` : "", size !== "md" ? `hmla-btn--${size}` : "", block ? "hmla-btn--block" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    className: "hmla-btn__ico"
  }, icon) : null, children ? /*#__PURE__*/React.createElement("span", null, children) : null, iconRight ? /*#__PURE__*/React.createElement("span", {
    className: "hmla-btn__ico"
  }, iconRight) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla IconButton — square icon-only control. Pass an icon node (Lucide SVG).
 * `active` lights it with the accent glow (for toggles like mute/solo).
 */
function IconButton({
  size = "md",
  active = false,
  className = "",
  children,
  "aria-label": ariaLabel,
  ...rest
}) {
  const cls = ["hmla-iconbtn", size !== "md" ? `hmla-iconbtn--${size}` : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    "data-active": active ? "true" : undefined,
    "aria-label": ariaLabel
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla Input — recessed text field with a uppercase mono label.
 * Omit `label` to render the bare control.
 */
function Input({
  label,
  id,
  className = "",
  ...rest
}) {
  const fieldId = id || (label ? `f-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const input = /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    className: `hmla-input ${className}`.trim()
  }, rest));
  if (!label) return input;
  return /*#__PURE__*/React.createElement("label", {
    className: "hmla-field",
    htmlFor: fieldId
  }, /*#__PURE__*/React.createElement("span", {
    className: "hmla-field__label"
  }, label), input);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla Select — recessed mono dropdown with custom chevron.
 * `options` is an array of strings or {value,label}. Optional uppercase label.
 */
function Select({
  label,
  id,
  options = [],
  className = "",
  children,
  ...rest
}) {
  const fieldId = id || (label ? `s-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const select = /*#__PURE__*/React.createElement("select", _extends({
    id: fieldId,
    className: `hmla-select ${className}`.trim()
  }, rest), children || options.map(o => {
    const value = typeof o === "string" ? o : o.value;
    const text = typeof o === "string" ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: value,
      value: value
    }, text);
  }));
  if (!label) return select;
  return /*#__PURE__*/React.createElement("label", {
    className: "hmla-field",
    htmlFor: fieldId
  }, /*#__PURE__*/React.createElement("span", {
    className: "hmla-field__label"
  }, label), select);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Select.jsx", error: String((e && e.message) || e) }); }

// components/core/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla Switch — hardware toggle. Controlled via `checked` + `onChange(next)`,
 * or uncontrolled with `defaultChecked`. Lit accent thumb when on.
 */
function Switch({
  checked,
  defaultChecked = false,
  onChange,
  label,
  disabled = false,
  className = "",
  ...rest
}) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(defaultChecked);
  const on = isControlled ? checked : internal;
  function toggle() {
    if (disabled) return;
    const next = !on;
    if (!isControlled) setInternal(next);
    onChange && onChange(next);
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": on,
    "data-on": on ? "true" : "false",
    className: `hmla-switch ${className}`.trim(),
    onClick: toggle,
    disabled: disabled
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "hmla-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hmla-switch__thumb"
  })), label ? /*#__PURE__*/React.createElement("span", {
    className: "hmla-switch__label"
  }, label) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Switch.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla Tag — pill-shaped removable chip (preset names, filters, routes).
 * Pass `onRemove` to show a × affordance.
 */
function Tag({
  onRemove,
  className = "",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `hmla-tag ${className}`.trim()
  }, rest), children, onRemove ? /*#__PURE__*/React.createElement("span", {
    className: "hmla-tag__x",
    role: "button",
    "aria-label": "remove",
    onClick: onRemove
  }, "\xD7") : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/instrument/Fader.jsx
try { (() => {
/**
 * hmla Fader — vertical channel fader. Drag the cap (or arrow keys) to set
 * level. Controlled (`value`+`onChange`) or uncontrolled (`defaultValue`).
 */
function Fader({
  label,
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className = ""
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
  function onPointerMove(e) {
    if (dragging.current) commit(fromClientY(e.clientY));
  }
  function onPointerUp(e) {
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }
  function onKeyDown(e) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      commit(val + step);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      commit(val - step);
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    className: `hmla-fader ${className}`.trim()
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    className: "hmla-fader__track",
    role: "slider",
    tabIndex: 0,
    "aria-label": label,
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-valuenow": val,
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    onKeyDown: onKeyDown
  }, /*#__PURE__*/React.createElement("span", {
    className: "hmla-fader__slot"
  }), /*#__PURE__*/React.createElement("span", {
    className: "hmla-fader__fill",
    style: {
      height: `calc((100% - 20px) * ${pct})`
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "hmla-fader__cap",
    style: {
      bottom: `calc(10px + (100% - 20px) * ${pct})`
    }
  })), label ? /*#__PURE__*/React.createElement("span", {
    className: "hmla-fader__label"
  }, label) : null);
}
Object.assign(__ds_scope, { Fader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/Fader.jsx", error: String((e && e.message) || e) }); }

// components/instrument/Knob.jsx
try { (() => {
/**
 * hmla Knob — rotary control. Drag up/down (or arrow keys) to change value.
 * Sweeps from -135° to +135°. Controlled (`value`+`onChange`) or uncontrolled.
 */
function Knob({
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
  className = ""
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
    drag.current = {
      y: e.clientY,
      v: val
    };
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    const dy = drag.current.y - e.clientY; // up = increase
    const range = max - min;
    commit(drag.current.v + dy / 160 * range); // full sweep ≈ 160px
  }
  function onPointerUp(e) {
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }
  function onKeyDown(e) {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      commit(val + step);
    }
    if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      commit(val - step);
    }
  }
  const dialSize = size === "sm" ? "var(--knob-sm)" : size === "lg" ? "var(--knob-lg)" : "var(--knob-md)";
  const shown = format ? format(val) : `${val}${unit}`;
  return /*#__PURE__*/React.createElement("div", {
    className: `hmla-knob ${className}`.trim()
  }, /*#__PURE__*/React.createElement("div", {
    className: "hmla-knob__dial",
    style: {
      width: dialSize,
      height: dialSize
    },
    role: "slider",
    tabIndex: 0,
    "aria-label": label,
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-valuenow": val,
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    onKeyDown: onKeyDown
  }, /*#__PURE__*/React.createElement("span", {
    className: "hmla-knob__pointer",
    style: {
      transform: `translate(-50%,0) rotate(${angle}deg)`
    }
  })), label ? /*#__PURE__*/React.createElement("span", {
    className: "hmla-knob__label"
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    className: "hmla-knob__value hmla-tnum"
  }, shown));
}
Object.assign(__ds_scope, { Knob });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/Knob.jsx", error: String((e && e.message) || e) }); }

// components/instrument/LED.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla LED — status indicator dot. `tone` sets the lit color; `on` toggles
 * the glow. Use for power, sync, armed, clip indicators.
 */
function LED({
  tone = "green",
  on = true,
  size = 10,
  className = "",
  ...rest
}) {
  const colors = {
    green: "var(--led-green)",
    amber: "var(--led-amber)",
    red: "var(--led-red)",
    blue: "var(--led-blue)",
    cyan: "var(--led-cyan)",
    accent: "var(--accent)"
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `hmla-led ${className}`.trim(),
    "data-on": on ? "true" : "false",
    style: {
      color: colors[tone] || tone,
      width: size,
      height: size
    }
  }, rest));
}
Object.assign(__ds_scope, { LED });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/LED.jsx", error: String((e && e.message) || e) }); }

// components/instrument/Meter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla Meter — level meter (green→amber→red). `value` 0..1. Horizontal by
 * default; `orient="v"` for a vertical channel meter.
 */
function Meter({
  value = 0,
  orient = "h",
  className = "",
  style,
  ...rest
}) {
  const v = Math.min(1, Math.max(0, value));
  const isV = orient === "v";
  const fillStyle = isV ? {
    transform: `scaleY(${v})`
  } : {
    transform: `scaleX(${v})`
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `hmla-meter hmla-meter--${isV ? "v" : "h"} ${className}`.trim(),
    role: "meter",
    "aria-valuemin": 0,
    "aria-valuemax": 1,
    "aria-valuenow": v,
    style: style
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "hmla-meter__fill",
    style: fillStyle
  }));
}
Object.assign(__ds_scope, { Meter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/Meter.jsx", error: String((e && e.message) || e) }); }

// components/instrument/Transport.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ICONS = {
  play: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 5.5v13l11-6.5z",
    fill: "currentColor"
  })),
  pause: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "7",
    y: "5.5",
    width: "3.5",
    height: "13",
    rx: "0.5",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "13.5",
    y: "5.5",
    width: "3.5",
    height: "13",
    rx: "0.5",
    fill: "currentColor"
  })),
  stop: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "6.5",
    y: "6.5",
    width: "11",
    height: "11",
    rx: "1",
    fill: "currentColor"
  })),
  prev: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "6",
    width: "2.5",
    height: "12",
    rx: "0.5",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 6.5v11l-9-5.5z",
    fill: "currentColor"
  })),
  next: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 6.5v11l9-5.5z",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "15.5",
    y: "6",
    width: "2.5",
    height: "12",
    rx: "0.5",
    fill: "currentColor"
  }))
};
function TButton({
  active,
  accent,
  label,
  onClick,
  children
}) {
  const cls = `hmla-iconbtn${accent ? " hmla-transport__play" : ""}`;
  return /*#__PURE__*/React.createElement("button", {
    className: cls,
    "data-active": active ? "true" : undefined,
    "aria-label": label,
    onClick: onClick,
    style: accent ? {
      color: "var(--text-on-accent)",
      background: "var(--accent)",
      borderColor: "transparent",
      boxShadow: "var(--bevel-raised), var(--glow-accent)"
    } : undefined
  }, children);
}

/**
 * hmla Transport — play/pause/stop/skip cluster in a bevelled bar. Controlled
 * via `playing` + callbacks. `children` render after a divider (readouts, etc).
 */
function Transport({
  playing = false,
  onPlayToggle,
  onStop,
  onPrev,
  onNext,
  showSkip = true,
  className = "",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `hmla-transport ${className}`.trim()
  }, rest), showSkip ? /*#__PURE__*/React.createElement(TButton, {
    label: "previous",
    onClick: onPrev
  }, ICONS.prev) : null, /*#__PURE__*/React.createElement(TButton, {
    accent: true,
    label: playing ? "pause" : "play",
    onClick: onPlayToggle
  }, playing ? ICONS.pause : ICONS.play), /*#__PURE__*/React.createElement(TButton, {
    label: "stop",
    onClick: onStop
  }, ICONS.stop), showSkip ? /*#__PURE__*/React.createElement(TButton, {
    label: "next",
    onClick: onNext
  }, ICONS.next) : null, children ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "hmla-transport__sep"
  }), children) : null);
}
Object.assign(__ds_scope, { Transport });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/Transport.jsx", error: String((e && e.message) || e) }); }

// components/instrument/Visualizer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla Visualizer — the signature generative graphic. A canvas that animates a
 * synthetic spectrum (`mode="bars"`) or oscilloscope (`mode="wave"`). It draws
 * its own generative signal — no audio wiring needed — so it works as live
 * ambiance anywhere. Pass `analyser` (a Web Audio AnalyserNode) to drive it
 * from real audio instead.
 */
function Visualizer({
  mode = "bars",
  running = true,
  bars = 48,
  height = 160,
  analyser = null,
  className = "",
  style,
  ...rest
}) {
  const canvasRef = React.useRef(null);
  const raf = React.useRef(0);
  const t = React.useRef(0);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cs = getComputedStyle(canvas);
    const cLo = cs.getPropertyValue("--viz-lo").trim() || "#2a2a30";
    const cMid = cs.getPropertyValue("--viz-mid").trim() || "#ff5c38";
    const cHi = cs.getPropertyValue("--viz-hi").trim() || "#ffc24b";
    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth,
        h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return {
        w,
        h
      };
    }
    let {
      w,
      h
    } = size();
    const onResize = () => ({
      w,
      h
    } = size());
    window.addEventListener("resize", onResize);
    const freq = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    // synthetic spectrum value for a given bar index + time
    function synth(i, time) {
      const x = i / bars;
      const env = Math.sin(x * Math.PI) ** 0.8; // mid-weighted hump
      const s = 0.5 + 0.32 * Math.sin(time * 1.7 + x * 7) + 0.20 * Math.sin(time * 0.9 + x * 13 + 1.3) + 0.12 * Math.sin(time * 3.3 + x * 4);
      return Math.max(0.02, Math.min(1, env * (0.35 + 0.5 * (s * 0.5 + 0.5))));
    }
    function grad(x0, y0, x1, y1) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, cLo);
      g.addColorStop(0.55, cMid);
      g.addColorStop(1, cHi);
      return g;
    }
    function drawBars(time) {
      ctx.clearRect(0, 0, w, h);
      let data = null;
      if (analyser) {
        analyser.getByteFrequencyData(freq);
        data = freq;
      }
      const gap = Math.max(2, w / bars * 0.28);
      const bw = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const v = data ? data[Math.floor(i / bars * data.length)] / 255 : synth(i, time);
        const bh = Math.max(2, v * (h - 4));
        const x = i * (bw + gap);
        const y = h - bh;
        ctx.fillStyle = grad(0, h, 0, 0);
        const r = Math.min(bw / 2, 2);
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, r);
        ctx.fill();
        // reflection cap
        ctx.fillStyle = cHi;
        ctx.globalAlpha = 0.5 * v;
        ctx.fillRect(x, y, bw, 1.5);
        ctx.globalAlpha = 1;
      }
    }
    function drawWave(time) {
      ctx.clearRect(0, 0, w, h);
      let data = null;
      if (analyser) {
        analyser.getByteTimeDomainData(freq);
        data = freq;
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = grad(0, 0, w, 0);
      ctx.shadowColor = cMid;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      const N = data ? data.length : 220;
      for (let i = 0; i <= N; i++) {
        const x = i / N * w;
        let v;
        if (data) v = (data[i] || 128) / 128 - 1;else v = Math.sin(i / N * Math.PI * 6 + time * 2) * Math.sin(i / N * Math.PI) * 0.7 + Math.sin(i / N * Math.PI * 17 + time) * 0.12;
        const y = h / 2 + v * (h / 2 - 6);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    function frame() {
      if (running) t.current += 0.016;
      (mode === "wave" ? drawWave : drawBars)(t.current);
      raf.current = requestAnimationFrame(frame);
    }
    frame();
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", onResize);
    };
  }, [mode, running, bars, analyser]);
  return /*#__PURE__*/React.createElement("canvas", _extends({
    ref: canvasRef,
    className: `hmla-visualizer ${className}`.trim(),
    style: {
      display: "block",
      width: "100%",
      height,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Visualizer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/instrument/Visualizer.jsx", error: String((e && e.message) || e) }); }

// components/layout/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla Panel — the module/card container. `title` renders a silkscreen header
 * with optional `actions` on the right. `tone="well"` recesses it.
 */
function Panel({
  title,
  actions,
  tone = "raised",
  className = "",
  children,
  ...rest
}) {
  const cls = ["hmla-panel", tone === "well" ? "hmla-panel--well" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("section", _extends({
    className: cls
  }, rest), title || actions ? /*#__PURE__*/React.createElement("header", {
    className: "hmla-panel__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hmla-panel__title"
  }, title), actions ? /*#__PURE__*/React.createElement("span", {
    className: "hmla-panel__actions"
  }, actions) : null) : null, /*#__PURE__*/React.createElement("div", {
    className: "hmla-panel__body"
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Panel.jsx", error: String((e && e.message) || e) }); }

// components/layout/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * hmla Tabs — segmented control. `items` is [{id,label}]. Controlled via
 * `value` + `onChange(id)`, or uncontrolled with `defaultValue`.
 */
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  className = "",
  ...rest
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].id));
  const active = isControlled ? value : internal;
  function pick(id) {
    if (!isControlled) setInternal(id);
    onChange && onChange(id);
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `hmla-tabs ${className}`.trim(),
    role: "tablist"
  }, rest), items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    role: "tab",
    "aria-selected": active === it.id,
    "data-active": active === it.id ? "true" : "false",
    className: "hmla-tab",
    onClick: () => pick(it.id)
  }, it.label)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/App.jsx
try { (() => {
/* hmla app — shell + Engine view. Mounts the interactive studio. */
const {
  Knob,
  Visualizer,
  Transport,
  Tabs,
  Button,
  IconButton,
  Badge,
  LED,
  Meter,
  Switch,
  Input
} = window.HmlaDesignSystem_a7a64d;
const MARK = /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 120 64",
  fill: "none"
}, /*#__PURE__*/React.createElement("path", {
  d: "M60 32 C60 14, 86 14, 86 32 C86 50, 60 50, 60 32 C60 14, 34 14, 34 32 C34 50, 60 50, 60 32 Z",
  stroke: "currentColor",
  strokeWidth: "3",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "60",
  cy: "32",
  r: "3.4",
  fill: "currentColor"
}));
const I = d => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, d);
const ICO = {
  sun: I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
  }))),
  moon: I(/*#__PURE__*/React.createElement("path", {
    d: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
  })),
  refresh: I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 3v5h-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 16H3v5"
  }))),
  dice: I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "18",
    height: "18",
    rx: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "8",
    r: "1.3",
    fill: "currentColor",
    stroke: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16",
    cy: "16",
    r: "1.3",
    fill: "currentColor",
    stroke: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1.3",
    fill: "currentColor",
    stroke: "none"
  }))),
  download: I(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 3v12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 11l5 5 5-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 21h16"
  })))
};
const PRESETS = window.HMLA_DATA.presets;
function rngSeed() {
  return "0x" + Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
}
function EngineView({
  playing,
  preset,
  seed,
  onReseed,
  frozen,
  setFrozen
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "viz-hero"
  }, /*#__PURE__*/React.createElement(Visualizer, {
    mode: preset.mode,
    running: playing,
    height: 188,
    bars: 64
  }), /*#__PURE__*/React.createElement("div", {
    className: "viz-hero__meta"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: playing ? "accent" : "default",
    dot: true
  }, playing ? "live" : "idle"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, "seed ", seed), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "regenerate seed",
    onClick: onReseed
  }, ICO.refresh), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "randomize",
    onClick: onReseed
  }, ICO.dice), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "freeze \u221E",
    checked: frozen,
    onChange: setFrozen
  }))), /*#__PURE__*/React.createElement("div", {
    className: "hmla-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hmla-panel__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hmla-panel__title"
  }, "generative engine"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      color: "var(--text-faint)"
    }
  }, preset.name)), /*#__PURE__*/React.createElement("div", {
    className: "rack"
  }, /*#__PURE__*/React.createElement(Knob, {
    label: "density",
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: 0.62,
    format: v => v.toFixed(2)
  }), /*#__PURE__*/React.createElement(Knob, {
    label: "character",
    min: 0,
    max: 100,
    defaultValue: 48,
    format: v => `${v | 0}`
  }), /*#__PURE__*/React.createElement(Knob, {
    label: "space",
    min: 0,
    max: 100,
    defaultValue: 66,
    format: v => `${v | 0}%`
  }), /*#__PURE__*/React.createElement(Knob, {
    label: "drift",
    min: 0,
    max: 100,
    defaultValue: 22,
    format: v => `${v | 0}`
  }), /*#__PURE__*/React.createElement(Knob, {
    label: "lowpass",
    min: 20,
    max: 20000,
    step: 10,
    defaultValue: 8200,
    format: v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
  }), /*#__PURE__*/React.createElement(Knob, {
    label: "output",
    min: -60,
    max: 6,
    defaultValue: -6,
    format: v => `${v.toFixed(1)}`
  }))));
}
function App() {
  const [theme, setTheme] = React.useState("dark");
  const [view, setView] = React.useState("engine");
  const [playing, setPlaying] = React.useState(true);
  const [currentId, setCurrentId] = React.useState("deep");
  const [seed, setSeed] = React.useState("0x4F2A");
  const [frozen, setFrozen] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(184);
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [playing]);
  const preset = PRESETS.find(p => p.id === currentId) || PRESETS[0];
  const MixerView = window.MixerView,
    LibraryView = window.LibraryView;
  function play(id) {
    setCurrentId(id);
    setPlaying(true);
    setSeed(PRESETS.find(p => p.id === id).seed);
  }
  function fmt(s) {
    const m = s / 60 | 0,
      ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "brand__mark"
  }, MARK), /*#__PURE__*/React.createElement("span", {
    className: "brand__word"
  }, "hmla")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 8
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: [{
      id: "engine",
      label: "engine"
    }, {
      id: "mixer",
      label: "mixer"
    }, {
      id: "library",
      label: "library"
    }],
    value: view,
    onChange: setView
  })), /*#__PURE__*/React.createElement("div", {
    className: "topbar__spacer"
  }), /*#__PURE__*/React.createElement("span", {
    className: "topbar__readout"
  }, /*#__PURE__*/React.createElement(LED, {
    tone: "blue"
  }), " sync \xB7 120.00 bpm"), /*#__PURE__*/React.createElement("span", {
    className: "topbar__readout"
  }, "48k / 24-bit"), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "export"
  }, ICO.download), /*#__PURE__*/React.createElement(IconButton, {
    "aria-label": "toggle theme",
    onClick: () => setTheme(t => t === "dark" ? "light" : "dark")
  }, theme === "dark" ? ICO.sun : ICO.moon)), /*#__PURE__*/React.createElement("div", {
    className: "stage"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "rail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rail__section"
  }, /*#__PURE__*/React.createElement(Input, {
    label: "search",
    placeholder: "filter presets\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    className: "rail__section",
    style: {
      gridRow: "span 2",
      gridTemplateRows: "auto 1fr"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "rail__title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hmla-label"
  }, "library"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--text-faint)"
    }
  }, PRESETS.length)), /*#__PURE__*/React.createElement("div", {
    className: "rail__list"
  }, PRESETS.map((p, i) => /*#__PURE__*/React.createElement("button", {
    className: "preset",
    key: p.id,
    "data-active": p.id === currentId,
    onClick: () => play(p.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "preset__idx"
  }, String(i + 1).padStart(2, "0")), /*#__PURE__*/React.createElement("span", {
    className: "preset__name"
  }, p.name), /*#__PURE__*/React.createElement("span", {
    className: "preset__len"
  }, p.len)))))), /*#__PURE__*/React.createElement("main", {
    className: "content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "content__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "content__title"
  }, /*#__PURE__*/React.createElement("h1", null, view === "engine" ? preset.name : view === "mixer" ? "mixer" : "sound library"), /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, view === "engine" ? `generative · ${frozen ? "frozen" : "evolving"} · seed ${seed}` : view === "mixer" ? "5 channels → master bus" : "load a field or start from silence")), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    icon: ICO.download
  }, "render")), view === "engine" && /*#__PURE__*/React.createElement(EngineView, {
    playing: playing,
    preset: preset,
    seed: seed,
    frozen: frozen,
    setFrozen: setFrozen,
    onReseed: () => setSeed(rngSeed())
  }), view === "mixer" && /*#__PURE__*/React.createElement(MixerView, {
    playing: playing
  }), view === "library" && /*#__PURE__*/React.createElement(LibraryView, {
    playing: playing,
    currentId: currentId,
    onPlay: play
  }))), /*#__PURE__*/React.createElement("footer", {
    className: "transportbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tb__now"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tb__art"
  }, /*#__PURE__*/React.createElement(Visualizer, {
    mode: "bars",
    running: playing,
    height: 40,
    bars: 14
  })), /*#__PURE__*/React.createElement("div", {
    className: "tb__meta"
  }, /*#__PURE__*/React.createElement("b", null, preset.name), /*#__PURE__*/React.createElement("span", null, "seed ", seed, " \xB7 ", frozen ? "frozen" : "live"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Transport, {
    playing: playing,
    onPlayToggle: () => setPlaying(p => !p),
    onStop: () => {
      setPlaying(false);
      setElapsed(0);
    },
    onPrev: () => play(PRESETS[(PRESETS.findIndex(p => p.id === currentId) + PRESETS.length - 1) % PRESETS.length].id),
    onNext: () => play(PRESETS[(PRESETS.findIndex(p => p.id === currentId) + 1) % PRESETS.length].id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "tb__time"
  }, fmt(elapsed), " / ", preset.len))), /*#__PURE__*/React.createElement("div", {
    className: "tb__master"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hmla-label"
  }, "master"), /*#__PURE__*/React.createElement(Meter, {
    value: playing ? 0.72 : 0.001
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      color: "var(--text-hi)"
    }
  }, "\u22126.0"))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/data.js
try { (() => {
// hmla app — demo content (presets, channels). Plain JS, attached to window.
window.HMLA_DATA = {
  presets: [{
    id: "deep",
    name: "deep field",
    len: "∞",
    seed: "0x4F2A",
    tags: ["drone", "warm"],
    mode: "bars"
  }, {
    id: "rain",
    name: "rain · soft",
    len: "∞",
    seed: "0x9C11",
    tags: ["noise", "grey"],
    mode: "wave"
  }, {
    id: "tape",
    name: "tape hiss",
    len: "12:00",
    seed: "0x1B7E",
    tags: ["analog"],
    mode: "wave"
  }, {
    id: "shore",
    name: "shoreline",
    len: "∞",
    seed: "0x3D04",
    tags: ["water", "wide"],
    mode: "bars"
  }, {
    id: "vent",
    name: "vent hum",
    len: "∞",
    seed: "0x77A9",
    tags: ["low", "steady"],
    mode: "bars"
  }, {
    id: "dust",
    name: "dust storm",
    len: "08:30",
    seed: "0xE2C0",
    tags: ["pink", "dense"],
    mode: "bars"
  }, {
    id: "glass",
    name: "glass tones",
    len: "∞",
    seed: "0x5511",
    tags: ["bell", "sparse"],
    mode: "wave"
  }, {
    id: "node",
    name: "null node",
    len: "∞",
    seed: "0x0000",
    tags: ["silence+"],
    mode: "wave"
  }],
  channels: [{
    id: "a",
    name: "field",
    level: 74
  }, {
    id: "b",
    name: "grain",
    level: 52
  }, {
    id: "c",
    name: "sub",
    level: 38
  }, {
    id: "d",
    name: "air",
    level: 61
  }, {
    id: "e",
    name: "send",
    level: 28
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/app/views.jsx
try { (() => {
/* hmla app — Mixer & Library views. Attached to window for the App shell. */
const {
  Knob,
  Fader,
  Meter,
  LED,
  Visualizer,
  Badge,
  Tag,
  Button,
  IconButton
} = window.HmlaDesignSystem_a7a64d;

/* ----- Mixer ----- */
function MixerView({
  playing
}) {
  const [chans, setChans] = React.useState(window.HMLA_DATA.channels.map(c => ({
    ...c,
    mute: false,
    solo: false
  })));
  function set(id, patch) {
    setChans(cs => cs.map(c => c.id === id ? {
      ...c,
      ...patch
    } : c));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "rack",
    style: {
      gridTemplateColumns: `repeat(${chans.length + 1}, minmax(92px, 1fr))`
    }
  }, chans.map(c => /*#__PURE__*/React.createElement("div", {
    className: "strip",
    key: c.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "strip__name"
  }, c.name), /*#__PURE__*/React.createElement(Knob, {
    size: "sm",
    label: "pan",
    min: -50,
    max: 50,
    defaultValue: 0,
    format: v => v === 0 ? "C" : v < 0 ? `L${-v | 0}` : `R${v | 0}`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(Fader, {
    label: "",
    value: c.mute ? 0 : c.level,
    onChange: v => set(c.id, {
      level: v
    })
  }), /*#__PURE__*/React.createElement(Meter, {
    orient: "v",
    value: (c.mute ? 0 : c.level) / 100 * (playing ? 1 : 0.001),
    style: {
      height: 150
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "strip__btns"
  }, /*#__PURE__*/React.createElement("button", {
    className: "strip__btn",
    "data-kind": "m",
    "data-on": c.mute,
    onClick: () => set(c.id, {
      mute: !c.mute
    })
  }, "M"), /*#__PURE__*/React.createElement("button", {
    className: "strip__btn",
    "data-kind": "s",
    "data-on": c.solo,
    onClick: () => set(c.id, {
      solo: !c.solo
    })
  }, "S")))), /*#__PURE__*/React.createElement("div", {
    className: "strip",
    style: {
      borderColor: "var(--accent)",
      boxShadow: "var(--glow-accent)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "strip__name",
    style: {
      color: "var(--accent)"
    }
  }, "master"), /*#__PURE__*/React.createElement(LED, {
    tone: "accent"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(Fader, {
    label: "",
    defaultValue: 82
  }), /*#__PURE__*/React.createElement(Meter, {
    orient: "v",
    value: playing ? 0.78 : 0.001,
    style: {
      height: 150
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      color: "var(--text-hi)"
    }
  }, "\u22126.0 dB")));
}

/* ----- Library ----- */
function LibraryView({
  playing,
  currentId,
  onPlay
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "libgrid"
  }, window.HMLA_DATA.presets.map(p => {
    const active = p.id === currentId;
    return /*#__PURE__*/React.createElement("div", {
      className: "sound",
      key: p.id,
      "data-active": active,
      onClick: () => onPlay(p.id)
    }, /*#__PURE__*/React.createElement("div", {
      className: "sound__viz"
    }, /*#__PURE__*/React.createElement(Visualizer, {
      mode: p.mode,
      running: active && playing,
      height: 56,
      bars: 28
    })), /*#__PURE__*/React.createElement("div", {
      className: "sound__row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sound__name"
    }, p.name), active ? /*#__PURE__*/React.createElement(Badge, {
      tone: "accent",
      dot: true
    }, "live") : /*#__PURE__*/React.createElement("span", {
      className: "sound__meta"
    }, p.len)), /*#__PURE__*/React.createElement("div", {
      className: "sound__tags"
    }, p.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
      key: t
    }, t))), /*#__PURE__*/React.createElement("div", {
      className: "sound__row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sound__meta"
    }, "seed ", p.seed), /*#__PURE__*/React.createElement("span", {
      className: "sound__meta"
    }, p.len)));
  }));
}
window.MixerView = MixerView;
window.LibraryView = LibraryView;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/views.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Fader = __ds_scope.Fader;

__ds_ns.Knob = __ds_scope.Knob;

__ds_ns.LED = __ds_scope.LED;

__ds_ns.Meter = __ds_scope.Meter;

__ds_ns.Transport = __ds_scope.Transport;

__ds_ns.Visualizer = __ds_scope.Visualizer;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
