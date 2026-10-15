import { useMutation } from "@apollo/client";
import { useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../../../../Mutations/Study";
import {
  buildDualWriteUpdate,
  readMilestoneStatus,
} from "../../../../../../lib/milestoneStatus";

import Button from "../../../../../DesignSystem/Button";
import Chip from "../../../../../DesignSystem/Chip";
import MessageCard from "../../../../../DesignSystem/MessageCard";
import Modal from "../../../../../DesignSystem/Modal";
import ToggleSwitch from "../../../../../DesignSystem/ToggleSwitch";
import DashboardAssetIcon from "../DashboardAssetIcon";
import {
  STATUS_ICON_SRC,
  canReopenMilestone,
  milestoneStatusLabel,
} from "../dashboardUtils";

// Teachers don't pick a status: once a student has submitted a milestone they
// can reopen it (back to IN_PROGRESS, comments closed). A study milestone is
// only submitted (locked) or not, so its one action unlocks the study.
export default function MilestoneStatusModal({
  open,
  onClose,
  data,
  milestone,
  stage,
  classId,
  status: displayStatus = "NOT_STARTED",
  initiallyOpen = false,
}) {
  const { t } = useTranslation("classes");
  const isStudy = milestone?.statusTarget === "study";
  const project = data?.project;
  const student = data?.username;
  const [isOpenNow, setIsOpenNow] = useState(Boolean(initiallyOpen));
  const [pending, setPending] = useState(null);
  const [failed, setFailed] = useState(false);

  // Writes keep the stored status; the dashboard may show a derived one.
  const storedStatus =
    readMilestoneStatus(project, milestone?.key, milestone ? [milestone] : [])
      ?.status || "NOT_STARTED";
  const canReopen = canReopenMilestone(displayStatus, isStudy);

  const refetchQueries = [
    { query: GET_STUDENTS_DASHBOARD_DATA, variables: { classId } },
  ];
  const [updateBoard] = useMutation(UPDATE_PROJECT_BOARD, { refetchQueries });
  const [updateStudy] = useMutation(UPDATE_STUDY, { refetchQueries });

  const save = async ({ status, open: openFlag }) => {
    if (milestone && data?.projectId) {
      await updateBoard({
        variables: {
          id: data.projectId,
          input: buildDualWriteUpdate(
            milestone,
            isStudy
              ? { status, openForParticipation: openFlag }
              : { status, openForComments: openFlag },
            project?.milestoneStatus || {}
          ),
        },
      });
    } else if (isStudy && project?.study?.id) {
      await updateStudy({
        variables: {
          id: project.study.id,
          input: {
            dataCollectionStatus: status,
            dataCollectionOpenForParticipation: openFlag,
          },
        },
      });
    }
  };

  const run = async (action, work) => {
    setPending(action);
    setFailed(false);
    try {
      await work();
      return true;
    } catch (error) {
      console.error("Error updating milestone status:", error);
      setFailed(true);
      return false;
    } finally {
      setPending(null);
    }
  };

  const toggleOpen = (next) =>
    run("toggle", async () => {
      await save({ status: storedStatus, open: next });
      setIsOpenNow(next);
    });

  const reopen = async () => {
    const ok = await run("reopen", () =>
      save({ status: "IN_PROGRESS", open: false })
    );
    if (ok) onClose?.();
  };

  const busy = Boolean(pending);
  const vars = {
    stage,
    student:
      student || t("dashboard.theStudent", {}, { default: "the student" }),
  };

  const body = (
    <>
      <div className="milestoneStatusRow">
        <Chip
          variant="static"
          tone="neutral"
          label={milestoneStatusLabel(displayStatus, t, isStudy)}
          leading={
            <DashboardAssetIcon
              src={STATUS_ICON_SRC[displayStatus] || STATUS_ICON_SRC.NOT_STARTED}
              size={20}
            />
          }
        />
      </div>

      {canReopen ? (
        <>
          {isStudy ? null : (
            <ToggleSwitch
              checked={isOpenNow}
              onChange={toggleOpen}
              loading={pending === "toggle"}
              disabled={busy && pending !== "toggle"}
              label={t("dashboard.openForComments", {}, {
                default: "Open for comments",
              })}
            />
          )}
          <MessageCard
            variant="information"
            message={
              isStudy
                ? t("dashboard.unlockStudyExplainer", vars, {
                    default:
                      "{{student}}'s study is locked because they submitted it for data collection. Unlocking closes participation and lets them edit the study and submit it again.",
                  })
                : t("dashboard.reopenExplainer", vars, {
                    default:
                      "Reopening sends {{stage}} back to {{student}} as In progress and closes comments, so they can edit their cards and submit again.",
                  })
            }
          />
        </>
      ) : (
        <MessageCard
          variant="neutral"
          message={
            isStudy
              ? t("dashboard.studyNotSubmittedYet", vars, {
                  default:
                    "{{student}} hasn't submitted their study for data collection yet, so it's still editable.",
                })
              : t("dashboard.notSubmittedYet", vars, {
                  default:
                    "{{student}} hasn't submitted {{stage}} yet. Once they do, you can reopen it here for edits.",
                })
          }
        />
      )}

      {failed ? (
        <MessageCard
          variant="warning"
          message={t("dashboard.failedToUpdateStatusOrCards")}
        />
      ) : null}
    </>
  );

  const reopenLabel = isStudy
    ? t("dashboard.unlockStudy", {}, { default: "Unlock study" })
    : t("dashboard.reopenForEdits", {}, { default: "Reopen for edits" });

  const actions = canReopen ? (
    <>
      <Button variant="text" onClick={onClose} disabled={busy}>
        {t("dashboard.cancel", {}, { default: "Cancel" })}
      </Button>
      <Button variant="filled" onClick={reopen} disabled={busy}>
        {pending === "reopen"
          ? t("dashboard.reopening", {}, { default: "Reopening…" })
          : reopenLabel}
      </Button>
    </>
  ) : (
    <Button variant="filled" onClick={onClose}>
      {t("dashboard.close", {}, { default: "Close" })}
    </Button>
  );

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth={520}
      title={
        <StyledTitle>
          <span className="milestoneStatusTitle">{stage}</span>
          {data?.projectTitle ? (
            <span className="milestoneStatusSubtitle">
              {student ? `${student} · ` : ""}
              {data.projectTitle}
            </span>
          ) : null}
        </StyledTitle>
      }
      actions={actions}
    >
      <StyledBody>{body}</StyledBody>
    </Modal>
  );
}

const StyledTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  .milestoneStatusTitle {
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .milestoneStatusSubtitle {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;

  > .DesignSystem-MessageCard {
    align-self: stretch;
  }
`;
