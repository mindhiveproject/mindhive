import { createContext, memo, useContext } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import useTranslation from "next-translate/useTranslation";

// What a link needs from the canvas: which link the pointer is on, and how to
// remove one. Provided by StudyFlowCanvas.
const EdgeUi = createContext({});
export const EdgeUiProvider = EdgeUi.Provider;

/**
 * A link between two blocks. A link leaving a between-subjects block shows its
 * condition ("Group A · 50%") halfway along. Every link shows a remove button
 * there while the pointer is on it or it is selected (touch screens select it
 * with a tap).
 */
export const StudyEdge = memo(function StudyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected,
  data,
}) {
  const { t } = useTranslation("builder");
  const ui = useContext(EdgeUi);
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const showRemove = !ui.isLocked && (selected || ui.hoveredEdgeId === id);
  const condition = data?.condition;
  if (!condition && !showRemove) {
    return <BaseEdge path={path} markerEnd={markerEnd} style={style} interactionWidth={24} />;
  }

  const removeLabel = t("canvas.removeLink", {}, { default: "Remove link" });
  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={style} interactionWidth={24} />
      <EdgeLabelRenderer>
        <div
          className={`studyEdgeLabel nodrag nopan${selected ? " selected" : ""}${condition ? "" : " removeOnly"}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          // moving from the link onto its label keeps the button
          onMouseEnter={() => ui.hoverEdge?.(id)}
          onMouseLeave={() => ui.unhoverEdge?.(id)}
        >
          {condition && <span className="studyEdgeCondition">{condition}</span>}
          {showRemove && (
            <button
              type="button"
              className="studyEdgeRemove"
              title={removeLabel}
              aria-label={removeLabel}
              onClick={(event) => {
                event.stopPropagation();
                ui.removeEdge?.(id);
              }}
            >
              ×
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

export const edgeTypes = { study: StudyEdge };

/** "Group A · 50%" for a link leaving a design block's condition, else null. */
export function conditionText(sourceNode, sourceHandle) {
  if (sourceNode?.type !== "design") return null;
  const condition = (sourceNode.data?.conditions || []).find(
    (c) => c?.name === sourceHandle
  );
  if (!condition) return null;
  const label = condition.label || "";
  const probability = condition.probability;
  const hasProbability =
    probability !== undefined && probability !== null && probability !== "";
  return hasProbability ? `${label} · ${probability}%` : label || null;
}
