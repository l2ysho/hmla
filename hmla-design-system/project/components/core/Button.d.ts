import * as React from "react";

/**
 * Primary action control, set in uppercase Martian Mono.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis. `accent` is the single live/commit action. */
  variant?: "default" | "accent" | "ghost" | "danger";
  /** Control height. */
  size?: "sm" | "md" | "lg";
  /** Leading icon node (e.g. a Lucide SVG). */
  icon?: React.ReactNode;
  /** Trailing icon node. */
  iconRight?: React.ReactNode;
  /** Stretch to full width. */
  block?: boolean;
  children?: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
