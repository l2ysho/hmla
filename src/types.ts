export interface Params {
  density: number;
  brightness: number;
  space: number;
  chaos: number;
  grain: number;
  pulse: number;
  sub: number;
  lofi: number;
  shimmer: boolean;
}

export type EngineEvent =
  | { type: "note"; voice: number; note: string }
  | { type: "grain" }
  | { type: "capture" }
  | { type: "hit"; track: "boom" | "pluck" | "shaker" | "ping" }
  | { type: "key"; name: string }
  | { type: "bpm"; value: number }
  | { type: "pattern" };

export interface EngineHandle {
  apply: (p: Params) => void;
  dispose: () => void;
  canRecord: boolean;
  startRec: () => void;
  stopRec: () => Promise<{ blob: Blob; ext: string } | null>;
}
