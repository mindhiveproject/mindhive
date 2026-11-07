"use client";

import { useEffect, useRef } from "react";

// Mirrors a live camera receiver's <video> element onto a canvas. The video
// element itself stays mounted off-screen for as long as the camera is
// connected (yq-data's vision receivers read pixels from it directly, and
// unmounting it would kill the camera and every derived stream) — this is
// just how its current frame gets shown inside the preview panel.
//
// With `receiver` and `layers`, a second canvas on top draws that receiver's
// face geometry (see receivers.js overlayLayers) using yq-data's FaceOverlay.
// It reads the receiver's streams directly, outside the pipeline, so nothing it
// draws is recorded, and it costs nothing once the preview unmounts.
export default function CameraCanvas({ videoElement, receiver, layers }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

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

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas || !receiver || !layers) return undefined;
    let cancelled = false;
    let stop;

    import("yq-data").then(({ FaceOverlay }) => {
      if (cancelled) return;
      // "cover" to match the object-fit of the canvas below, and the video so the
      // overlay knows the frame's size and can place points inside the crop.
      // Translucent so a dense mesh doesn't bury the face; the head-pose axes are
      // off because they are clutter on a preview.
      const overlay = new FaceOverlay(canvas, {
        video: videoElement,
        fit: "cover",
        layers: { headPose: false, ...layers },
        style: { color: "rgba(255, 255, 255, 0.35)" },
      });
      const detach = overlay.attach(receiver);
      overlay.start();
      stop = () => {
        detach();
        overlay.destroy();
      };
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [receiver, layers, videoElement]);

  return (
    <div style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: 4, overflow: "hidden", background: "#000" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
      />
      <canvas
        ref={overlayRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
    </div>
  );
}
