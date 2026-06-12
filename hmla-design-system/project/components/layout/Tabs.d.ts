import * as React from "react";

export interface TabItem {
  id: string;
  label: React.ReactNode;
}

export interface TabsProps {
  /** Segments. */
  items: TabItem[];
  /** Controlled active id. */
  value?: string;
  /** Initial active id (uncontrolled). */
  defaultValue?: string;
  /** Fires with the selected id. */
  onChange?: (id: string) => void;
  className?: string;
}

/** Segmented control with a lit accent segment. */
export function Tabs(props: TabsProps): JSX.Element;
