import React from "react";

/**
 * hmla Meter — level meter (green→amber→red). `value` 0..1. Horizontal by
 * default; `orient="v"` for a vertical channel meter.
 */
export function Meter({ value = 0, orient = "h", className = "", style, ...rest }) {
  const v = Math.min(1, Math.max(0, value));
  const isV = orient === "v";
  const fillStyle = isV ? { transform: `scaleY(${v})` } : { transform: `scaleX(${v})` };
  return (
    <div
      className={`hmla-meter hmla-meter--${isV ? "v" : "h"} ${className}`.trim()}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={v}
      style={style}
      {...rest}
    >
      <span className="hmla-meter__fill" style={fillStyle} />
    </div>
  );
}
