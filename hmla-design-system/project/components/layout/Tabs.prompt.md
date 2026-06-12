Segmented control for switching views (engine / mixer / library). Controlled or uncontrolled.

```jsx
<Tabs
  items={[
    { id: "engine", label: "engine" },
    { id: "mix", label: "mixer" },
  ]}
  defaultValue="engine"
  onChange={setView}
/>
```

The active segment lights accent-orange.
