# hmla

**Generative ambient — seeded, ever-evolving.**

hmla is a browser instrument that synthesizes endless, slowly-evolving ambient
music entirely on the client (Web Audio via [Tone.js](https://tone.js.org/)) —
no samples, no audio files, everything you hear is generated live in your
browser. Every patch is derived from a short **seed**, so the same seed always
produces the same piece, and any patch is a shareable link.

🔊 **Live:** [hmla.richard.solar](https://hmla.richard.solar)

<p align="center">
  <img src="docs/screenshot.png" alt="The hmla interface — a single hardware-style unit with transport, presets, a particle visualizer and an eight-fader engine rack" width="460">
</p>

---

## What it does

- **Deterministic from a seed.** A seed (`hmla-1234`) maps to a fixed
  "instrument" — voice archetype, room/space, harmonic palette, groove, drum kit
  and effects topology — so `same seed + same settings = same patch`, every
  time. Independent PRNG streams keep the melody, rhythm and timbre
  reproducible while sounding like a different machine from seed to seed.
- **Eight live faders.** `density · bright · space · chaos · grain · sub · pulse ·
lofi` (0–100) reshape the patch in real time without rebuilding the audio
  graph, plus a **shimmer** toggle (octave-up reverb halo). With **pulse** at
  zero it stays pure ambient; raise it to bring in the rhythm section.
- **Presets.** `calm`, `dense`, `puls`, `broken tape` as starting points.
- **Record.** Capture the output to a `.wav` download (with a WebM/M4A fallback
  where WAV isn't available).
- **Visualizer.** An event-driven particle canvas reacts to notes, grains,
  captures and drum hits.
- **Shareable patches.** Share to X / Bluesky / Facebook or copy a link. Shared
  links carry the exact patch and unfurl with a per-seed Open Graph card
  rendered on the edge.
- **Dark / light** themes, and a fully responsive "hardware unit" layout.

## How a patch is built

```mermaid
flowchart TD
    seed(["seed · hmla-1234"]) --> ident["deriveIdentity()<br/>independent per-seed PRNG streams"]
    ident --> arch["instrument archetype<br/>oscillators · envelopes · filter"]
    ident --> space["room / space<br/>reverb · delay · lo-fi"]
    ident --> pal["harmonic palette<br/>scales the patch wanders"]
    ident --> kit["groove + drum kit<br/>tempo · swing · polymetric Euclidean tracks"]
    ident --> fx["effects topology<br/>wet-chain order · color module"]
    arch --> engine["buildEngine()<br/>audio graph + sequencer"]
    space --> engine
    pal --> engine
    kit --> engine
    fx --> engine
    faders["8 faders + shimmer"] -. read live every tick .-> engine
    engine --> audio["audio output"]
    engine --> events["event stream"]
    events --> ui["UI readouts"]
    events --> viz["particle visualizer"]
```

A shared link looks like `?s=hmla-1234` (the seed's preset) and gains
`&e=<encoded>` once you nudge a fader away from that preset (the exact mix).
Seeds are always `hmla-<digits>` — the digit suffix is the only editable part,
so a shared link or social card can never be crafted to render an arbitrary word.

## Tech stack

- **[Vite](https://vite.dev) 8** + **React 19** + **TypeScript** (type-checked
  with [tsgo](https://github.com/microsoft/typescript-go) /
  `@typescript/native-preview`)
- **[Tone.js](https://tone.js.org) 15** for all synthesis (Web Audio)
- **[pnpm](https://pnpm.io)** (via Corepack), with supply-chain hardening in
  `pnpm-workspace.yaml`
- **[oxlint](https://oxc.rs)** + **oxfmt** for linting/formatting, **husky** +
  **lint-staged** pre-commit
- **Vercel** edge functions ([`@vercel/og`](https://vercel.com/docs/og-image-generation))
  for OG images, edge middleware for crawler routing, and Vercel Web Analytics

## Development

Local setup, scripts, project structure and deployment notes live in
[DEVELOPMENT.md](DEVELOPMENT.md).

## License

hmla is free software, licensed under the
[GNU Affero General Public License v3.0](LICENSE) or later.

```
Copyright (C) 2026 Richard Solár

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program. If not, see <https://www.gnu.org/licenses/>.
```

Because hmla is served over a network, AGPL §13 applies: everyone running the
hosted instance is entitled to its complete source, which is linked from the
firmware stamp in the app header and lives in this repository.

Third-party dependencies keep their own licenses — Tone.js, React and
`@vercel/analytics` are MIT, `@vercel/edge` is Apache-2.0, `@vercel/og` is
MPL-2.0, and the Font Awesome Free icons are CC-BY-4.0 (icons) with MIT (code).
All are compatible with the AGPL.
