Transport cluster for the player. Controlled — drive `playing` from your state and handle the callbacks.

```jsx
<Transport
  playing={playing}
  onPlayToggle={() => setPlaying((p) => !p)}
  onStop={stop}
  onPrev={prev}
  onNext={next}
>
  <span className="hmla-tnum">120.00 BPM</span>
</Transport>
```

The play button is the accent action. `showSkip={false}` hides prev/next. `children` appear after a divider for readouts.
