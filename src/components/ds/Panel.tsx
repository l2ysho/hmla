import type { HTMLAttributes, ReactNode } from "react";

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  actions?: ReactNode;
  tone?: "raised" | "well";
  children?: ReactNode;
}

/**
 * hmla Panel — the module/card container. `title` renders a silkscreen header
 * with optional `actions` on the right. `tone="well"` recesses it.
 */
export function Panel({
  title,
  actions,
  tone = "raised",
  className = "",
  children,
  ...rest
}: PanelProps) {
  const cls = ["hmla-panel", tone === "well" ? "hmla-panel--well" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={cls} {...rest}>
      {title || actions ? (
        <header className="hmla-panel__head">
          <span className="hmla-panel__title">{title}</span>
          {actions ? <span className="hmla-panel__actions">{actions}</span> : null}
        </header>
      ) : null}
      <div className="hmla-panel__body">{children}</div>
    </section>
  );
}
