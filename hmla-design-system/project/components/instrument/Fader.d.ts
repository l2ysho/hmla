import * as React from "react";

export interface FaderProps {
  /** Uppercase label under the track. */
  label?: string;
  /** Controlled value. */
  value?: number;
  /** Initial value when uncontrolled. */
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  /** Fires with the new value. */
  onChange?: (v: number) => void;
  className?: string;
}

/** Vertical channel fader with a draggable cap. */
export function Fader(props: FaderProps): JSX.Element;
