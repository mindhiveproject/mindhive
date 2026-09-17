import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import { UPDATE_PROJECT_BOARD } from "../../Mutations/Proposal";
import { GET_PROJECT_STUDY, PROPOSAL_QUERY } from "../../Queries/Proposal";
import { MY_STUDIES, TEACHER_STUDIES } from "../../Queries/Study";
import Button from "../../DesignSystem/Button";
import DropdownSelect from "../../DesignSystem/DropdownSelect";
import Modal from "../../DesignSystem/Modal";

export default function StudyDropdown({ user, project }) {
  const { t } = useTranslation("builder");
  const isTeacher = user?.permissions?.map((p) => p?.name).includes("TEACHER");
  const { data: studiesData } = useQuery(
    isTeacher ? TEACHER_STUDIES : MY_STUDIES,
    {
      variables: { id: user?.id },
    }
  );

  const [updateProject] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: GET_PROJECT_STUDY,
        variables: { id: project?.id },
      },
      {
        query: PROPOSAL_QUERY,
        variables: { id: project?.id },
      },
    ],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudyId, setSelectedStudyId] = useState(null);

  const studies = studiesData?.studies || [];

  const studyOptions = [
    ...studies.map((study) => ({
      value: study?.id,
      label: study?.title,
    })),
    ...(project?.study &&
    !studies.some((study) => study?.id === project?.study?.id)
      ? [
          {
            value: project?.study?.id,
            label:
              project?.study?.title ||
              t("project.connectedStudy", {}, {
                default: "Connected Study",
              }),
          },
        ]
      : []),
  ];

  const handleStudyChange = (next) => {
    if (next && next !== project?.study?.id) {
      setSelectedStudyId(next);
      setIsModalOpen(true);
    }
  };

  const handleConfirm = async () => {
    try {
      await updateProject({
        variables: {
          id: project?.id,
          input: {
            study: {
              connect: {
                id: selectedStudyId,
              },
            },
          },
        },
      });
      setIsModalOpen(false);
      setSelectedStudyId(null);
      window.location.reload();
    } catch (error) {
      console.error("Error updating study:", error);
      alert(
        t("project.failedToUpdateStudy", {}, {
          default: "Failed to update study connection",
        })
      );
      setIsModalOpen(false);
      setSelectedStudyId(null);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedStudyId(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
        border: "1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6)",
        borderRadius: 8,
        padding: 8,
        marginTop: 8,
        boxShadow: "0px 4px 12px 0px rgba(0, 0, 0, 0.05)",
      }}
    >
      <span
        style={{
          font: "var(--MH-Type-Label-Base, 400 13px/18px Inter, sans-serif)",
          letterSpacing: 0,
          color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
        }}
      >
        {t(
          "project.selectOwnedStudyForProject",
          { title: project?.title || t("header.myProjectBoard", {}, { default: "My Project Board" }) },
          {
            default:
              "You can select another study you own to associate with {{title}}.",
          }
        )}
      </span>
      <DropdownSelect
        value={project?.study?.id || ""}
        options={studyOptions}
        searchableSingle
        disabled={!studies.length && !project?.study?.id}
        placeholder={t("project.noStudyConnected", {}, {
          default: "No study connected",
        })}
        ariaLabel={t("project.chooseStudy", {}, { default: "Choose a study..." })}
        onChange={handleStudyChange}
      />
      <Modal
        open={isModalOpen}
        onClose={handleCancel}
        title={t("project.confirmStudyChange", {}, {
          default: "Confirm Study Change",
        })}
        actions={
          <>
            <Button variant="outline" onClick={handleCancel}>
              {t("project.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button variant="filled" onClick={handleConfirm}>
              {t("project.confirm", {}, { default: "Confirm" })}
            </Button>
          </>
        }
      >
        {t("project.confirmStudyChangeDescription", {}, {
          default:
            "Are you sure you want to switch the study for this project? This action may affect related data.",
        })}
      </Modal>
    </div>
  );
}
