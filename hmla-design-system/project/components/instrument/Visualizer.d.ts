import * as React from "react";

/**
 * The signature generative music visualizer — animated spectrum / oscilloscope
 * on a canvas, in the accent gradient. Self-driving; no audio required.
 */
export interface VisualizerProps extends React.HTMLAttributes<HTMLCanvasElement> {
  /** `bars` spectrum (default) or `wave` oscilloscope. */
  mode?: "bars" | "wave";
  /** Animate vs freeze. */
  running?: boolean;
  /** Bar count in `bars` mode. */
  bars?: number;
  /** Canvas height in px. */
  height?: number;
  /** Optional Web Audio AnalyserNode to drive from real audio. */
  analyser?: AnalyserNode | null;
}

export function Visualizer(props: VisualizerProps): JSX.Element;
