import { useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (next: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
}

/**
 * hmla Switch — hardware toggle. Controlled via `checked` + `onChange(next)`,
 * or uncontrolled with `defaultChecked`. Lit accent thumb when on.
 */
export function Switch({
  checked,
  defaultChecked = false,
  onChange,
  label,
  disabled = false,
  className = "",
  ...rest
}: SwitchProps) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const on = isControlled ? checked : internal;
  function toggle() {
    if (disabled) return;
    const next = !on;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      data-on={on ? "true" : "false"}
      className={`hmla-switch ${className}`.trim()}
      onClick={toggle}
      disabled={disabled}
      {...rest}
    >
      <span className="hmla-switch__track">
        <span className="hmla-switch__thumb" />
      </span>
      {label ? <span className="hmla-switch__label">{label}</span> : null}
    </button>
  );
}
