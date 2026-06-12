import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Signal tone. */
  tone?: "default" | "accent" | "ok" | "warn" | "err";
  /** Prefix a glowing status dot. */
  dot?: boolean;
  children?: React.ReactNode;
}

/** Small uppercase status chip in the signal palette. */
export function Badge(props: BadgeProps): JSX.Element;
