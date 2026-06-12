The signature generative visualizer — an animated spectrum or oscilloscope that draws its own synthetic signal (no audio wiring needed). Use it as the hero element of the player, or as live ambiance on any surface.

```jsx
<Visualizer mode="bars" height={180} />
<Visualizer mode="wave" running={playing} />
<Visualizer mode="bars" analyser={node} />  // drive from real Web Audio
```

`mode` = `bars` | `wave`. Set `running={false}` to freeze. Colors come from `--viz-lo/mid/hi` tokens, so it themes automatically. Pass an `analyser` (AnalyserNode) to react to actual audio.
