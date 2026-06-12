Hardware toggle for binary states (engine on, loop, monitor). Controlled or uncontrolled.

```jsx
<Switch label="loop" defaultChecked />
<Switch label="monitor" checked={mon} onChange={setMon} />
```

`onChange(next)` gives you the new boolean. The thumb lights accent-orange when on.
