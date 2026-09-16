import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";

import { TOOLS, COLORS, metrics, render, isMeaningful } from "../../../lib/annotate";
import { isolateFromPage } from "../../../lib/isolateFromPage";

/**
 * Draw on a screenshot: pen, arrow, box and text, in three colours, with undo.
 *
 * Full screen on purpose. A 1600px capture drawn inside the 540px filing panel
 * would be too small to point at anything precisely.
 *
 * The result is a flattened image — the screenshot with the marks burned in —
 * handed back as a File, plus the shape list so an unsubmitted markup can be
 * reopened and edited. Because the output is just an image, everything
 * downstream (upload, the Notion mirror, the 90-day prune) needs no change.
 *
 * Props
 *   source        File | Blob | URL of the screenshot to draw on
 *   initialShapes shapes to start from, when reopening an unsubmitted markup
 *   withNote      show a note field (the ticket page's annotations use one;
 *                 filing already has its own description)
 *   onDone(file, shapes, note)
 *   onCancel()
 */
export default function ScreenshotAnnotator({
  source,
  initialShapes = [],
  withNote = false,
  title = "Mark up the screenshot",
  onDone,
  onCancel,
}) {
  const overlayRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const textRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const [shapes, setShapes] = useState(initialShapes);
  const [draft, setDraft] = useState(null);
  const [textAt, setTextAt] = useState(null); // { x, y, value } in image space
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // ---- load the screenshot -------------------------------------------------
  useEffect(() => {
    let objectUrl = null;
    const image = new Image();
    // Needed for a screenshot served from Keystone on another origin: without
    // it the canvas is "tainted" and refuses to export. Keystone sends the
    // matching Access-Control-Allow-Origin for the frontend.
    image.crossOrigin = "anonymous";
    image.onload = () => {
      imageRef.current = image;
      const canvas = canvasRef.current;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      setReady(true);
    };
    image.onerror = () => setLoadError("The screenshot could not be loaded.");
    if (typeof source === "string") {
      image.src = source;
    } else if (source) {
      objectUrl = URL.createObjectURL(source);
      image.src = objectUrl;
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  // ---- redraw whenever the picture changes ---------------------------------
  useEffect(() => {
    if (!ready) return;
    render(canvasRef.current.getContext("2d"), imageRef.current, shapes, draft);
  }, [ready, shapes, draft]);

  useEffect(() => {
    if (textAt) textRef.current?.focus();
  }, [textAt]);

  // Take focus on open, so Escape and ⌘Z work straight away rather than going
  // to the button that opened the editor. The canvas is not focusable, so
  // clicks on it leave focus here and the shortcuts keep working.
  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  /** Pointer position in the screenshot's own pixels, whatever its display size. */
  const toImage = useCallback((event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  }, []);

  const displayScale = () => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getBoundingClientRect().width / canvas.width : 1;
  };

  // ---- drawing -------------------------------------------------------------
  const commitText = () => {
    if (textAt && textAt.value.trim()) {
      setShapes((all) => [...all, { type: "text", color, x: textAt.x, y: textAt.y, text: textAt.value }]);
    }
    setTextAt(null);
  };

  const onPointerDown = (event) => {
    if (!ready || event.button > 0) return;
    const at = toImage(event);
    if (tool === "text") {
      // A click elsewhere while typing commits the note, then starts a new one.
      if (textAt) commitText();
      setTextAt({ x: at.x, y: at.y, value: "" });
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    if (tool === "pen") setDraft({ type: "pen", color, points: [at] });
    else setDraft({ type: tool, color, x1: at.x, y1: at.y, x2: at.x, y2: at.y });
  };

  const onPointerMove = (event) => {
    if (!draft) return;
    const at = toImage(event);
    setDraft((current) =>
      current.type === "pen"
        ? { ...current, points: [...current.points, at] }
        : { ...current, x2: at.x, y2: at.y }
    );
  };

  const onPointerUp = () => {
    if (!draft) return;
    if (isMeaningful(draft, canvasRef.current.width)) setShapes((all) => [...all, draft]);
    setDraft(null);
  };

  const undo = useCallback(() => {
    if (textAt) {
      setTextAt(null);
      return;
    }
    setShapes((all) => all.slice(0, -1));
  }, [textAt]);

  // ---- keyboard ------------------------------------------------------------
  const onKeyDown = (event) => {
    // Kept inside the editor: a page modal underneath closes on Escape too.
    if (event.key === "Escape") {
      event.stopPropagation();
      if (textAt) setTextAt(null);
      else onCancel();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !textAt) {
      event.preventDefault();
      undo();
    }
  };

  // ---- finish --------------------------------------------------------------
  const done = async () => {
    if (!ready || saving) return;
    setSaving(true);
    // Fold in a note still being typed, then draw one last time without the
    // draft so the exported image is exactly what is on screen.
    const finalShapes =
      textAt && textAt.value.trim()
        ? [...shapes, { type: "text", color, x: textAt.x, y: textAt.y, text: textAt.value }]
        : shapes;
    const canvas = canvasRef.current;
    render(canvas.getContext("2d"), imageRef.current, finalShapes, null);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    setSaving(false);
    if (!blob) {
      setLoadError("The marked-up screenshot could not be exported.");
      return;
    }
    const file = new File([blob], `annotated-${Date.now()}.jpg`, { type: "image/jpeg" });
    onDone(file, finalShapes, note.trim());
  };

  const m = ready ? metrics(canvasRef.current.width) : null;

  if (typeof document === "undefined") return null;

  // Rendered into <body>, not where it is used, as DesignSystem/Modal is. On
  // the ticket page the editor sits inside the dashboard's content column,
  // whose stacking context is below the sticky side menu — and a z-index only
  // competes within its own context, so however high this one was set, the
  // menu was drawn over it. React events still bubble through the component
  // tree as before; only the DOM position changes.
  return createPortal(
    <Overlay
      ref={overlayRef}
      {...isolateFromPage}
      data-mh-ticket-ui="true"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      <Toolbar>
        <ToolbarTitle>{title}</ToolbarTitle>
        <Group role="radiogroup" aria-label="Tool">
          {TOOLS.map((t) => (
            <ToolButton
              key={t.id}
              type="button"
              role="radio"
              aria-checked={tool === t.id}
              data-active={tool === t.id}
              title={t.hint}
              onClick={() => {
                if (textAt) commitText();
                setTool(t.id);
              }}
            >
              {t.label}
            </ToolButton>
          ))}
        </Group>
        <Group role="radiogroup" aria-label="Colour">
          {COLORS.map((c) => (
            <Swatch
              key={c.id}
              type="button"
              role="radio"
              aria-checked={color === c.value}
              aria-label={c.label}
              title={c.label}
              data-active={color === c.value}
              style={{ background: c.value }}
              onClick={() => setColor(c.value)}
            />
          ))}
        </Group>
        <Group>
          <PlainButton type="button" onClick={undo} disabled={!shapes.length && !textAt} title="Undo (⌘Z / Ctrl+Z)">
            Undo
          </PlainButton>
          <PlainButton
            type="button"
            onClick={() => {
              setShapes([]);
              setTextAt(null);
            }}
            disabled={!shapes.length && !textAt}
          >
            Clear
          </PlainButton>
        </Group>
        <Spacer />
        <PlainButton type="button" onClick={onCancel}>
          Cancel
        </PlainButton>
        <DoneButton type="button" onClick={done} disabled={!ready || saving}>
          {saving ? "Saving…" : "Done"}
        </DoneButton>
      </Toolbar>

      <StageArea>
        {loadError && <ErrorText role="alert">{loadError}</ErrorText>}
        <Stage>
          <Canvas
            ref={canvasRef}
            data-tool={tool}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="Screenshot — draw on it with the selected tool"
          />
          {textAt && m && (
            <TextField
              ref={textRef}
              value={textAt.value}
              rows={Math.max(1, textAt.value.split("\n").length)}
              placeholder="Type a note, then Enter"
              style={{
                left: textAt.x * displayScale(),
                top: textAt.y * displayScale(),
                fontSize: Math.max(12, m.font * displayScale()),
                color,
              }}
              onChange={(event) => setTextAt({ ...textAt, value: event.target.value })}
              onKeyDown={(event) => {
                // Enter commits; Shift+Enter is a new line.
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  commitText();
                }
              }}
              aria-label="Note text"
            />
          )}
        </Stage>
      </StageArea>

      {withNote && (
        <NoteBar>
          <label htmlFor="mh-annotation-note">Note about this markup</label>
          <input
            id="mh-annotation-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional — e.g. “Spacing between cards should be 16px”"
          />
        </NoteBar>
      )}
    </Overlay>,
    document.body
  );
}

/* --- styles ------------------------------------------------------------- */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000; /* above the filing panel (9999) */
  display: flex;
  flex-direction: column;
  background: rgba(23, 23, 23, 0.92);
  outline: none;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 20px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  box-shadow: var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0, 0, 0, 0.1));
`;

const ToolbarTitle = styled.p`
  margin: 0 8px 0 0;
  font: var(--MH-Type-Title-Small);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: 12px;
  border-right: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
`;

const ToolButton = styled.button`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: none;
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  cursor: pointer;

  &:hover {
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }
  &[data-active="true"] {
    background: var(--MH-Theme-Primary-Light, #def8fb);
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

const Swatch = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 3px solid var(--MH-Theme-Neutrals-White, #ffffff);
  box-shadow: 0 0 0 1px var(--MH-Theme-Neutrals-Light, #e6e6e6);
  cursor: pointer;

  &[data-active="true"] {
    box-shadow: 0 0 0 2px var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const PlainButton = styled.button`
  padding: 6px 10px;
  border: none;
  background: none;
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
  &:hover:not(:disabled) {
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const Spacer = styled.span`
  flex: 1;
`;

const DoneButton = styled.button`
  padding: 8px 20px;
  border-radius: 100px;
  border: none;
  background: var(--MH-Theme-Primary-Dark, #336f8a);
  color: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Label-Base);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const StageArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
`;

/* Hugs the canvas, so the text field can be positioned in the canvas's own
   coordinates. */
const Stage = styled.div`
  position: relative;
  display: inline-block;
  line-height: 0;
`;

const Canvas = styled.canvas`
  display: block;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 170px);
  border-radius: 6px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  /* Keeps a finger drawing a line from scrolling the page instead. */
  touch-action: none;
  cursor: crosshair;

  &[data-tool="text"] {
    cursor: text;
  }
`;

const TextField = styled.textarea`
  position: absolute;
  min-width: 180px;
  padding: 4px 6px;
  border: 2px dashed currentColor;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.95);
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  line-height: 1.3;
  resize: none;
  outline: none;
`;

const NoteBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);

  label {
    font: var(--MH-Type-Label-Base);
    white-space: nowrap;
  }
  input {
    flex: 1;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    font: var(--MH-Type-Body-Base);
  }
`;

const ErrorText = styled.p`
  margin: 0 0 12px;
  color: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Body-Base);
  line-height: 1.4;
`;
