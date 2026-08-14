import { useMutation } from "@apollo/client";
import { useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import {
  UPDATE_PROJECT_BOARD,
  UPDATE_PROPOSAL_CARD,
} from "../../../../../Mutations/Proposal";
import { buildDualWriteUpdate } from "../../../../../../lib/milestoneStatus";
import Button from "../../../../../DesignSystem/Button";
import DropdownSelect from "../../../../../DesignSystem/DropdownSelect";
import Modal from "../../../../../DesignSystem/Modal";

export const SelectedStudentsModal = ({
  isOpen,
  onClose,
  selectedStudents,
  classId,
  milestone,
}) => {
  const { t } = useTranslation("classes");
  const [status, setStatus] = useState("");
  const [openSetting, setOpenSetting] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const isStudy = milestone?.statusTarget === "study";
  const stageLabel = milestone?.title || milestone?.key || "";

  const [updateProject, { loading: boardLoading, error: boardError }] =
    useMutation(UPDATE_PROJECT_BOARD, {
      refetchQueries: [
        {
          query: GET_STUDENTS_DASHBOARD_DATA,
          variables: { classId },
        },
      ],
    });

  const [updateCard, { loading: cardLoading, error: cardError }] = useMutation(
    UPDATE_PROPOSAL_CARD,
    {
      refetchQueries: [
        {
          query: GET_STUDENTS_DASHBOARD_DATA,
          variables: { classId },
        },
      ],
    }
  );

  const resetAndClose = () => {
    setStatus("");
    setOpenSetting("");
    setConfirmModalOpen(false);
    onClose();
  };

  const applyUpdate = async (updateCardsToNeedsRevision = false) => {
    try {
      const validStudents = selectedStudents.filter(
        (student) => student.projectId
      );
      const openValue = openSetting === "true";

      await Promise.all(
        validStudents.map((student) =>
          updateProject({
            variables: {
              id: student.projectId,
              input: buildDualWriteUpdate(
                milestone,
                isStudy
                  ? {
                      status,
                      openForParticipation: openValue,
                    }
                  : {
                      status,
                      openForComments: openValue,
                    },
                student.project?.milestoneStatus || {}
              ),
            },
          })
        )
      );

      if (updateCardsToNeedsRevision) {
        for (const student of validStudents) {
          const sections = student.project?.sections || [];
          const cardsToUpdate = sections
            .flatMap((section) => section.cards || [])
            .filter((card) => card.settings?.includeInReport);

          await Promise.all(
            cardsToUpdate.map((card) =>
              updateCard({
                variables: {
                  where: { id: card.id },
                  data: {
                    settings: {
                      ...card.settings,
                      status: "Needs revision",
                    },
                  },
                },
              })
            )
          );
        }
      }

      resetAndClose();
    } catch (error) {
      console.error("Error updating milestone status:", error);
      alert(
        t("dashboard.failedToUpdateProjectStatus", {}, {
          default: "Failed to update project status. Please try again.",
        })
      );
    }
  };

  const handleUpdate = () => {
    if (
      !isStudy &&
      milestone?.actionCardType === "ACTION_PEER_FEEDBACK" &&
      status === "FINISHED"
    ) {
      setConfirmModalOpen(true);
    } else {
      applyUpdate(false);
    }
  };

  const statusOptions = [
    {
      value: "NOT_STARTED",
      label: t("dashboard.notStarted", {}, { default: "Not started" }),
    },
    {
      value: "IN_PROGRESS",
      label: t("dashboard.inProgress", {}, { default: "In progress" }),
    },
    {
      value: "SUBMITTED",
      label: t("dashboard.submitted", {}, { default: "Submitted" }),
    },
    {
      value: "FINISHED",
      label: isStudy
        ? t("dashboard.dataCollectionFinished", {}, {
            default: "Data collection is finished",
          })
        : t("dashboard.reviewFinished", {}, { default: "Review is finished" }),
    },
  ];

  const openOptions = [
    {
      value: "false",
      label: t("dashboard.notAllowed", {}, { default: "Not allowed" }),
    },
    {
      value: "true",
      label: t("dashboard.allowed", {}, { default: "Allowed" }),
    },
  ];

  const loading = boardLoading || cardLoading;
  const canSubmit =
    Boolean(status) &&
    (openSetting === "true" || openSetting === "false") &&
    selectedStudents.length > 0 &&
    Boolean(milestone?.key) &&
    !loading;

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        size="large"
        title={t("dashboard.selectedStudents", {}, {
          default: "Selected Students",
        })}
        actions={
          <>
            <Button variant="outline" onClick={onClose}>
              {t("dashboard.close", {}, { default: "Close" })}
            </Button>
            <Button
              variant="filled"
              onClick={handleUpdate}
              disabled={!canSubmit}
            >
              {loading
                ? t("dashboard.updating", {}, { default: "Updating..." })
                : t("dashboard.updateMilestoneStatus", {}, {
                    default: "Update status",
                  })}
            </Button>
          </>
        }
      >
        <StyledBulkBody>
          <p>
            {t(
              "dashboard.manageSelectedStudentsInfo",
              { count: selectedStudents.length },
              { default: "Manage {{count}} selected student(s)" }
            )}
          </p>
          {(boardError || cardError) && (
            <div className="error-message">
              {t("dashboard.failedToUpdateStatus", {}, {
                default: "Error: Failed to update status. Please try again.",
              })}
            </div>
          )}

          <div className="section">
            <h3>
              {t("dashboard.selectedStudents", {}, {
                default: "Selected Students",
              })}
            </h3>
            {selectedStudents.length === 0 ? (
              <p>
                {t("dashboard.noStudentsSelected", {}, {
                  default: "No students selected.",
                })}
              </p>
            ) : (
              <div className="student-list">
                {selectedStudents.map((student, index) => (
                  <div
                    key={student.id || student.publicId || student.username}
                    className="student-item"
                  >
                    <span>
                      <strong>
                        {index + 1}. {student.username}
                      </strong>
                    </span>
                    <span>
                      {t(
                        "dashboard.projectLabel",
                        {
                          project:
                            student.projectTitle ||
                            t("dashboard.none", {}, { default: "None" }),
                        },
                        { default: "Project: {{project}}" }
                      )}
                    </span>
                    <span>
                      {t(
                        "dashboard.studyLabel",
                        {
                          study:
                            student.studyTitle ||
                            t("dashboard.none", {}, { default: "None" }),
                        },
                        { default: "Study: {{study}}" }
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="section">
            {milestone?.key ? (
              <>
                <h3>
                  {t(
                    "dashboard.bulkUpdateMilestone",
                    { stage: stageLabel },
                    { default: "Update {{stage}} for selected students" }
                  )}
                </h3>
                <label className="fieldLabel">
                  {t("dashboard.status", {}, { default: "Status" })}
                </label>
                <DropdownSelect
                  value={status}
                  onChange={setStatus}
                  options={statusOptions}
                  placeholder={t("dashboard.selectProjectStatus", {}, {
                    default: "Select a project status",
                  })}
                  ariaLabel={t("dashboard.status", {}, { default: "Status" })}
                />
                <label className="fieldLabel">
                  {isStudy
                    ? t("dashboard.participationSetting", {}, {
                        default: "Open for participation",
                      })
                    : t("dashboard.openSetting", {}, {
                        default: "Open for comments",
                      })}
                </label>
                <DropdownSelect
                  value={openSetting}
                  onChange={setOpenSetting}
                  options={openOptions}
                  placeholder={
                    isStudy
                      ? t("dashboard.selectParticipationSetting", {}, {
                          default: "Select participation setting",
                        })
                      : t("dashboard.selectCommentsSetting", {}, {
                          default: "Select comments setting",
                        })
                  }
                  ariaLabel={
                    isStudy
                      ? t("dashboard.participation", {}, {
                          default: "Participation",
                        })
                      : t("dashboard.comments", {}, { default: "Comments" })
                  }
                />
              </>
            ) : (
              <p>
                {t("dashboard.bulkRequiresMilestone", {}, {
                  default:
                    "Select a milestone to update status for the selected students.",
                })}
              </p>
            )}
          </div>
        </StyledBulkBody>
      </Modal>

      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={t("dashboard.confirmCardStatusUpdate", {}, {
          default: "Confirm Card Status Update",
        })}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                applyUpdate(false);
                setConfirmModalOpen(false);
              }}
            >
              {t("dashboard.noKeepCardStatuses", {}, {
                default: "No, Keep Card Statuses",
              })}
            </Button>
            <Button
              variant="filled"
              onClick={() => applyUpdate(true)}
              disabled={loading}
            >
              {t("dashboard.yesUpdateCards", {}, {
                default: "Yes, Update Cards",
              })}
            </Button>
          </>
        }
      >
        {t("dashboard.confirmCardStatusUpdateDesc", {}, {
          default:
            "Setting the status to 'Review is finished' can update all submitted cards in these projects to 'Needs revision'. Would you like to proceed with this change?",
        })}
      </Modal>
    </>
  );
};

const StyledBulkBody = styled.div`
  font-family: Inter, sans-serif;
  color: var(--MH-Theme-Neutrals-Black, #171717);

  p {
    margin: 0 0 16px;
    font-size: 14px;
    line-height: 20px;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .error-message {
    background: var(--MH-Theme-Warning-Light, #edcecd);
    color: var(--MH-Theme-Warning-Dark, #8f1f14);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .section {
    margin-bottom: 20px;
    padding: 16px;
    border-radius: 8px;
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);

    h3 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
      line-height: 22px;
    }
  }

  .student-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .student-item {
    display: flex;
    gap: 16px;
    padding: 8px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 6px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    font-size: 14px;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

    span {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      strong {
        color: var(--MH-Theme-Primary-Dark, #336f8a);
      }
    }
  }

  .fieldLabel {
    display: block;
    margin: 12px 0 6px;
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
  }
`;
