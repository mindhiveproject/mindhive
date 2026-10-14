import { useMutation } from "@apollo/client";
import { useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";
import { buildDualWriteUpdate } from "../../../../../../lib/milestoneStatus";
import Button from "../../../../../DesignSystem/Button";
import Chip from "../../../../../DesignSystem/Chip";
import MessageCard from "../../../../../DesignSystem/MessageCard";
import Modal from "../../../../../DesignSystem/Modal";
import DashboardAssetIcon from "../DashboardAssetIcon";
import {
  STATUS_ICON_SRC,
  canReopenMilestone,
  milestoneStatusLabel,
} from "../dashboardUtils";

// Bulk version of MilestoneStatusModal for one milestone: reopens (or, for a
// study, unlocks) it for every selected student who has submitted it, and lists
// the rest as unchanged so the teacher sees exactly who is affected.
export const SelectedStudentsModal = ({
  isOpen,
  onClose,
  selectedStudents,
  classId,
  milestone,
}) => {
  const { t } = useTranslation("classes");
  const [failed, setFailed] = useState(false);

  const isStudy = milestone?.statusTarget === "study";
  const stage = milestone?.title || milestone?.key || "";
  const statusOf = (student) =>
    student?.milestones?.[milestone?.key]?.status || "NOT_STARTED";
  const eligible = selectedStudents.filter(
    (student) =>
      student.projectId && canReopenMilestone(statusOf(student), isStudy)
  );
  const eligibleKeys = new Set(eligible);
  const unchanged = selectedStudents.filter(
    (student) => !eligibleKeys.has(student)
  );

  const [updateProject, { loading }] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [{ query: GET_STUDENTS_DASHBOARD_DATA, variables: { classId } }],
  });

  const close = () => {
    setFailed(false);
    onClose();
  };

  const reopenAll = async () => {
    setFailed(false);
    try {
      await Promise.all(
        eligible.map((student) =>
          updateProject({
            variables: {
              id: student.projectId,
              input: buildDualWriteUpdate(
                milestone,
                isStudy
                  ? { status: "IN_PROGRESS", openForParticipation: false }
                  : { status: "IN_PROGRESS", openForComments: false },
                student.project?.milestoneStatus || {}
              ),
            },
          })
        )
      );
      close();
    } catch (error) {
      console.error("Error reopening milestone:", error);
      setFailed(true);
    }
  };

  const count = eligible.length;

  const renderGroup = (students, heading) =>
    students.length ? (
      <section className="studentGroup">
        <h3>{heading}</h3>
        <ul className="studentList">
          {students.map((student) => {
            const status = statusOf(student);
            return (
              <li
                key={student.id || student.publicId || student.username}
                className="studentItem"
              >
                <span className="studentText">
                  <strong>{student.username}</strong>
                  <span>
                    {student.projectTitle ||
                      t("dashboard.none", {}, { default: "None" })}
                  </span>
                </span>
                {student.projectId ? (
                  <Chip
                    variant="static"
                    tone="neutral"
                    label={milestoneStatusLabel(status, t, isStudy)}
                    leading={
                      <DashboardAssetIcon
                        src={
                          STATUS_ICON_SRC[status] || STATUS_ICON_SRC.NOT_STARTED
                        }
                        size={20}
                      />
                    }
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    ) : null;
  const reopenLabel = isStudy
    ? t("dashboard.unlockStudies", { count }, {
        default: "Unlock {{count}} studies",
      })
    : t("dashboard.reopenForCount", { count }, {
        default: "Reopen for {{count}} students",
      });

  return (
    <Modal
      open={isOpen}
      onClose={loading ? undefined : close}
      maxWidth={640}
      title={
        <StyledTitle>
          <span className="bulkTitle">{stage}</span>
          <span className="bulkSubtitle">
            {t(
              "dashboard.manageSelectedStudentsInfo",
              { count: selectedStudents.length },
              { default: "Manage {{count}} selected student(s)" }
            )}
          </span>
        </StyledTitle>
      }
      actions={
        count > 0 ? (
          <>
            <Button variant="text" onClick={close} disabled={loading}>
              {t("dashboard.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button variant="filled" onClick={reopenAll} disabled={loading}>
              {loading
                ? t("dashboard.reopening", {}, { default: "Reopening…" })
                : reopenLabel}
            </Button>
          </>
        ) : (
          <Button variant="filled" onClick={close}>
            {t("dashboard.close", {}, { default: "Close" })}
          </Button>
        )
      }
    >
      <StyledBulkBody>
        {count > 0 ? (
          <MessageCard
            variant="information"
            message={
              isStudy
                ? t("dashboard.bulkUnlockStudyExplainer", { count }, {
                    default:
                      "Unlocking closes participation and lets these {{count}} students edit their study and submit it again.",
                  })
                : t("dashboard.bulkReopenExplainer", { stage, count }, {
                    default:
                      "Reopening sends {{stage}} back to these {{count}} students as In progress and closes comments, so they can edit their cards and submit again.",
                  })
            }
          />
        ) : null}

        {failed ? (
          <MessageCard
            variant="warning"
            message={t("dashboard.failedToUpdateStatus", {}, {
              default: "Error: Failed to update status. Please try again.",
            })}
          />
        ) : null}

        {renderGroup(
          eligible,
          isStudy
            ? t("dashboard.bulkWillUnlock", { count }, {
                default: "Will be unlocked ({{count}})",
              })
            : t("dashboard.bulkWillReopen", { count }, {
                default: "Will be reopened ({{count}})",
              })
        )}
        {renderGroup(
          unchanged,
          t("dashboard.bulkNoChange", { count: unchanged.length }, {
            default: "No change, not submitted ({{count}})",
          })
        )}
      </StyledBulkBody>
    </Modal>
  );
};

const StyledTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  .bulkTitle {
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .bulkSubtitle {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

const StyledBulkBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  p {
    margin: 0;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .studentGroup h3 {
    margin: 4px 0 8px;
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .studentList {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .studentItem {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 8px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
  }

  .studentText {
    display: flex;
    flex-direction: column;
    min-width: 0;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

    strong {
      color: var(--MH-Theme-Neutrals-Black, #171717);
    }

    span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
`;
