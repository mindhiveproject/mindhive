import useTranslation from "next-translate/useTranslation";

import IconButton from "../../../../DesignSystem/IconButton";
import { TASK_TYPE_COLORS } from "../../../../../lib/taskTypeColors";

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

// Stand-in for the between-subjects design in the Add a block list. The real
// block lives in the Study Flow tab; this card only sends people there. Its
// title is plain text (not a draggable node label) so it can't be dropped on
// the canvas from here.
export default function StudyFlowPointerCard({ title, onOpenStudyFlow }) {
  const { t } = useTranslation("builder");
  const accent = TASK_TYPE_COLORS.DESIGN;

  return (
    <div className="blockCard" style={{ "--block-accent": accent }}>
      <div className="blockCardAccent" />
      <div className="blockCardBody">
        <div className="blockCardTitle">
          <div className="node-type-label">{title}</div>
          <p className="blockCardHint">
            {t(
              "selector.studyDesign.pointerHint",
              {},
              { default: "Add it from the Study Flow tab" }
            )}
          </p>
        </div>
        <div className="blockCardActions">
          <IconButton
            variant="filled"
            ariaLabel={t(
              "selector.studyDesign.openStudyFlowAria",
              {},
              {
                default: "Go to Study Flow",
              }
            )}
            style={{
              background: accent,
              backgroundColor: accent,
              color: "#FFFFFF",
            }}
            icon={
              <MediumIcon src="/assets/icons/builder/medium-add.svg" />
            }
            onClick={onOpenStudyFlow}
          />
        </div>
      </div>
    </div>
  );
}
