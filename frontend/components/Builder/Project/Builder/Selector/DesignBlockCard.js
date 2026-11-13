import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import Tooltip from "../../../../DesignSystem/Tooltip";
import { TASK_TYPE_COLORS } from "../../../../../lib/taskTypeColors";
import { NodesTypesContainer } from "../Diagram/nodes-types-container/NodesTypesContainer";
import { NodeTypeLabel } from "../Diagram/node-type-label/NodeTypeLabel";

const ICON_MASK = (src) => ({
  display: "block",
  width: 24,
  height: 24,
  backgroundColor: "currentColor",
  WebkitMaskImage: `url(${src})`,
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskImage: `url(${src})`,
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
});

function MediumIcon({ src }) {
  return <span aria-hidden style={ICON_MASK(src)} />;
}

// The between-subjects design block, offered at the top of the Study Flow tab.
// Drag the label onto the canvas or press add to drop it at a random spot.
export default function DesignBlockCard({
  addFunctions,
  isCanvasLocked = false,
}) {
  const { t } = useTranslation("builder");
  const accent = TASK_TYPE_COLORS.DESIGN;
  const name = t(
    "selector.studyDesign.betweenSubjects",
    {},
    { default: "Between-subjects design" }
  );

  return (
    <div className="editPane studyFlowDesign">
      <p className="studyFlowDesignDescription">
        {t(
          "selector.studyDesign.description",
          {},
          {
            default:
              "Add block to create a difference to the design in your study",
          }
        )}
      </p>
      <div className="blockCard" style={{ "--block-accent": accent }}>
        <div className="blockCardAccent" />
        <div className="blockCardBody">
          <div className="blockCardTitle movableCard">
            <NodesTypesContainer>
              <NodeTypeLabel
                model={{ type: "design", name }}
                name={name}
                disabled={isCanvasLocked}
              />
            </NodesTypesContainer>
          </div>
          <div className="blockCardActions">
            <Tooltip
              content={t(
                "selector.lockedAddHint",
                {},
                {
                  default:
                    "This study is locked. Ask your teacher to reopen it to add blocks.",
                }
              )}
              disabled={!isCanvasLocked}
            >
              <Button
                variant="filled"
                disabled={isCanvasLocked}
                // Locked: fall back to the disabled grey, and let the hover
                // reach the tooltip's wrapper past the disabled button.
                style={
                  isCanvasLocked
                    ? { pointerEvents: "none" }
                    : {
                        background: accent,
                        backgroundColor: accent,
                        color: "#FFFFFF",
                      }
                }
                leadingIcon={
                  <MediumIcon src="/assets/icons/builder/medium-add.svg" />
                }
                onClick={() => addFunctions?.addDesignToCanvas({ name })}
              >
                {t(
                  "selector.studyDesign.addToCanvas",
                  {},
                  { default: "Add to canvas" }
                )}
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
