import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/**
 * hmla Input — recessed text field with an uppercase mono label.
 * Omit `label` to render the bare control.
 */
export function Input({ label, id, className = "", ...rest }: InputProps) {
  const fieldId = id || (label ? `f-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const input = <input id={fieldId} className={`hmla-input ${className}`.trim()} {...rest} />;
  if (!label) return input;
  return (
    <label className="hmla-field" htmlFor={fieldId}>
      <span className="hmla-field__label">{label}</span>
      {input}
    </label>
  );
}
