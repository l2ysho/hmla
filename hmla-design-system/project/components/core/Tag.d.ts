import * as React from "react";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Show a × and fire this on click. */
  onRemove?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

/** Pill chip for presets, filters, and routes; optionally removable. */
export function Tag(props: TagProps): JSX.Element;
