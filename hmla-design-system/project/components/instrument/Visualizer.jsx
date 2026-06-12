import React from "react";

/**
 * hmla Visualizer — the signature generative graphic. A canvas that animates a
 * synthetic spectrum (`mode="bars"`) or oscilloscope (`mode="wave"`). It draws
 * its own generative signal — no audio wiring needed — so it works as live
 * ambiance anywhere. Pass `analyser` (a Web Audio AnalyserNode) to drive it
 * from real audio instead.
 */
export function Visualizer({
  mode = "bars",
  running = true,
  bars = 48,
  height = 160,
  analyser = null,
  className = "",
  style,
  ...rest
}) {
  const canvasRef = React.useRef(null);
  const raf = React.useRef(0);
  const t = React.useRef(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cs = getComputedStyle(canvas);
    const cLo = cs.getPropertyValue("--viz-lo").trim() || "#2a2a30";
    const cMid = cs.getPropertyValue("--viz-mid").trim() || "#ff5c38";
    const cHi = cs.getPropertyValue("--viz-hi").trim() || "#ffc24b";

    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    }
    let { w, h } = size();
    const onResize = () => ({ w, h } = size());
    window.addEventListener("resize", onResize);

    const freq = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    // synthetic spectrum value for a given bar index + time
    function synth(i, time) {
      const x = i / bars;
      const env = Math.sin(x * Math.PI) ** 0.8;                       // mid-weighted hump
      const s = 0.5
        + 0.32 * Math.sin(time * 1.7 + x * 7)
        + 0.20 * Math.sin(time * 0.9 + x * 13 + 1.3)
        + 0.12 * Math.sin(time * 3.3 + x * 4);
      return Math.max(0.02, Math.min(1, env * (0.35 + 0.5 * (s * 0.5 + 0.5))));
    }

    function grad(x0, y0, x1, y1) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, cLo); g.addColorStop(0.55, cMid); g.addColorStop(1, cHi);
      return g;
    }

    function drawBars(time) {
      ctx.clearRect(0, 0, w, h);
      let data = null;
      if (analyser) { analyser.getByteFrequencyData(freq); data = freq; }
      const gap = Math.max(2, w / bars * 0.28);
      const bw = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const v = data ? data[Math.floor(i / bars * data.length)] / 255 : synth(i, time);
        const bh = Math.max(2, v * (h - 4));
        const x = i * (bw + gap);
        const y = h - bh;
        ctx.fillStyle = grad(0, h, 0, 0);
        const r = Math.min(bw / 2, 2);
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, r);
        ctx.fill();
        // reflection cap
        ctx.fillStyle = cHi;
        ctx.globalAlpha = 0.5 * v;
        ctx.fillRect(x, y, bw, 1.5);
        ctx.globalAlpha = 1;
      }
    }

    function drawWave(time) {
      ctx.clearRect(0, 0, w, h);
      let data = null;
      if (analyser) { analyser.getByteTimeDomainData(freq); data = freq; }
      ctx.lineWidth = 2;
      ctx.strokeStyle = grad(0, 0, w, 0);
      ctx.shadowColor = cMid; ctx.shadowBlur = 10;
      ctx.beginPath();
      const N = data ? data.length : 220;
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w;
        let v;
        if (data) v = (data[i] || 128) / 128 - 1;
        else v = Math.sin(i / N * Math.PI * 6 + time * 2) * Math.sin(i / N * Math.PI) * 0.7
               + Math.sin(i / N * Math.PI * 17 + time) * 0.12;
        const y = h / 2 + v * (h / 2 - 6);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function frame() {
      if (running) t.current += 0.016;
      (mode === "wave" ? drawWave : drawBars)(t.current);
      raf.current = requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", onResize); };
  }, [mode, running, bars, analyser]);

  return (
    <canvas
      ref={canvasRef}
      className={`hmla-visualizer ${className}`.trim()}
      style={{ display: "block", width: "100%", height, ...style }}
      {...rest}
    />
  );
}
