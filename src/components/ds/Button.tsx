import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "default",
  size = "md",
  icon = null,
  iconRight = null,
  block = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    "hmla-btn",
    variant !== "default" ? `hmla-btn--${variant}` : "",
    size !== "md" ? `hmla-btn--${size}` : "",
    block ? "hmla-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} {...rest}>
      {icon ? <span className="hmla-btn__ico">{icon}</span> : null}
      {children ? <span>{children}</span> : null}
      {iconRight ? <span className="hmla-btn__ico">{iconRight}</span> : null}
    </button>
  );
}
