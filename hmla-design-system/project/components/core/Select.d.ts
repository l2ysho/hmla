import * as React from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Uppercase mono label above the control. */
  label?: string;
  /** Options as strings or {value,label}. Ignored if children are passed. */
  options?: (string | SelectOption)[];
}

/** Recessed monospace dropdown with a custom chevron. */
export function Select(props: SelectProps): JSX.Element;
