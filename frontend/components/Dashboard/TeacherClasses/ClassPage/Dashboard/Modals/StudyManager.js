import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../../../DesignSystem/Button";
import Modal from "../../../../../DesignSystem/Modal";
import Chip from "../../../../../DesignSystem/Chip";
import Radio from "../../../../../DesignSystem/Radio";
import Input from "../../../../../DesignSystem/Input";
import DropdownSelect from "../../../../../DesignSystem/DropdownSelect";
import { OpenInNewIcon, TrashIcon } from "../../../../../DesignSystem/Icons";
import DashboardAssetIcon from "../DashboardAssetIcon";

import {
  GET_STUDENTS_DASHBOARD_DATA,
  GET_CLASS,
} from "../../../../../Queries/Classes";
import { UPDATE_STUDY, CREATE_STUDY } from "../../../../../Mutations/Study";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";

const DEFAULT_STUDY_SETTINGS = {
  forbidRetake: true,
  hideParticipateButton: false,
  showEmailNotificationPropmt: false,
  askStudentsNYC: false,
  zipCode: false,
  guestParticipation: true,
  consentObtained: false,
  proceedToFirstTask: true,
  useExternalDevices: false,
  sonaId: false,
  minorsBlocked: false,
};

const getMentors = (study) =>
  study?.collaborators?.filter((c) =>
    c.permissions?.some((p) => p.name === "MENTOR")
  ) || [];

// The main project's study first, then the studies the student collaborates on
const buildStudies = (data) => {
  const project = data?.projects?.find((p) => p.id === data?.projectId);
  const mainStudy = project?.study;
  const others = (data?.studies || []).filter((s) => s.id !== mainStudy?.id);
  return mainStudy ? [mainStudy, ...others] : others;
};

export default function StudyManager(props) {
  const { t } = useTranslation("classes");
  const isControlled = typeof props.open === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? props.open : internalOpen;
  const [studyId, setStudyId] = useState(null);
  const [studyName, setStudyName] = useState("");
  const studentId = props?.data?.id;

  const projectId = props?.data?.projectId;
  const hasProject = !!projectId;
  const project = props?.data?.projects?.find((p) => p.id === projectId);

  const [localStudies, setLocalStudies] = useState(buildStudies(props?.data));
  const [mainStudyId, setMainStudyId] = useState(project?.study?.id || null);

  const closeModal = () => {
    if (isControlled) {
      props.onClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    setLocalStudies(buildStudies(props?.data));
    setMainStudyId(project?.study?.id || null);
  }, [props?.data?.id, props?.data?.studies, props?.data?.projects]);

  const hasStudies = localStudies.length > 0;
  const mainStudy = localStudies.find((s) => s.id === mainStudyId);

  const { data: classData } = useQuery(GET_CLASS, {
    variables: { code: props?.classCode },
    skip: !props?.classCode,
  });
  const availableStudies = classData?.class?.studies || [];

  const studyOptions = availableStudies
    .filter((study) => !localStudies.some((s) => s.id === study.id))
    .map((study) => ({ value: study.id, label: study.title }));

  // Class roster, used to add other students as collaborators on a study
  const { data: rosterData } = useQuery(GET_STUDENTS_DASHBOARD_DATA, {
    variables: { classId: props?.classId },
    skip: !props?.classId,
  });
  const roster = rosterData?.profiles || [];

  const refetchQueries = [
    {
      query: GET_STUDENTS_DASHBOARD_DATA,
      variables: { classId: props?.classId },
    },
  ];

  const [updateStudy, { loading: updateLoading }] = useMutation(UPDATE_STUDY, {
    refetchQueries,
  });

  const [createStudy] = useMutation(CREATE_STUDY, {
    refetchQueries: [
      ...refetchQueries,
      { query: GET_CLASS, variables: { code: props?.classCode } },
    ],
  });

  const [updateProject] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries,
  });

  // The modal works from a snapshot of the row, so mirror each change locally
  const patchStudy = (id, patch) =>
    setLocalStudies((prev) =>
      prev.map((study) =>
        study.id === id ? { ...study, ...patch(study) } : study
      )
    );

  const projectCollaborators = () =>
    (project?.collaborators || []).map((c) => ({ id: c?.id }));

  // Connects the study to the student's main project, bringing the project team along
  const connectToMainProject = async (id) => {
    const target = mainStudy
      ? t("dashboard.studyManager.reassign")
      : t("dashboard.studyManager.connect");
    if (
      !window.confirm(
        t("dashboard.studyManager.confirmStudyConnectionDesc", {
          action: target,
          project: project?.title,
        })
      )
    ) {
      return false;
    }
    try {
      await updateStudy({
        variables: {
          id,
          input: {
            proposal: { connect: { id: projectId } },
            collaborators: { connect: projectCollaborators() },
          },
        },
      });
      setMainStudyId(id);
      return true;
    } catch (error) {
      console.error("Error connecting study to project:", error);
      alert(t("dashboard.studyManager.failedToConnectStudy"));
      return false;
    }
  };

  const assignToStudy = async () => {
    if (!studyId) {
      return alert(t("dashboard.studyManager.selectStudyFirst"));
    }
    const added = availableStudies.find((s) => s.id === studyId);
    if (hasProject) {
      const connected = await connectToMainProject(studyId);
      if (!connected) return;
    } else {
      await updateStudy({
        variables: {
          id: studyId,
          input: { collaborators: { connect: { id: studentId } } },
        },
      });
    }
    if (added) {
      setLocalStudies((prev) => [
        ...prev,
        {
          ...added,
          collaborators: [
            ...(added.collaborators || []),
            { id: studentId, username: props?.data?.username },
          ],
        },
      ]);
    }
    setStudyId(null);
  };

  const setAsMainStudy = async (id) => {
    if (!hasProject || id === mainStudyId) return;
    await connectToMainProject(id);
  };

  const disconnectFromStudy = async (id) => {
    await updateStudy({
      variables: {
        id,
        input: { collaborators: { disconnect: { id: studentId } } },
      },
    });
    setLocalStudies((prev) => prev.filter((s) => s.id !== id));
  };

  const disconnectMainProjectStudy = async () => {
    try {
      await updateProject({
        variables: {
          id: projectId,
          input: { study: { disconnect: true } },
        },
      });
      setLocalStudies((prev) =>
        prev.filter(
          (s) =>
            s.id !== mainStudyId ||
            (s.collaborators || []).some((c) => c.id === studentId)
        )
      );
      setMainStudyId(null);
    } catch (error) {
      console.error("Error disconnecting main project study:", error);
      alert(t("dashboard.studyManager.failedToDisconnectStudy"));
    }
  };

  const addCollaborator = async (id, profileId) => {
    await updateStudy({
      variables: { id, input: { collaborators: { connect: { id: profileId } } } },
    });
    const profile = roster.find((p) => p.id === profileId);
    patchStudy(id, (study) => ({
      collaborators: [
        ...(study.collaborators || []),
        { id: profileId, username: profile?.username },
      ],
    }));
  };

  const removeCollaborator = async (id, profileId) => {
    await updateStudy({
      variables: {
        id,
        input: { collaborators: { disconnect: { id: profileId } } },
      },
    });
    patchStudy(id, (study) => ({
      collaborators: (study.collaborators || []).filter(
        (c) => c.id !== profileId
      ),
    }));
  };

  const createNewStudy = async () => {
    if (!studyName) {
      return alert(t("dashboard.studyManager.giveStudyNameFirst"));
    }
    const base = {
      title: studyName,
      classes: { connect: { id: props?.classId } },
      settings: DEFAULT_STUDY_SETTINGS,
    };
    if (hasProject) {
      await updateProject({
        variables: {
          id: projectId,
          input: {
            study: {
              create: {
                ...base,
                collaborators: { connect: projectCollaborators() },
              },
            },
          },
        },
      });
    } else {
      await createStudy({
        variables: {
          input: { ...base, collaborators: { connect: { id: studentId } } },
        },
      });
    }
    setStudyName("");
    closeModal();
  };

  const openStudy = (id) =>
    window.open(`/builder/studies?selector=${id}`, "_blank");

  return (
    <>
      {!isControlled && (
        <DesignSystemButton
          variant="outline"
          leadingIcon={<DashboardAssetIcon src="/assets/icons/education.svg" />}
          onClick={() => setInternalOpen(true)}
        >
          {t(
            "dashboard.studyManager.manageStudies",
            { count: localStudies.length },
            { default: "Manage Studies ({{count}})" }
          )}
        </DesignSystemButton>
      )}
      <Modal
        open={isOpen}
        onClose={closeModal}
        maxWidth="95vw"
        maxHeight="95vh"
      >
        <StyledStudyManager>
          <h1>
            {t(
              "dashboard.studyManager.studentStudies",
              { username: props?.data?.username },
              { default: "{{username}}'s studies" }
            )}
          </h1>
          <p>
            {hasProject
              ? t("dashboard.studyManager.studyManagerIntro", null, {
                  default:
                    "Select the study connected to the main project, open a study, or add a student to another study below.",
                })
              : t("dashboard.studyManager.noProjectAssigned")}
          </p>

          <div className="actions">
            <section>
              <h2>
                {hasProject
                  ? t("dashboard.studyManager.chooseExistingStudyForProject", null, {
                      default: "Choose and connect an existing study to the main project",
                    })
                  : t("dashboard.studyManager.chooseExistingStudyForStudent", null, {
                      default: "Choose and assign to an existing study",
                    })}
              </h2>
              <DropdownSelect
                searchableSingle
                value={studyId}
                placeholder={t("dashboard.studyManager.selectAStudy")}
                options={studyOptions}
                onChange={setStudyId}
                disabled={studyOptions.length === 0}
              />
              <DesignSystemButton
                variant="filled"
                onClick={assignToStudy}
                disabled={!studyId}
              >
                {hasProject && mainStudy
                  ? t("dashboard.studyManager.reassignStudy")
                  : t("dashboard.studyManager.assignToStudy")}
              </DesignSystemButton>
            </section>
            <section>
              <h2>{t("dashboard.studyManager.createNewStudy")}</h2>
              <Input
                value={studyName}
                onChange={setStudyName}
                placeholder={t("dashboard.studyManager.enterNewStudyName")}
              />
              <DesignSystemButton
                variant="filled"
                onClick={createNewStudy}
                disabled={!studyName}
              >
                {t("dashboard.studyManager.createStudy")}
              </DesignSystemButton>
            </section>
          </div>

          {hasStudies ? (
            <div className="tableScroll">
              <table>
                <thead>
                  <tr>
                    <th colSpan={3}>
                      {hasProject
                        ? t("dashboard.mainStudy")
                        : t("dashboard.study", null, { default: "Study" })}
                    </th>
                    <th>{t("dashboard.collaborator", null, { default: "Collaborator" })}</th>
                    <th>{t("dashboard.mentor", null, { default: "Mentor" })}</th>
                    <th>{t("dashboard.studyManager.project")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {localStudies.map((study) => {
                    const isMain = study.id === mainStudyId;
                    const collaborators = (study.collaborators || []).filter(
                      (c) => c.id !== studentId
                    );
                    const mentors = getMentors(study);
                    const addOptions = roster
                      .filter(
                        (s) =>
                          s.id !== studentId &&
                          !collaborators.some((c) => c.id === s.id)
                      )
                      .map((s) => ({ value: s.id, label: s.username }));
                    return (
                      <tr key={study.id}>
                        <td className="tight">
                          {hasProject && (
                            <Radio
                              checked={isMain}
                              onChange={() => setAsMainStudy(study.id)}
                              disabled={updateLoading}
                              ariaLabel={t(
                                "dashboard.studyManager.setAsMainStudyAria",
                                { title: study.title },
                                { default: "Connect {{title}} to the main project" }
                              )}
                            />
                          )}
                        </td>
                        <td>
                          <Chip variant="static" tone="neutral" label={study.title} />
                        </td>
                        <td>
                          <DesignSystemButton
                            variant="primary"
                            leadingIcon={<OpenInNewIcon />}
                            onClick={() => openStudy(study.id)}
                          >
                            {t("dashboard.studyManager.viewStudy")}
                          </DesignSystemButton>
                        </td>
                        <td>
                          <div className="chips">
                            {collaborators.map((c) => (
                              <Chip
                                key={c.id}
                                label={c.username}
                                onClose={() =>
                                  removeCollaborator(study.id, c.id)
                                }
                              />
                            ))}
                            {addOptions.length > 0 && (
                              <DropdownSelect
                                fitContent
                                portal
                                searchableSingle
                                value={null}
                                placeholder={t("dashboard.addCollaborator", null, {
                                  default: "Add",
                                })}
                                options={addOptions}
                                onChange={(id) => addCollaborator(study.id, id)}
                              />
                            )}
                          </div>
                        </td>
                        <td>
                          {mentors.length > 0
                            ? mentors.map((m) => m.username).join(", ")
                            : t("dashboard.studyManager.none")}
                        </td>
                        <td>
                          <Chip
                            variant="static"
                            tone={isMain ? "success" : "neutral"}
                            label={
                              isMain
                                ? project?.title ||
                                  t("dashboard.studyManager.unknownProject")
                                : t("dashboard.studyManager.none")
                            }
                          />
                        </td>
                        <td>
                          <DesignSystemButton
                            variant="text"
                            tone="warning"
                            leadingIcon={<TrashIcon />}
                            onClick={() =>
                              isMain
                                ? disconnectMainProjectStudy()
                                : disconnectFromStudy(study.id)
                            }
                          >
                            {isMain
                              ? t("dashboard.studyManager.disconnect")
                              : t("dashboard.studyManager.removeCollaborator")}
                          </DesignSystemButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>{t("dashboard.studyManager.notAssignedToAnyStudies")}</p>
          )}
        </StyledStudyManager>
      </Modal>
    </>
  );
}

// Layout only — typography, colour and controls come from the design system
const StyledStudyManager = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 32px;
  text-align: left;

  h1 {
    font: var(--MH-Type-Heading-Large);
    margin: 0;
  }

  h2 {
    font: var(--MH-Type-Title-Base);
    margin: 0;
  }

  p {
    font: var(--MH-Type-Body-Base);
    margin: 0;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 48px;
    width: 100%;

    section {
      flex: 1 1 320px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }

  .tableScroll {
    width: 100%;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font: var(--MH-Type-Body-Base);

    th {
      font: var(--MH-Type-Label-Base);
      text-align: left;
      padding: 12px 24px 12px 0;
    }

    thead tr {
      background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    }

    th:first-child {
      padding-left: 16px;
    }

    td {
      padding: 16px 24px 16px 0;
      vertical-align: middle;
      white-space: nowrap;
      border-top: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    }

    td.tight {
      padding-right: 8px;
    }

    td:last-child,
    th:last-child {
      padding-right: 0;
      text-align: right;
    }
  }

  /* Chips flow in a row and only wrap once the column is genuinely full */
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-width: 360px;
  }
`;
