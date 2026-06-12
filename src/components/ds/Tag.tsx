import type { HTMLAttributes, ReactNode } from "react";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  onRemove?: () => void;
  children?: ReactNode;
}

/**
 * hmla Tag — pill-shaped chip (preset names, filters, readouts).
 * Pass `onRemove` to show a × affordance.
 */
export function Tag({ onRemove, className = "", children, ...rest }: TagProps) {
  return (
    <span className={`hmla-tag ${className}`.trim()} {...rest}>
      {children}
      {onRemove ? (
        <span className="hmla-tag__x" role="button" aria-label="remove" onClick={onRemove}>
          ×
        </span>
      ) : null}
    </span>
  );
}
