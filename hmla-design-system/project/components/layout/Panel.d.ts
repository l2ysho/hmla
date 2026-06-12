import * as React from "react";

/**
 * The module container — bevelled raised card with an optional silkscreen head.
 */
export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  /** Silkscreen header title (uppercase). */
  title?: React.ReactNode;
  /** Right-aligned header content (buttons, badges). */
  actions?: React.ReactNode;
  /** `raised` module (default) or recessed `well`. */
  tone?: "raised" | "well";
  children?: React.ReactNode;
}

export function Panel(props: PanelProps): JSX.Element;
