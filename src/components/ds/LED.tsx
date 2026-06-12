import type { HTMLAttributes } from "react";

export interface LEDProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "green" | "amber" | "red" | "blue" | "cyan" | "accent" | string;
  on?: boolean;
  size?: number;
}

const COLORS: Record<string, string> = {
  green: "var(--led-green)",
  amber: "var(--led-amber)",
  red: "var(--led-red)",
  blue: "var(--led-blue)",
  cyan: "var(--led-cyan)",
  accent: "var(--accent)",
};

/**
 * hmla LED — status indicator dot. `tone` sets the lit color (named tone or
 * any CSS color); `on` toggles the glow.
 */
export function LED({
  tone = "green",
  on = true,
  size = 10,
  className = "",
  style,
  ...rest
}: LEDProps) {
  return (
    <span
      className={`hmla-led ${className}`.trim()}
      data-on={on ? "true" : "false"}
      style={{ color: COLORS[tone] || tone, width: size, height: size, ...style }}
      {...rest}
    />
  );
}
