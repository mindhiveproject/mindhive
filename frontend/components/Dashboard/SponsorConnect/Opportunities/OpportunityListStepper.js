import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../DesignSystem/Chip";
import InfoTooltip from "../../../DesignSystem/InfoTooltip";
import { resolveOpportunityListStepper } from "../../../../lib/opportunityListStepper";
import {
  OPPORTUNITY_LIST_OPENABLE_STEP_KEYS,
  opportunityToneChipStyle,
} from "../../../../lib/opportunityStatusTones";

const Track = styled.ol`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: "Inter", sans-serif;
`;

const StepItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const Connector = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  margin: 0 2px;
  color: ${({ $done }) =>
    $done
      ? "var(--MH-Theme-Primary-Dark, #336f8a)"
      : "var(--MH-Theme-Neutrals-Light, #c5cdd3)"};

  svg {
    display: block;
    width: 14px;
    height: 14px;
  }
`;

const CONNECTOR_CHEVRON = (
  <svg viewBox="0 0 14 14" fill="none" aria-hidden>
    <path
      d="M5 2.5L9.5 7L5 11.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TooltipNetworkList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const LABEL_DEFAULTS = {
  draft: "Draft",
  inRevision: "In revision",
  returnedWithComments: "Returned with comments",
  submitted: "Submitted",
  preSelected: "Pre-selected",
  accepted: "Accepted",
  formsProgress: "Forms {{done}}/{{total}}",
  matching: "Matching",
  matched: "Matched",
};

function resolveStepChipStyle(step) {
  return opportunityToneChipStyle(step.visual || "pending");
}

function stepDisplayLabel(step, t) {
  const key = step.labelKey || step.key;
  const query = step.labelQuery || {};
  return t(`myOpportunitiesList.stepper.${key}`, query, {
    default: LABEL_DEFAULTS[key] || key,
  });
}

function visibilityTooltipContent(networks, t) {
  if (!networks.length) {
    return t("myOpportunitiesList.visibility.modalEmpty", {}, {
      default:
        "This opportunity is not associated with any class network yet.",
    });
  }

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        {t("myOpportunitiesList.visibility.modalTitle", {}, {
          default: "Visible in class networks",
        })}
      </div>
      <TooltipNetworkList>
        {networks.map((network) => (
          <li key={network.id}>{network.title}</li>
        ))}
      </TooltipNetworkList>
    </div>
  );
}

function StepChip({ step, label, onClick, openLabel }) {
  const visual = step.visual || "pending";
  const style = resolveStepChipStyle(step);
  const clickable = typeof onClick === "function";

  return (
    <Chip
      label={label}
      selected={visual === "action" || visual === "waiting"}
      disabled={visual === "pending" && !clickable}
      onClick={clickable ? onClick : undefined}
      ariaLabel={clickable && openLabel ? openLabel : undefined}
      title={clickable ? openLabel : undefined}
      style={style}
    />
  );
}

/**
 * Compact inline stepper under an opportunity title (list + editor).
 *
 * @param {object} props
 * @param {(step: object) => void} [props.onStepClick] — when set, draft /
 *   in-revision / returned chips call this to open the opportunity editor.
 */
export default function OpportunityListStepper({
  status,
  proposalData,
  rounds,
  reviewNotes,
  networks = [],
  videoFile = null,
  onStepClick,
}) {
  const { t } = useTranslation("connect");
  const { steps } = resolveOpportunityListStepper({
    status,
    proposalData,
    rounds,
    videoFile,
    reviewNotes,
  });

  const openLabel = t("myOpportunitiesList.stepper.openOpportunity", {}, {
    default: "Open opportunity",
  });

  return (
    <Track
      aria-label={t("myOpportunitiesList.stepper.ariaLabel", {}, {
        default: "Opportunity progress",
      })}
    >
      {steps.map((step, index) => {
        const label = stepDisplayLabel(step, t);
        const canOpen =
          typeof onStepClick === "function" &&
          OPPORTUNITY_LIST_OPENABLE_STEP_KEYS.has(step.key);
        const chip = (
          <StepChip
            step={step}
            label={label}
            openLabel={openLabel}
            onClick={canOpen ? () => onStepClick(step) : undefined}
          />
        );
        const prevVisual = index > 0 ? steps[index - 1].visual : null;
        const connectorDone =
          prevVisual === "done" ||
          prevVisual === "action" ||
          prevVisual === "waiting";

        return (
          <StepItem key={step.key}>
            {index > 0 && (
              <Connector $done={connectorDone} aria-hidden>
                {CONNECTOR_CHEVRON}
              </Connector>
            )}
            {step.isVisibility ? (
              <InfoTooltip
                content={visibilityTooltipContent(networks, t)}
                position="bottomLeft"
                portal
                wrapperStyle={{ maxWidth: "100%" }}
                tooltipStyle={{ maxWidth: "min(320px, 90vw)" }}
              >
                {chip}
              </InfoTooltip>
            ) : (
              chip
            )}
          </StepItem>
        );
      })}
    </Track>
  );
}
