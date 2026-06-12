import { useEffect } from "react";
import type { RefObject } from "react";
import { HIT_COLORS, VOICE_COLORS } from "./constants";
import type { EngineEvent } from "../types";

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  color: string;
}

export function useVisual(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  playing: boolean,
  eventsRef: RefObject<EngineEvent[]>,
  theme: "dark" | "light",
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolve the engine-signal CSS tokens to concrete colors the canvas can
    // paint. Re-runs on theme change (theme is in the effect deps) so the scope
    // tracks dark/light like the rest of the system.
    const cs = getComputedStyle(canvas);
    const color = (v: string) => {
      const m = /var\((--[\w-]+)\)/.exec(v);
      return (m ? cs.getPropertyValue(m[1]).trim() : "") || v;
    };
    let raf = 0;
    let particles: Particle[] = [];
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const W = () => canvas.getBoundingClientRect().width;
    const H = () => canvas.getBoundingClientRect().height;

    const tick = () => {
      while (eventsRef.current.length) {
        const ev = eventsRef.current.shift();
        if (!ev) break;
        if (ev.type === "note") {
          particles.push({
            x: 40 + Math.random() * (W() - 80),
            y: 30 + Math.random() * (H() - 60),
            r: 14 + Math.random() * 14,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.08,
            life: 1,
            decay: 0.0016,
            color: color(VOICE_COLORS[ev.voice]),
          });
        } else if (ev.type === "grain") {
          for (let k = 0; k < 5; k++) {
            particles.push({
              x: Math.random() * W(),
              y: Math.random() * H(),
              r: 1.5 + Math.random() * 2.5,
              vx: (Math.random() - 0.5) * 0.3,
              vy: -0.1 - Math.random() * 0.2,
              life: 1,
              decay: 0.006,
              color: color("var(--viz-grain)"),
            });
          }
        } else if (ev.type === "capture") {
          for (let k = 0; k < 26; k++) {
            particles.push({
              x: (k / 26) * W(),
              y: H() / 2 + (Math.random() - 0.5) * 14,
              r: 1.6,
              vx: 0,
              vy: (Math.random() - 0.5) * 0.25,
              life: 1,
              decay: 0.012,
              color: color("var(--viz-capture)"),
            });
          }
        } else if (ev.type === "hit") {
          const big = ev.track === "boom";
          particles.push({
            x: 20 + Math.random() * (W() - 40),
            y: H() - 8,
            r: big ? 5 + Math.random() * 4 : 1.8 + Math.random() * 1.8,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -(0.25 + Math.random() * 0.35),
            life: 1,
            decay: big ? 0.01 : 0.018,
            color: color(HIT_COLORS[ev.track] || "var(--hit-fallback)"),
          });
        }
      }
      ctx.clearRect(0, 0, W(), H());
      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life) * 0.55;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.r * 1.6;
        ctx.arc(p.x, p.y, p.r * (0.4 + 0.6 * p.life), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };

    if (playing && !reduced) tick();
    else {
      ctx.clearRect(0, 0, W(), H());
      ctx.globalAlpha = 0.25;
      const idleLit = color("var(--viz-idle)");
      const idleDim = color("var(--viz-idle-dim)");
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        ctx.fillStyle = i % 3 === 0 ? idleLit : idleDim;
        ctx.arc(Math.random() * W(), Math.random() * H(), 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [playing, canvasRef, eventsRef, theme]);
}
