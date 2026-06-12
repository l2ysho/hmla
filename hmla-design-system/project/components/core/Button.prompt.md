Uppercase mono action button — use for any commit/run/navigation action; reach for `variant="accent"` only for the single most-live action on a surface.

```jsx
<Button variant="accent" onClick={run}>audition</Button>
<Button>route to bus</Button>
<Button variant="ghost" size="sm">cancel</Button>
<Button variant="danger" icon={<TrashSvg/>}>clear</Button>
```

Variants: `default` (neutral panel control), `accent` (signal-orange, the live action), `ghost` (low emphasis), `danger` (red). Sizes: `sm` / `md` / `lg`. `block` stretches full width; `icon` / `iconRight` take any node (pass a Lucide SVG). Labels render uppercase automatically — write them lowercase.
