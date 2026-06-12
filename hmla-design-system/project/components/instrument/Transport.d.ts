import * as React from "react";

/**
 * Transport cluster (play/pause/stop/skip) in a bevelled bar.
 */
export interface TransportProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Playing state — flips the play/pause glyph. */
  playing?: boolean;
  /** Fired when play/pause is pressed. */
  onPlayToggle?: () => void;
  /** Fired on stop. */
  onStop?: () => void;
  /** Fired on previous. */
  onPrev?: () => void;
  /** Fired on next. */
  onNext?: () => void;
  /** Show prev/next skip buttons. */
  showSkip?: boolean;
  /** Extra content after a divider (readouts, tempo, etc). */
  children?: React.ReactNode;
}

export function Transport(props: TransportProps): JSX.Element;
