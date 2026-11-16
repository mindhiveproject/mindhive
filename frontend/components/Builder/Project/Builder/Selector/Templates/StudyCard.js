import useTranslation from "next-translate/useTranslation";

import { NodesTypesContainer } from "../../Diagram/nodes-types-container/NodesTypesContainer";
import { NodeTypeLabel } from "../../Diagram/node-type-label/NodeTypeLabel";
import Button from "../../../../../DesignSystem/Button";
import IconButton from "../../../../../DesignSystem/IconButton";
import Tooltip from "../../../../../DesignSystem/Tooltip";

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

export default function StudyCard({
  study,
  addFunctions,
  isCanvasLocked = false,
}) {
  const { t } = useTranslation("builder");
  const description = study?.description || study?.shortDescription || "";
  return (
    <div className="templateCard">
      <div className="templateCardBody movableCard">
        <NodesTypesContainer>
          <NodeTypeLabel
            model={{
              type: "study",
              diagram: study?.diagram,
            }}
            name={study?.title}
            disabled={isCanvasLocked}
            />
          </NodesTypesContainer>
          {description ? (
          <p className="templateCardDescription">{description}</p>
        ) : null}
      </div>
      <div className="templateCardActions">
        {study?.slug && (
          <IconButton
            variant="filled"
            style={{
              background: "#F3F3F3",
              backgroundColor: "#F3F3F3",
              color: "#171717",
            }}
            ariaLabel={t("selector.templates.openStudyAria", {}, {
              default: "Open study",
            })}
            icon={
              <MediumIcon src="/assets/icons/builder/medium-external-link.svg" />
            }
            onClick={() => {
              window.open(
                `/studies/${study.slug}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
          />
        )}
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
            // Lets the hover reach the tooltip's wrapper past the disabled
            // button.
            style={isCanvasLocked ? { pointerEvents: "none" } : undefined}
            onClick={() => {
              addFunctions.addStudyTemplateToCanvas({ study });
            }}
          >
            {t("selector.templates.tryThisFlow", {}, {
              default: "Try this flow",
            })}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
