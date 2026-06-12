import React from "react";

/**
 * hmla Button — uppercase mono control. Variants map to signal hierarchy:
 * accent = the one live/commit action; default = neutral panel control;
 * ghost = low-emphasis; danger = destructive.
 */
export function Button({
  variant = "default",
  size = "md",
  icon = null,
  iconRight = null,
  block = false,
  className = "",
  children,
  ...rest
}) {
  const cls = [
    "hmla-btn",
    variant !== "default" ? `hmla-btn--${variant}` : "",
    size !== "md" ? `hmla-btn--${size}` : "",
    block ? "hmla-btn--block" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button className={cls} {...rest}>
      {icon ? <span className="hmla-btn__ico">{icon}</span> : null}
      {children ? <span>{children}</span> : null}
      {iconRight ? <span className="hmla-btn__ico">{iconRight}</span> : null}
    </button>
  );
}
