The module/card container — wrap any group of controls or content. `title` adds a silkscreen header; `actions` sits at its right.

```jsx
<Panel title="generative engine" actions={<Badge tone="accent" dot>live</Badge>}>
  …controls…
</Panel>
<Panel tone="well">recessed content</Panel>
```

`tone="raised"` (default) floats with a bevel + shadow; `tone="well"` recesses inward.
