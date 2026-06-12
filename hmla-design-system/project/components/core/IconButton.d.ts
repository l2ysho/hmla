import * as React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Control size. */
  size?: "sm" | "md" | "lg";
  /** Lit/selected state — gains accent glow (mute, solo, freeze toggles). */
  active?: boolean;
  /** Required for a11y — describe the action. */
  "aria-label": string;
  /** The icon node (Lucide SVG, unicode glyph, etc). */
  children?: React.ReactNode;
}

/** Square icon-only control with an active/lit state. */
export function IconButton(props: IconButtonProps): JSX.Element;
