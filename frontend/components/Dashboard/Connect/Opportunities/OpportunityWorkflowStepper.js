import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

const TRACK = styled.ol`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const StepItem = styled.li`
  display: flex;
  flex: 1 1 88px;
  min-width: 72px;
  max-width: 140px;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  padding: 0 4px 8px;

  &:not(:last-child)::after {
    content: "";
    position: absolute;
    top: 14px;
    left: calc(50% + 18px);
    width: calc(100% - 36px);
    height: 2px;
    background: ${({ $connectorDone }) =>
      $connectorDone ? "#b6dec7" : "#d3dae0"};
    z-index: 0;
  }

  @media (max-width: 520px) {
    flex: 1 1 calc(33% - 8px);
    max-width: none;

    &:not(:last-child)::after {
      display: none;
    }
  }
`;

const Circle = styled.span`
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  z-index: 1;
  background: ${({ $visual }) =>
    $visual === "done"
      ? "#1d6b3a"
      : $visual === "active"
      ? "#336f8a"
      : $visual === "waiting"
      ? "#eef5f9"
      : "#d3dae0"};
  color: ${({ $visual }) =>
    $visual === "pending" ? "#5f6871" : $visual === "waiting" ? "#336f8a" : "#ffffff"};
  border: 2px solid
    ${({ $visual }) =>
      $visual === "waiting" ? "#336f8a" : "transparent"};
`;

const StepLabel = styled.span`
  margin-top: 6px;
  font-size: 11px;
  font-weight: 600;
  color: ${({ $visual }) =>
    $visual === "pending" ? "#888" : "#171717"};
  line-height: 1.25;
`;

const RoleChip = styled.span`
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 100px;
  font-size: 10px;
  font-weight: 600;
  background: #f7f9f8;
  color: #5f6871;
  border: 1px solid #d3dae0;
`;

const ContextLine = styled.p`
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #5f6871;
`;

const STEPS = [
  { key: "submit", role: "sponsor" },
  { key: "preSelect", role: "teacher" },
  { key: "accept", role: "teacher" },
  { key: "scope", role: "sponsor" },
  { key: "publish", role: "teacher" },
];

const POST_PRESELECT = new Set([
  "pre_selected",
  "accepted",
  "published",
  "closed",
]);
const POST_ACCEPTED = new Set(["accepted", "published", "closed"]);

function isStepDone(index, status, scopeComplete) {
  switch (index) {
    case 0:
      return status !== "draft" && status !== "returned";
    case 1:
      return POST_PRESELECT.has(status);
    case 2:
      return POST_ACCEPTED.has(status);
    case 3:
      return scopeComplete || status === "published";
    case 4:
      return status === "published";
    default:
      return false;
  }
}

export function getActiveStepIndex(status, scopeComplete) {
  if (status === "draft" || status === "returned") return 0;
  if (status === "pending_review") return 1;
  if (status === "pre_selected") return 2;
  if (status === "accepted") return scopeComplete ? 4 : 3;
  if (status === "published" || status === "closed" || status === "archived") {
    return STEPS.length;
  }
  return -1;
}

function getStepVisual(index, activeIndex, stepRole, viewerRole, done) {
  if (done) return "done";
  if (activeIndex < 0) return "pending";
  if (index < activeIndex) return "done";
  if (index > activeIndex) return "pending";
  if (stepRole !== viewerRole) return "waiting";
  return "active";
}

function getContextKey(activeIndex, viewerRole, status) {
  if (status === "returned") {
    return viewerRole === "sponsor" ? "returnedRevise" : "waitingReturnedRevise";
  }
  if (status === "published") return "published";
  if (status === "closed") return "closed";
  if (status === "archived") return "archived";
  if (activeIndex < 0 || activeIndex >= STEPS.length) return "published";

  const step = STEPS[activeIndex];
  const isViewerTurn = step.role === viewerRole;

  if (activeIndex === 0) return "sponsorSubmit";
  if (activeIndex === 1) {
    return isViewerTurn ? "teacherPreSelect" : "waitingTeacherPreSelect";
  }
  if (activeIndex === 2) {
    return isViewerTurn ? "teacherAccept" : "waitingTeacherAccept";
  }
  if (activeIndex === 3) {
    return isViewerTurn ? "sponsorScope" : "waitingScope";
  }
  if (activeIndex === 4) {
    return isViewerTurn ? "teacherPublish" : "waitingTeacherPublish";
  }
  return "published";
}

const CONTEXT_DEFAULTS = {
  sponsorSubmit:
    "Submit your proposal when you're ready for teacher review.",
  returnedRevise:
    "A teacher returned your proposal — review their notes, make changes, then resubmit.",
  waitingReturnedRevise:
    "Waiting for the sponsor to revise and resubmit their returned proposal.",
  teacherPreSelect: "Review the proposal and pre-select this sponsor.",
  waitingTeacherPreSelect:
    "Waiting for a teacher to review and pre-select your proposal.",
  teacherAccept: "Review the proposal and accept it.",
  waitingTeacherAccept:
    "Waiting for a teacher to accept your proposal.",
  sponsorScope: "Complete the project scope below.",
  waitingScope: "Waiting for the sponsor to complete the project scope.",
  teacherPublish: "Review the scope and publish the opportunity.",
  waitingTeacherPublish:
    "Waiting for a teacher to publish your opportunity.",
  published: "This opportunity has been published for students.",
  closed: "This opportunity is closed.",
  archived: "This opportunity is archived.",
};

export default function OpportunityWorkflowStepper({
  status,
  scopeComplete,
  viewerRole,
}) {
  const { t } = useTranslation("connect");
  const activeIndex = getActiveStepIndex(status, scopeComplete);
  const contextKey = getContextKey(activeIndex, viewerRole, status);

  return (
    <div>
      <TRACK aria-label={t("opportunityEditor.workflow.title", {}, {
        default: "Opportunity review workflow",
      })}>
        {STEPS.map((step, index) => {
          const done = isStepDone(index, status, scopeComplete);
          const visual = getStepVisual(
            index,
            activeIndex,
            step.role,
            viewerRole,
            done,
          );
          const connectorDone =
            index < STEPS.length - 1 &&
            isStepDone(index, status, scopeComplete);

          return (
            <StepItem
              key={step.key}
              $connectorDone={connectorDone}
              aria-current={visual === "active" ? "step" : undefined}
            >
              <Circle
                $visual={visual}
                aria-label={t(`opportunityEditor.workflow.status.${visual}`, {}, {
                  default:
                    visual === "done"
                      ? "Completed"
                      : visual === "active"
                      ? "Current step"
                      : visual === "waiting"
                      ? "Waiting on other party"
                      : "Upcoming",
                })}
              >
                {visual === "done" ? "✓" : index + 1}
              </Circle>
              <StepLabel $visual={visual}>
                {t(`opportunityEditor.workflow.steps.${step.key}`, {}, {
                  default: step.key,
                })}
              </StepLabel>
              <RoleChip>
                {t(`opportunityEditor.workflow.roles.${step.role}`, {}, {
                  default: step.role === "sponsor" ? "Sponsor" : "Teacher",
                })}
              </RoleChip>
            </StepItem>
          );
        })}
      </TRACK>
      <ContextLine>
        {t(`opportunityEditor.workflow.context.${contextKey}`, {}, {
          default: CONTEXT_DEFAULTS[contextKey] || "",
        })}
      </ContextLine>
    </div>
  );
}
