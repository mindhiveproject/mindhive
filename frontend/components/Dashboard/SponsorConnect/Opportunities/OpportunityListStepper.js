import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Chip from "../../../DesignSystem/Chip";
import InfoTooltip from "../../../DesignSystem/InfoTooltip";
import { resolveOpportunityListStepper } from "../../../../lib/opportunityListStepper";

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
  visible: "Visible in class network",
  visibleNone: "Not visible in any class network",
  visibleOne: "Visible in 1 class network",
  visibleMany: "Visible in {{count}} class networks",
  preSelected: "Pre-selected",
  matching: "Matching",
  awaitingMatching: "Awaiting matching",
  waitingForms: "Waiting for form to be filled",
  formsProgress: "Forms {{done}}/{{total}}",
  formFilled: "Form filled",
  matched: "Matched",
};

const CHIP_SIZE = {
  fontSize: "12px",
  height: "28px",
  paddingTop: "4px",
  paddingBottom: "4px",
  paddingLeft: "10px",
  paddingRight: "10px",
};

/**
 * Tone per step identity (wired by step.key / labelKey).
 * Visual state (active / done / pending) layers on top in resolveStepChipStyle.
 */
const STEP_CHIP_STYLE = {
  draft: {
    ...CHIP_SIZE,
    background: "#f3f3f3",
    backgroundColor: "#f3f3f3",
    border: "1px solid #a1a1a1",
    color: "#5f6871",
  },
  visible: {
    ...CHIP_SIZE,
    background: "#def8fb",
    backgroundColor: "#def8fb",
    border: "1px solid #b5e4ea",
    color: "var(--MH-Theme-Primary-Dark, #336f8a)",
  },
  visibleNone: {
    ...CHIP_SIZE,
    background: "#f0f4f6",
    backgroundColor: "#f0f4f6",
    border: "1px solid #d7dee3",
    color: "var(--MH-Theme-Neutrals-Dark, #5f6871)",
  },
  visibleOne: {
    ...CHIP_SIZE,
    background: "#def8fb",
    backgroundColor: "#def8fb",
    border: "1px solid #b5e4ea",
    color: "var(--MH-Theme-Primary-Dark, #336f8a)",
  },
  visibleMany: {
    ...CHIP_SIZE,
    background: "#def8fb",
    backgroundColor: "#def8fb",
    border: "1px solid #b5e4ea",
    color: "var(--MH-Theme-Primary-Dark, #336f8a)",
  },
  preSelected: {
    ...CHIP_SIZE,
    background: "#eef5f9",
    backgroundColor: "#eef5f9",
    border: "1px solid #b8d4e3",
    color: "var(--MH-Theme-Primary-Dark, #336f8a)",
  },
  formsMatching: {
    ...CHIP_SIZE,
    background: "#fdf6e8",
    backgroundColor: "#fdf6e8",
    border: "1px solid #e8d4a8",
    color: "#8a6d3b",
  },
  formsProgress: {
    ...CHIP_SIZE,
    background: "#fdf6e8",
    backgroundColor: "#fdf6e8",
    border: "1px solid #e8d4a8",
    color: "#8a6d3b",
  },
  waitingForms: {
    ...CHIP_SIZE,
    background: "#fdf6e8",
    backgroundColor: "#fdf6e8",
    border: "1px solid #e8d4a8",
    color: "#8a6d3b",
  },
  awaitingMatching: {
    ...CHIP_SIZE,
    background: "#def8fb",
    backgroundColor: "#def8fb",
    border: "1px solid #b5e4ea",
    color: "var(--MH-Theme-Primary-Dark, #336f8a)",
  },
  matching: {
    ...CHIP_SIZE,
    background: "#f3f3f3",
    backgroundColor: "#f3f3f3",
    border: "1px solid #e6e6e6",
    color: "#a1a1a1",
  },
  formFilled: {
    ...CHIP_SIZE,
    background: "#e3f4ec",
    backgroundColor: "#e3f4ec",
    border: "1px solid #b8dcc8",
    color: "#1d6b3a",
  },
  matched: {
    ...CHIP_SIZE,
    background: "#e3f4ec",
    backgroundColor: "#e3f4ec",
    border: "1px solid #b8dcc8",
    color: "#1d6b3a",
  },
  // Visual-state fallbacks
  active: {
    ...CHIP_SIZE,
    background: "#def8fb",
    backgroundColor: "#def8fb",
    border: "1px solid #b5e4ea",
    color: "var(--MH-Theme-Primary-Dark, #336f8a)",
  },
  done: {
    ...CHIP_SIZE,
    background: "#e3f4ec",
    backgroundColor: "#e3f4ec",
    border: "1px solid #b8dcc8",
    color: "#1d6b3a",
  },
  pending: {
    ...CHIP_SIZE,
    background: "#f3f3f3",
    backgroundColor: "#f3f3f3",
    border: "1px solid #e6e6e6",
    color: "#a1a1a1",
  },
};

function stepStyleKey(step) {
  if (step.labelKey && STEP_CHIP_STYLE[step.labelKey]) {
    return step.labelKey;
  }
  if (step.key && STEP_CHIP_STYLE[step.key]) {
    return step.key;
  }
  return step.visual || "pending";
}

function resolveStepChipStyle(step) {
  const visual = step.visual || "pending";

  if (visual === "pending") {
    return STEP_CHIP_STYLE.pending;
  }
  if (visual === "done") {
    return STEP_CHIP_STYLE.done;
  }

  // Active (or sole current) step: use the step's own tone.
  return STEP_CHIP_STYLE[stepStyleKey(step)] || STEP_CHIP_STYLE.active;
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

function StepChip({ step, label }) {
  const visual = step.visual || "pending";
  const style = resolveStepChipStyle(step);

  return (
    <Chip
      label={label}
      selected={visual === "active"}
      disabled={visual === "pending"}
      style={style}
    />
  );
}

/**
 * Compact inline stepper under an opportunity title on the sponsor list.
 */
export default function OpportunityListStepper({
  status,
  proposalData,
  rounds,
  networks = [],
}) {
  const { t } = useTranslation("connect");
  const networkCount = networks.length;
  const { steps } = resolveOpportunityListStepper({
    status,
    proposalData,
    rounds,
    networkCount,
  });

  return (
    <Track
      aria-label={t("myOpportunitiesList.stepper.ariaLabel", {}, {
        default: "Opportunity progress",
      })}
    >
      {steps.map((step, index) => {
        const label = stepDisplayLabel(step, t);
        const chip = <StepChip step={step} label={label} />;

        return (
          <StepItem key={step.key}>
            {index > 0 && (
              <Connector
                $done={
                  steps[index - 1].visual === "done" ||
                  steps[index - 1].visual === "active"
                }
                aria-hidden
              >
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
