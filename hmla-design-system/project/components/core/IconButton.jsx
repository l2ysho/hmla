import React from "react";

/**
 * hmla IconButton — square icon-only control. Pass an icon node (Lucide SVG).
 * `active` lights it with the accent glow (for toggles like mute/solo).
 */
export function IconButton({
  size = "md",
  active = false,
  className = "",
  children,
  "aria-label": ariaLabel,
  ...rest
}) {
  const cls = [
    "hmla-iconbtn",
    size !== "md" ? `hmla-iconbtn--${size}` : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <button className={cls} data-active={active ? "true" : undefined} aria-label={ariaLabel} {...rest}>
      {children}
    </button>
  );
}
