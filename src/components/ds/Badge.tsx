import type { HTMLAttributes, ReactNode } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "accent" | "ok" | "warn" | "err";
  dot?: boolean;
  children?: ReactNode;
}

/**
 * hmla Badge — small status chip. `tone` maps to the signal palette.
 * `dot` prefixes a glowing status dot.
 */
export function Badge({
  tone = "default",
  dot = false,
  className = "",
  children,
  ...rest
}: BadgeProps) {
  const cls = ["hmla-badge", tone !== "default" ? `hmla-badge--${tone}` : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} {...rest}>
      {dot ? <span className="hmla-badge__dot" /> : null}
      {children}
    </span>
  );
}
