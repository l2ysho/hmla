import React from "react";

/**
 * hmla Tag — pill-shaped removable chip (preset names, filters, routes).
 * Pass `onRemove` to show a × affordance.
 */
export function Tag({ onRemove, className = "", children, ...rest }) {
  return (
    <span className={`hmla-tag ${className}`.trim()} {...rest}>
      {children}
      {onRemove ? (
        <span className="hmla-tag__x" role="button" aria-label="remove" onClick={onRemove}>×</span>
      ) : null}
    </span>
  );
}
