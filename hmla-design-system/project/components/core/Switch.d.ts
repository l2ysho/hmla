import * as React from "react";

export interface SwitchProps {
  /** Controlled on-state. Omit for uncontrolled. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** Fires with the next boolean on toggle. */
  onChange?: (next: boolean) => void;
  /** Uppercase mono label to the right. */
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** Hardware-style toggle with a lit accent thumb. */
export function Switch(props: SwitchProps): JSX.Element;
