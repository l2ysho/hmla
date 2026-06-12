import * as React from "react";

export interface MeterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Level, 0..1. */
  value?: number;
  /** Orientation: horizontal `h` (default) or vertical `v`. */
  orient?: "h" | "v";
}

/** Green→amber→red level meter. */
export function Meter(props: MeterProps): JSX.Element;
