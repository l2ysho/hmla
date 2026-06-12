import React from "react";

/**
 * hmla LED — status indicator dot. `tone` sets the lit color; `on` toggles
 * the glow. Use for power, sync, armed, clip indicators.
 */
export function LED({ tone = "green", on = true, size = 10, className = "", ...rest }) {
  const colors = {
    green: "var(--led-green)", amber: "var(--led-amber)", red: "var(--led-red)",
    blue: "var(--led-blue)", cyan: "var(--led-cyan)", accent: "var(--accent)",
  };
  return (
    <span
      className={`hmla-led ${className}`.trim()}
      data-on={on ? "true" : "false"}
      style={{ color: colors[tone] || tone, width: size, height: size }}
      {...rest}
    />
  );
}
