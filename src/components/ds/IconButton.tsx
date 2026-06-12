import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  active?: boolean;
  children?: ReactNode;
}

/**
 * hmla IconButton — square icon-only control. `active` lights it with the accent glow
 * (for toggles like mute/solo).
 */
export function IconButton({
  size = "md",
  active = false,
  className = "",
  children,
  ...rest
}: IconButtonProps) {
  const cls = ["hmla-iconbtn", size !== "md" ? `hmla-iconbtn--${size}` : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} data-active={active ? "true" : undefined} {...rest}>
      {children}
    </button>
  );
}
