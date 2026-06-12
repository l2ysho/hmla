import * as React from "react";

export interface LEDProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Lit color from the signal palette (or any CSS color). */
  tone?: "green" | "amber" | "red" | "blue" | "cyan" | "accent" | string;
  /** Lit (glowing) vs dark. */
  on?: boolean;
  /** Diameter in px. */
  size?: number;
}

/** Glowing status indicator dot. */
export function LED(props: LEDProps): JSX.Element;
