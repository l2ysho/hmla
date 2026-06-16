# Development

Setup, scripts, project structure and deployment notes for
[hmla](README.md). For what the app is and how it works, see the README.

## Getting started

Requires **Node 20+** and **pnpm ≥ 10.26** (enable via `corepack enable`).

```bash
pnpm install
pnpm dev        # start the dev server (http://localhost:5173)
```

### Scripts

| Command          | Description                                     |
| ---------------- | ----------------------------------------------- |
| `pnpm dev`       | Vite dev server with HMR                        |
| `pnpm build`     | Type-check, then build to `dist/`               |
| `pnpm preview`   | Serve the production build locally              |
| `pnpm typecheck` | `tsgo --noEmit` across app / node / api configs |
| `pnpm lint`      | oxlint                                          |
| `pnpm format`    | oxfmt (write) · `pnpm format:check` to verify   |

## Project structure

```
src/
  App.tsx              UI + engine wiring; app.css is the layout/chassis
  engine/
    buildEngine.ts     audio graph, Markov melody, Euclidean rhythm, recorder
    identity.ts        per-seed instrument/space/groove/kit identity
    prng.ts            seeded PRNG (xmur3 + mulberry32) and Euclidean rhythms
    constants.ts       scales, presets, voice colours
    seed.ts            canonical hmla-<digits> seed helpers
    share.ts           encode/decode the engine mix for share links
    useVisual.ts       particle-canvas visualizer hook
    wav.ts             AudioBuffer → WAV
  components/ds/        design-system primitives (Fader, Transport, LED, …)
  styles/ds/           design tokens + component styles
api/
  og.tsx               edge function: per-seed Open Graph image (@vercel/og)
  share.ts             edge function: per-seed meta tags for crawlers
middleware.ts          routes link-preview crawlers to /api/share
demos/                 standalone Tone.js sound-design playgrounds (see below)
hmla-design-system/    the canonical design spec
```

## Deployment (Vercel)

Zero-config: Vercel auto-detects Vite (`pnpm build` → `dist`). The `api/*` files
deploy as edge functions automatically. Because link-preview crawlers don't run
JS, **Edge Middleware** (`middleware.ts`) routes them to `/api/share`, which
renders per-seed `og:image`/`og:title` meta — this must be middleware (it runs
before static file serving) rather than a `vercel.json` rewrite. The app is
served from its own subdomain, so its favicon and OG assets resolve
independently of the apex domain.

## Sound-design playgrounds

Two standalone HTML files (Tone.js from CDN, no build step) for auditioning and
designing synth/drum/pad recipes — open them directly in a browser:

- `demos/sound-palette.html` — a clickable gallery of ~26 synthesized sounds
- `demos/sound-lab.html` — tweak parameters live and export/import presets
