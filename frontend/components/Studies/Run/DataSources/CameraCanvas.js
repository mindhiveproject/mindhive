"use client";

import { useEffect, useRef } from "react";

// Mirrors a live camera receiver's <video> element onto a canvas. The video
// element itself stays mounted off-screen for as long as the camera is
// connected (yq-data's vision receivers read pixels from it directly, and
// unmounting it would kill the camera and every derived stream) — this is
// just how its current frame gets shown inside the preview panel.
export default function CameraCanvas({ videoElement }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoElement) return undefined;
    const ctx = canvas.getContext("2d");
    let frame;

    function draw() {
      const vw = videoElement.videoWidth;
      const vh = videoElement.videoHeight;
      if (vw && vh) {
        if (canvas.width !== vw || canvas.height !== vh) {
          canvas.width = vw;
          canvas.height = vh;
        }
        ctx.drawImage(videoElement, 0, 0, vw, vh);
      }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [videoElement]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", aspectRatio: "16 / 9", display: "block", borderRadius: 4, background: "#000" }}
    />
  );
}
