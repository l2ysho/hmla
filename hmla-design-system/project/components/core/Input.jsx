import React from "react";

/**
 * hmla Input — recessed text field with a uppercase mono label.
 * Omit `label` to render the bare control.
 */
export function Input({ label, id, className = "", ...rest }) {
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
