# UI Kit — hmla studio (web app)

An interactive recreation of the hmla web app: a generative ambient-noise player built like a precision instrument. This is the primary product surface.

## Run

Open `index.html`. It links the design system (`../../styles.css`), the compiled bundle (`../../_ds_bundle.js`), then the kit scripts.

## Structure

- `index.html` — mounts the app; loads React UMD + Babel + the DS bundle, then `data.js`, `views.jsx`, `App.jsx`.
- `kit.css` — product-specific shell layout (top bar, rail, stage, transport). Composes DS tokens; not part of the shipped token closure.
- `data.js` — demo presets + mixer channels (`window.HMLA_DATA`).
- `views.jsx` — `MixerView` (channel strips) and `LibraryView` (sound-field grid), attached to `window`.
- `App.jsx` — the shell: top bar (brand, tabs, theme toggle), preset rail, content stage, persistent transport bar, plus the inline `EngineView`.

## Interactions (all fake, click-through)

- **Tabs** switch the content stage: **engine** (visualizer hero + rotary rack), **mixer** (faders/meters/mute/solo → master), **library** (sound-field cards).
- **Presets** in the left rail or library cards load into the player; the visualizer + transport reflect the current field and seed.
- **Transport** play/pause/stop/skip drives the running state and the elapsed clock; skip cycles presets.
- **Theme toggle** (top-right) flips the whole app between the dark and light themes.
- **Reseed / randomize / freeze** mutate the engine state and readouts.

## Components used

Visualizer, Knob, Fader, Meter, LED, Transport, Tabs, Panel, Button, IconButton, Switch, Badge, Tag, Input — all from `window.HmlaDesignSystem_a7a64d`. Channel mute/solo buttons are kit-local (not a DS primitive).

> Recreation built from the brand brief (no original product code existed). Mute/solo strip buttons and the app shell chrome are kit-specific; everything else is a design-system component.
