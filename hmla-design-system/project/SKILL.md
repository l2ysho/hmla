---
name: hmla-design
description: Use this skill to generate well-branded interfaces and assets for hmla, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

hmla is a web-based generative ambient-noise player for the music-tech crowd. The system is **mono-forward, Elektron/Eurorack-flavored**: near-black panels (with a true warm-paper light theme), a single **signal-orange `#ff5c38`** accent, film-grain texture, engraved hardware depth, and uppercase silkscreen labels. Type is two monospaces — Martian Mono (display/labels) + JetBrains Mono (body/data). Copy is terse, lowercase, technical; no emoji.

Key files:

- `styles.css` — the global entry point; link this to get all tokens + fonts.
- `tokens/` — colors (dual theme), typography, spacing, effects (grain/glow/bevels).
- `components/` — React primitives (Button, Knob, Fader, Visualizer, Transport, Meter, LED, Panel, Tabs, …). Each has a `.prompt.md` with usage.
- `ui_kits/app/` — the full hmla studio app, interactive.
- `templates/studio-panel/` — copyable starter screen (visualizer + knob rack + transport).
- `guidelines/` — foundation specimen cards.
- `readme.md` — the full design guide (content + visual foundations, iconography).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
