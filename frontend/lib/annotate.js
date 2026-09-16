/**
 * Drawing on a screenshot: the pure part, with no React in it.
 *
 * A markup is an ordered list of shapes, stored in the IMAGE's pixel space
 * rather than the screen's. The canvas is drawn at the screenshot's full
 * resolution and only scaled down by CSS to fit the viewport, so a shape keeps
 * its position however large the window is, and the exported image is exactly
 * the screenshot plus the marks at full quality.
 *
 * Redrawing everything from the list on each change makes undo trivial — drop
 * the last shape — and is cheap: a markup is tens of shapes, not thousands.
 *
 * Kept free of React so it can be rendered and checked on its own.
 */

export const TOOLS = [
  { id: "pen", label: "Pen", hint: "Draw freely" },
  { id: "arrow", label: "Arrow", hint: "Point at something" },
  { id: "rect", label: "Box", hint: "Draw a box around something" },
  { id: "text", label: "Text", hint: "Click to add a note" },
];

// Red first: "this is what's wrong" is what markup is overwhelmingly for.
// Hex rather than CSS variables because they are drawn onto a canvas, where
// var() does not resolve — values match Warning-Base, Accent-Base and
// Primary-Dark in Theme.css.
export const COLORS = [
  { id: "red", value: "#b9261a", label: "Red" },
  { id: "yellow", value: "#f2be42", label: "Yellow" },
  { id: "teal", value: "#336f8a", label: "Teal" },
];

/**
 * Line weight, arrowhead and text size, scaled to the image. A capture can be
 * 800 or 1600px wide; without this, marks would look hairline on one and
 * clumsy on the other.
 */
export function metrics(imageWidth) {
  const unit = Math.max(1, imageWidth / 800);
  return { stroke: 4 * unit, head: 16 * unit, font: 18 * unit, pad: 7 * unit, radius: 5 * unit };
}

/** Readable text on a coloured label: dark on yellow, white on red and teal. */
function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#171717" : "#ffffff";
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawShape(ctx, shape, m) {
  ctx.save();
  ctx.strokeStyle = shape.color;
  ctx.fillStyle = shape.color;
  ctx.lineWidth = m.stroke;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (shape.type === "pen" && shape.points.length) {
    const p = shape.points;
    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    if (p.length === 1) {
      ctx.lineTo(p[0].x + 0.1, p[0].y); // a tap still leaves a dot
    }
    // Curve through the midpoints: smooths the jitter of a mouse or finger
    // without lagging behind the pointer the way heavier smoothing does.
    for (let i = 1; i < p.length - 1; i += 1) {
      const mx = (p[i].x + p[i + 1].x) / 2;
      const my = (p[i].y + p[i + 1].y) / 2;
      ctx.quadraticCurveTo(p[i].x, p[i].y, mx, my);
    }
    if (p.length > 1) ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
    ctx.stroke();
  }

  if (shape.type === "rect") {
    const x = Math.min(shape.x1, shape.x2);
    const y = Math.min(shape.y1, shape.y2);
    ctx.strokeRect(x, y, Math.abs(shape.x2 - shape.x1), Math.abs(shape.y2 - shape.y1));
  }

  if (shape.type === "arrow") {
    const { x1, y1, x2, y2 } = shape;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    // Stop the shaft short of the tip so the round cap does not poke through.
    const shaftEnd = { x: x2 - Math.cos(angle) * m.head * 0.6, y: y2 - Math.sin(angle) * m.head * 0.6 };
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(shaftEnd.x, shaftEnd.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - m.head * Math.cos(angle - Math.PI / 7), y2 - m.head * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(x2 - m.head * Math.cos(angle + Math.PI / 7), y2 - m.head * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  }

  if (shape.type === "text" && shape.text) {
    // A solid label rather than bare text: a note has to stay legible on any
    // screenshot, light or dark, busy or plain.
    ctx.font = `600 ${m.font}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = "top";
    const lines = String(shape.text).split("\n");
    const lineHeight = m.font * 1.3;
    const width = Math.max(...lines.map((l) => ctx.measureText(l).width));
    roundedRect(ctx, shape.x, shape.y, width + m.pad * 2, lines.length * lineHeight + m.pad * 1.6, m.radius);
    ctx.fill();
    ctx.fillStyle = inkOn(shape.color);
    lines.forEach((line, i) => ctx.fillText(line, shape.x + m.pad, shape.y + m.pad * 0.8 + i * lineHeight));
  }

  ctx.restore();
}

/** The whole picture: screenshot, finished marks, and the one being drawn. */
export function render(ctx, image, shapes, draft) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(image, 0, 0);
  const m = metrics(image.naturalWidth || image.width);
  for (const shape of shapes) drawShape(ctx, shape, m);
  if (draft) drawShape(ctx, draft, m);
}

/**
 * A drag too short to have been meant — a click that wobbled — should not
 * leave a stray dot of a box or a zero-length arrow behind.
 */
export function isMeaningful(shape, imageWidth) {
  const min = Math.max(4, imageWidth / 200);
  if (shape.type === "rect" || shape.type === "arrow") {
    return Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1) >= min;
  }
  if (shape.type === "text") return !!shape.text?.trim();
  return true;
}
