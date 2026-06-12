import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Uppercase mono label rendered above the field. */
  label?: string;
}

/** Recessed monospace text field with optional silkscreen label. */
export function Input(props: InputProps): JSX.Element;
