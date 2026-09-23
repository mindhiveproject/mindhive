"use client";

import { useEffect, useRef } from "react";

const STROKE = "#171717";

// Draws a rolling line trace of a raw output channel straight off the ring
// buffer `getBuffer` returns, in its own requestAnimationFrame loop — decoupled
// from React's render cycle so a fast stream never triggers a re-render.
export default function WaveformCanvas({ getBuffer, height = 64 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let frame;

    function draw() {
      const width = canvas.parentElement?.clientWidth || canvas.clientWidth || 1;
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.max(1, Math.round(width * dpr));
      const targetH = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const buf = getBuffer();
      if (buf) {
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < buf.length; i += 1) {
          const v = buf[i];
          if (!Number.isNaN(v)) {
            if (v < min) min = v;
            if (v > max) max = v;
          }
        }
        const range = max > min ? max - min : 1;

        ctx.beginPath();
        ctx.strokeStyle = STROKE;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < buf.length; i += 1) {
          const x = (i / (buf.length - 1)) * width;
          const v = buf[i];
          const y = Number.isNaN(v) ? height / 2 : height - ((v - min) / range) * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [getBuffer, height]);

  return <canvas ref={canvasRef} style={{ width: "100%", height, display: "block" }} />;
}
