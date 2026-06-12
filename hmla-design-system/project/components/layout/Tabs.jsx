import React from "react";

/**
 * hmla Tabs — segmented control. `items` is [{id,label}]. Controlled via
 * `value` + `onChange(id)`, or uncontrolled with `defaultValue`.
 */
export function Tabs({ items = [], value, defaultValue, onChange, className = "", ...rest }) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].id));
  const active = isControlled ? value : internal;

  function pick(id) {
    if (!isControlled) setInternal(id);
    onChange && onChange(id);
  }

  return (
    <div className={`hmla-tabs ${className}`.trim()} role="tablist" {...rest}>
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          aria-selected={active === it.id}
          data-active={active === it.id ? "true" : "false"}
          className="hmla-tab"
          onClick={() => pick(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
