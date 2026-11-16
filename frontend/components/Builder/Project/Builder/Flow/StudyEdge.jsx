import { createContext, memo, useContext } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../DesignSystem/Chip";
import { useCanvasActions } from "./CanvasActions";

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
  source,
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
  const actions = useCanvasActions();
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

  const removeLabel = t("canvas.deleteLink", {}, { default: "Delete link" });
  const settingsLabel = t("canvas.openConditionSettings", {}, {
    default: "Open the block's condition settings",
  });
  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={style} interactionWidth={24} />
      <EdgeLabelRenderer>
        <div
          className="studyEdgeLabel nodrag nopan"
          // the chip stays centred on the link; the delete button hangs below it
          style={{
            transform: `translate(-50%, ${condition ? "-16px" : "-50%"}) translate(${labelX}px, ${labelY}px)`,
          }}
          // moving from the link onto its label keeps the button
          onMouseEnter={() => ui.hoverEdge?.(id)}
          onMouseLeave={() => ui.unhoverEdge?.(id)}
        >
          {condition && (
            // opens the settings of the between-subjects block the link leaves
            <button
              type="button"
              className="studyEdgeCondition"
              title={settingsLabel}
              onClick={(event) => {
                event.stopPropagation();
                actions.openDesignSettings?.({ nodeId: source });
              }}
            >
              <Chip label={condition} variant="static" tone="neutral" truncate={false} />
            </button>
          )}
          {showRemove && (
            <button
              type="button"
              className="studyEdgeRemove"
              onClick={(event) => {
                event.stopPropagation();
                ui.removeEdge?.(id);
              }}
            >
              {removeLabel}
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
