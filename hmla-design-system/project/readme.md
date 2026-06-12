# hmla — Design System

> **hmla** is a web-based generative noise generator for calming yourself down — ambient techno that the machine plays, endlessly, so you don't have to. It is built for and by the music-tech crowd: DJs, producers, sampler nerds, synthesists, and anyone who's ever lost an afternoon to a patch cable. The interface is a _precision instrument_, not a wellness app — calm arrives through control, legibility, and craft, not through pastel blobs.

This project is the design system that lets agents and designers build hmla surfaces (the web app, marketing, decks, mocks) on-brand.

---

## Sources

Built from a written brief, not an existing codebase or Figma file. There were **no attached design assets** — every token, component, and screen here is original work in service of the stated brand. If/when real product code or a Figma library exists, link them here and reconcile:

- Codebase: _none provided_
- Figma: _none provided_
- Brand refs cited for direction: Elektron (Digitakt/Analog Rytm), Eurorack/modular panel design, Teenage Engineering OP-1, Ableton, Make Noise.

**Font substitution flag:** the mono-forward type system uses **Martian Mono** (display/labels) and **JetBrains Mono** (body/data), loaded from Google Fonts CDN. These are stand-ins chosen for the right technical character. If hmla has licensed brand fonts, drop the woff2 files in and rewrite `tokens/fonts.css` with local `@font-face`. The system is offline-incomplete until then.

---

## The world hmla lives in

A studio at 2am. One light on. The screen glows. Everything on it looks like it could be _touched_ — knobs you'd grab, faders you'd push, LEDs that mean something. hmla is not trying to look like software; it's trying to look like a well-made instrument that happens to live in a browser. Dark by default (the studio is dark), with a true light theme for daylight and print.

The signal color is **`#ff5c38`** — a single, decisive signal-orange. It is the "this is live / this is selected / this is now" color. Used sparingly, it carries enormous weight, like the one red button on a mixer you're not supposed to press.

---

## CONTENT FUNDAMENTALS

How hmla writes.

- **Voice:** terse, technical, a little dry. Confident operator-to-operator. We assume you know what a low-pass filter is; we don't condescend. No hand-holding, no exclamation marks, no "Let's get started!" energy.
- **Casing:** the wordmark and most UI labels are **all-lowercase** (`hmla`, `presets`, `output`). Panel labels — the silkscreened ones — are **UPPERCASE with wide tracking** (`GAIN`, `DENSITY`, `OUTPUT BUS`). Body copy is sentence case. Never Title Case Like A Marketing Page.
- **Person:** prefer the **imperative** ("shape the noise", "hold to audition") and **second person** sparingly ("your room, tuned"). We talk _to_ the user as a peer, rarely _about_ ourselves. Avoid "we" in product UI.
- **Numbers are the hero.** Values, units, ranges — show them. `−6.0 dB`, `120.00 BPM`, `0.85 Hz`, `∞`. Tabular figures, real units, monospaced. A readout is more trustworthy than an adjective.
- **Emoji:** **none.** Not in product, not in marketing. The icon language is line icons and unicode technical glyphs (`∞ ◇ ↻ ⏻ ⎓`), never 😌🎧.
- **Punctuation & symbols:** we like the em-dash, the middot · separator, the arrow → for flow, and unit symbols. Use real glyphs, not ASCII approximations (`−` minus not hyphen, `×` not x, `∞` not "inf").
- **Tone examples:**
  - Hero: _"noise, generated. a calmer machine for your room."_
  - Button: `audition` · `commit` · `route to bus` · `freeze`
  - Empty state: _"no signal. load a preset or start from silence."_
  - Tooltip: _"density — events per second. higher is busier, not louder."_
  - Error: _"output muted. nothing is leaving the master bus."_
  - Microcopy/units: `RMS −18 dBFS` · `seed 0x4F2A` · `48 kHz / 24-bit`
- **What we never say:** "vibes", "magic", "effortless", "wellness journey", "supercharge", "unlock". No growth-marketing verbs.

---

## VISUAL FOUNDATIONS

The look and feel, exhaustively.

### Color & theme

- **Dual theme, dark-primary.** Default is a near-black panel stack (`--surface-page` `#08080a` → panels `#131316` → controls `#212126`). Light theme is **warm paper** (`#fbfaf6` / `#f4f1ea`), ink-on-cream — not cold white. Switch via `[data-theme="light"]` on a root element.
- **One accent: signal-orange** `#ff5c38` (dark) / `#e8451f` (light, for contrast). It means _active, selected, live, now_. Don't decorate with it — assign it meaning.
- **Instrument signals** (LED palette): green `#5dffb0` (ok/armed), amber `#ffc24b` (warn/peak), red `#ff4d4d` (clip/error), blue `#5b9dff` / cyan `#4be0e0` (info, MIDI, sync). These are for meters, status dots, and readouts — not large fills.
- **Neutrals are warm-cool-neutral** (a hair of blue in the dark ink, a hair of warm in light). Avoid pure `#000`/`#fff` for surfaces.
- **Vibe of imagery:** cool, low-light, high-grain. Black-and-white or desaturated-with-one-color-pop. Think studio photography at night, modular close-ups, oscilloscope traces. Never bright stock photography, never gradients-as-photos.

### Type

- **Mono-forward, two families.** Display/labels = **Martian Mono** (geometric, technical, panel-silkscreen). Body/data/code = **JetBrains Mono** (readable mono). Everything is monospaced — it's the core identity.
- **Big numerals** for hero moments (88px display), tight tracking (`-0.02em`).
- **Labels** are uppercase, `0.14em` tracking, `--text-label` color, small (12px). They look engraved.
- **Tabular numbers everywhere** values appear (`font-variant-numeric: tabular-nums`, helper `.hmla-tnum`).

### Spacing & layout

- **4px grid.** Dense by default — this is an instrument, panels pack tightly. `--gutter` 24px, `--panel-pad` 20px.
- **Fixed rails.** App layouts use a fixed left rail (`--rail-w` 264px) and a persistent bottom transport bar. Content scrolls; chrome doesn't.
- **Modular grid.** Lay controls out in clear rows/columns with hairline dividers, like a rack of modules. Use `display:grid`/`flex` with `gap` — never inline-flow spacing.

### Surfaces, borders, depth

- **Engraved hardware language.** Recessed wells use `--shadow-well` (inset dark top + faint light bottom). Raised modules use `--bevel-raised` + a soft `--shadow-md` drop. Pressed controls invert to inset.
- **Hairlines, not heavy borders.** `--line-hairline` (1px, `#2a2a30` dark) divides modules. Heavier `--line-strong` only for strong separation.
- **Corner radii are modest.** Panels `--radius-lg` (11px) / `--radius-xl` (16px). Controls `--radius-md` (7px) / `--radius-sm` (4px). Knobs and LEDs are perfect circles. Pills (`--radius-pill`) only for tags and toggles. Nothing is blobby.
- **Cards = raised module.** `--surface-raised` fill, 1px hairline border, `--radius-lg`, `--bevel-raised` + `--shadow-md`. In light theme they get a crisp white face with a soft warm shadow.

### Texture & atmosphere

- **Film grain is always on.** A tiled SVG fractal-noise overlay (`.hmla-grain` / `--grain-url`) at ~5% opacity (dark) / 3.5% (light), `mix-blend-mode: overlay`. It sits on page backgrounds and large panels to kill flatness. Subtle — you feel it, you don't see it.
- **Glow is reserved for signal.** `--glow-accent` rings active/selected controls; `--glow-led` halos lit LEDs. Glow is never decorative ambiance — only emitted by things that are _on_.
- **Depth via layering**, not blur. Use the panel stack (`well` < `panel` < `raised` < `control`). Blur/transparency only for true overlays (`--surface-overlay`, backdrop-blur on modals and the transport's frosted backdrop).

### Motion

- **Mechanical, not bouncy.** Eases are `--ease-out` / `--ease-snap` — precise, no springs, no overshoot. Durations short: `--dur-fast` 110ms (hover/press), `--dur-base` 180ms (panels), `--dur-slow` 320ms (overlays).
- **Hover:** controls lift one step in the panel stack (`--surface-control` → `--surface-control-hover`) and/or brighten 1 level; accent items gain glow. No scale-up.
- **Press:** controls go **inset** (recess into the panel) and may shrink ~1px translateY. Tactile, like pushing a real button. Accent buttons darken to `--accent-active`.
- **The visualizer animates continuously** (the one always-moving thing) — a real-time spectrum/waveform. Everything else is still until touched.
- **Reduced motion** respected globally (animations/transitions collapse to ~0).

### Focus & accessibility

- **Focus ring** is a 2px accent ring offset by the page color (`--ring`) — visible on dark and light.
- Min touch target 44px (`--control-h-lg`, `--knob-sm`).

---

## ICONOGRAPHY

- **System:** [**Lucide**](https://lucide.dev) — clean 1.5–2px stroke line icons, technical and neutral, a strong match for the Eurorack panel feel. Loaded from CDN (`lucide@latest`). No icon binaries are bundled; if going fully offline, vendor the SVGs into `assets/icons/`.
- **Style:** outline/line only, never filled-blob icons. Stroke icons sit comfortably next to monospace labels. Size 16–20px in UI, stroke `currentColor`.
- **Unicode technical glyphs** are first-class and used inline as instrument symbols where they read better than an icon: `∞` (freeze/infinite), `↻` (regenerate/seed), `⏻` (power), `⎓` (DC/sync), `◇ ◆` (preset/state), `▷ ❚❚ ■` (transport), `·` (separator), `→` (signal flow), `±` `×` `−`. Prefer these for dense readouts.
- **Emoji:** never.
- **Logo/wordmark:** lowercase `hmla` set in Martian Mono with tight tracking, plus an "infinity-loop" signal mark. See `assets/` and the Brand cards.

---

## INDEX — what's in here

**Root**

- `styles.css` — global entry point (import-only). Consumers link this.
- `readme.md` — this file.
- `SKILL.md` — Agent-Skill front-matter for use in Claude Code.

**Tokens** (`tokens/`) — all `@import`ed by `styles.css`

- `fonts.css` · `colors.css` (dual theme) · `typography.css` · `spacing.css` · `effects.css` · `base.css`

**Foundations** (`guidelines/`) — `@dsCard` specimen cards for the Design System tab (Type, Colors, Spacing, Brand).

**Assets** (`assets/`) — wordmark + signal mark (SVG), favicon, icon usage notes.

**Components** (`components/`) — React primitives, grouped by concern. Each has a `.d.ts` contract + `.prompt.md` usage. Styling ships via `components/components.css` (imported by `styles.css`).

- `core/` — Button, IconButton, Input, Select, Switch, Badge, Tag
- `instrument/` — Knob, Fader, LED, Meter, Visualizer (the signature generative graphic), Transport
- `layout/` — Panel (module/card), Tabs (segmented)

**UI kit** (`ui_kits/app/`) — the hmla studio web app: an interactive generative-noise player with engine / mixer / library views, a preset rail, a persistent transport bar, and a live dark/light theme toggle. Recreation built from the brief.

**Templates** (`templates/`) — copyable starting folders for consuming projects.

- `studio-panel/` — **Studio Panel**: generative-engine starter (visualizer hero, knob rack, transport) assembled from DS components. Loads the system via `ds-base.js`.

> Namespace for `@dsCard` HTML: `window.HmlaDesignSystem_a7a64d`.
