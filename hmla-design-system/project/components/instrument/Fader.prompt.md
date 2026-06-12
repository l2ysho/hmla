Vertical channel fader for mixer levels. Drag the cap or arrow-key.

```jsx
<Fader label="master" defaultValue={72} />
<Fader label="rain" value={lvl} onChange={setLvl} />
```

Controlled via `value`+`onChange`, or uncontrolled via `defaultValue`. 150px tall by default.
