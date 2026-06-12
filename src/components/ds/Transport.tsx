import type { HTMLAttributes, ReactNode } from "react";

const ICONS = {
  play: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="5.5" width="3.5" height="13" rx="0.5" fill="currentColor" />
      <rect x="13.5" y="5.5" width="3.5" height="13" rx="0.5" fill="currentColor" />
    </svg>
  ),
  stop: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.5" y="6.5" width="11" height="11" rx="1" fill="currentColor" />
    </svg>
  ),
  prev: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="6" width="2.5" height="12" rx="0.5" fill="currentColor" />
      <path d="M19 6.5v11l-9-5.5z" fill="currentColor" />
    </svg>
  ),
  next: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6.5v11l9-5.5z" fill="currentColor" />
      <rect x="15.5" y="6" width="2.5" height="12" rx="0.5" fill="currentColor" />
    </svg>
  ),
};

interface TButtonProps {
  active?: boolean;
  accent?: boolean;
  label: string;
  onClick?: () => void;
  children?: ReactNode;
}

function TButton({ active, accent, label, onClick, children }: TButtonProps) {
  const cls = `hmla-iconbtn${accent ? " hmla-transport__play" : ""}`;
  return (
    <button
      className={cls}
      data-active={active ? "true" : undefined}
      aria-label={label}
      onClick={onClick}
      style={
        accent
          ? {
              color: "var(--text-on-accent)",
              background: "var(--accent)",
              borderColor: "transparent",
              boxShadow: "var(--bevel-raised), var(--glow-accent)",
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

export interface TransportProps extends HTMLAttributes<HTMLDivElement> {
  playing?: boolean;
  onPlayToggle?: () => void;
  onStop?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  showSkip?: boolean;
  children?: ReactNode;
}

/**
 * hmla Transport — play/pause/stop/skip cluster in a bevelled bar. Controlled
 * via `playing` + callbacks. `children` render after a divider (readouts, etc).
 */
export function Transport({
  playing = false,
  onPlayToggle,
  onStop,
  onPrev,
  onNext,
  showSkip = true,
  className = "",
  children,
  ...rest
}: TransportProps) {
  return (
    <div className={`hmla-transport ${className}`.trim()} {...rest}>
      {showSkip ? (
        <TButton label="previous" onClick={onPrev}>
          {ICONS.prev}
        </TButton>
      ) : null}
      <TButton accent label={playing ? "pause" : "play"} onClick={onPlayToggle}>
        {playing ? ICONS.pause : ICONS.play}
      </TButton>
      <TButton label="stop" onClick={onStop}>
        {ICONS.stop}
      </TButton>
      {showSkip ? (
        <TButton label="next" onClick={onNext}>
          {ICONS.next}
        </TButton>
      ) : null}
      {children ? (
        <>
          <span className="hmla-transport__sep" />
          {children}
        </>
      ) : null}
    </div>
  );
}
