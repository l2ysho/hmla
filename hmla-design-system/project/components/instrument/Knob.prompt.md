The signature rotary control. Drag up/down or use arrow keys; sweeps ±135°. Use for any continuous parameter (gain, density, filter, mix).

```jsx
<Knob label="density" min={0} max={1} step={0.01} defaultValue={0.85} unit=" Hz" />
<Knob label="gain" min={-60} max={6} defaultValue={-6}
      format={v => `${v.toFixed(1)} dB`} onChange={setGain} />
```

Sizes `sm` / `md` / `lg`. Pass `unit` for a simple suffix or `format` for full control. Controlled via `value`+`onChange`, or uncontrolled via `defaultValue`.
