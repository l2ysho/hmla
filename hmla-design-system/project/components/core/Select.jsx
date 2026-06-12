import React from "react";

/**
 * hmla Select — recessed mono dropdown with custom chevron.
 * `options` is an array of strings or {value,label}. Optional uppercase label.
 */
export function Select({ label, id, options = [], className = "", children, ...rest }) {
  const fieldId = id || (label ? `s-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const select = (
    <select id={fieldId} className={`hmla-select ${className}`.trim()} {...rest}>
      {children || options.map((o) => {
        const value = typeof o === "string" ? o : o.value;
        const text = typeof o === "string" ? o : o.label;
        return <option key={value} value={value}>{text}</option>;
      })}
    </select>
  );
  if (!label) return select;
  return (
    <label className="hmla-field" htmlFor={fieldId}>
      <span className="hmla-field__label">{label}</span>
      {select}
    </label>
  );
}
