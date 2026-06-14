import type { SVGProps } from "react";

// Minimal structural type for a Font Awesome icon definition — lets us read the
// [width, height, …, path] tuple without depending on the @fortawesome type
// packages or shipping the react-fontawesome runtime.
type IconDef = { icon: [number, number, unknown, unknown, string | string[]] };

/** Renders a Font Awesome icon definition as a bare inline SVG (currentColor). */
export function FaIcon({ icon, ...rest }: { icon: IconDef } & SVGProps<SVGSVGElement>) {
  const [w, h, , , path] = icon.icon;
  const d = Array.isArray(path) ? path[path.length - 1] : path;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} fill="currentColor" aria-hidden="true" {...rest}>
      <path d={d} />
    </svg>
  );
}
