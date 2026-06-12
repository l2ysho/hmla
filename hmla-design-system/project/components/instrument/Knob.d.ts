import * as React from "react";

/**
 * Rotary control — drag vertically or arrow-key to set a value.
 */
export interface KnobProps {
  /** Uppercase label under the dial. */
  label?: string;
  /** Controlled value. Omit for uncontrolled. */
  value?: number;
  /** Initial value when uncontrolled. */
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  /** Dial diameter. */
  size?: "sm" | "md" | "lg";
  /** Suffix appended to the readout (e.g. " dB", " Hz"). */
  unit?: string;
  /** Custom value formatter; overrides `unit`. */
  format?: (v: number) => string;
  /** Fires with the new value on drag/keypress. */
  onChange?: (v: number) => void;
  className?: string;
}

export function Knob(props: KnobProps): JSX.Element;
