import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../../../DesignSystem/Button";
import Modal from "../../../../../DesignSystem/Modal";
import MessageCard from "../../../../../DesignSystem/MessageCard";
import Chip from "../../../../../DesignSystem/Chip";
import Radio from "../../../../../DesignSystem/Radio";
import Input from "../../../../../DesignSystem/Input";
import DropdownSelect from "../../../../../DesignSystem/DropdownSelect";
import { OpenInNewIcon, TrashIcon } from "../../../../../DesignSystem/Icons";
import DashboardAssetIcon from "../DashboardAssetIcon";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import { CLASS_PROJECTS_QUERY } from "../../../../../Queries/Proposal";
import { DEFAULT_PROJECT_BOARDS } from "../../../../../Queries/Proposal";
import { ASSIGN_STUDENT_TO_PROJECT } from "../../../../../Mutations/Classes";
import { COPY_PROPOSAL_MUTATION } from "../../../../../Mutations/Proposal";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";

const getMentors = (project) =>
  project?.study?.collaborators?.filter((c) =>
    c.permissions?.some((p) => p.name === "MENTOR")
  ) || [];

export default function ProjectManager(props) {
  const { t } = useTranslation("classes");
  const isControlled = typeof props.open === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? props.open : internalOpen;
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [localProjects, setLocalProjects] = useState(
    props?.data?.projects || []
  );
  const studentId = props?.data?.id;

  const closeModal = () => {
    if (isControlled) {
      props.onClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    setLocalProjects(props?.data?.projects || []);
  }, [props?.data?.id, props?.data?.projects]);

  const hasProjects = localProjects.length > 0;

  // Sort projects: main projects (isMain: true) at the top
  const sortedProjects = [...localProjects].sort((a, b) => {
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return 0;
  });

  const { data: classProjectsData } = useQuery(CLASS_PROJECTS_QUERY, {
    variables: { classId: props?.classId },
  });
  const availableProjects = classProjectsData?.proposalBoards || [];

  const projectOptions = availableProjects
    .filter((project) => !localProjects.some((p) => p.id === project.id))
    .map((project) => ({ value: project.id, label: project.title }));

  // Class roster, used to add other students as collaborators on a project
  const { data: rosterData } = useQuery(GET_STUDENTS_DASHBOARD_DATA, {
    variables: { classId: props?.classId },
    skip: !props?.classId,
  });
  const roster = rosterData?.profiles || [];

  const { data: proposalData } = useQuery(DEFAULT_PROJECT_BOARDS);
  const defaultProposalBoardId =
    proposalData?.proposalBoards?.map((p) => p?.id)[0] || [];

  const [assignStudent] = useMutation(ASSIGN_STUDENT_TO_PROJECT, {
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
      { query: CLASS_PROJECTS_QUERY, variables: { classId: props?.classId } },
    ],
  });

  const [copyProposal] = useMutation(COPY_PROPOSAL_MUTATION, {
    variables: {},
    refetchQueries: [
      { query: CLASS_PROJECTS_QUERY, variables: { classId: props?.classId } },
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const [updateProject, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_PROJECT_BOARD, {
      update(cache, { data: { updateProposalBoard } }) {
        // Only update cache if classId is valid
        if (!props?.classId) return;

        try {
          // Read the current cache for GET_STUDENTS_DASHBOARD_DATA
          const cacheData = cache.readQuery({
            query: GET_STUDENTS_DASHBOARD_DATA,
            variables: { classId: props?.classId },
          });

          // Skip if cache data is not available
          if (!cacheData || !cacheData.profiles) return;

          const { profiles } = cacheData;

          // Update the cache with the new isMain value
          const updatedProfiles = profiles.map((profile) => {
            if (profile.id === props?.data?.id) {
              return {
                ...profile,
                collaboratorInProposal: profile.collaboratorInProposal.map(
                  (proj) =>
                    proj.id === updateProposalBoard.id
                      ? { ...proj, isMain: updateProposalBoard.isMain }
                      : proj
                ),
              };
            }
            return profile;
          });

          // Write the updated data back to the cache
          cache.writeQuery({
            query: GET_STUDENTS_DASHBOARD_DATA,
            variables: { classId: props?.classId },
            data: { profiles: updatedProfiles },
          });
        } catch (err) {
          console.warn("Cache update skipped due to missing data:", err);
        }
      },
      refetchQueries: props?.classId
        ? [
            {
              query: GET_STUDENTS_DASHBOARD_DATA,
              variables: { classId: props?.classId },
            },
          ]
        : [],
    });

  // The modal works from a snapshot of the row, so mirror each change locally
  const patchProject = (id, patch) =>
    setLocalProjects((prev) =>
      prev.map((proj) => (proj.id === id ? { ...proj, ...patch(proj) } : proj))
    );

  const assignToProject = async () => {
    if (!projectId) {
      return alert(t("dashboard.selectProjectFirst"));
    }
    await assignStudent({
      variables: {
        projectId,
        input: { connect: { id: studentId } },
      },
    });
    const added = availableProjects.find((p) => p.id === projectId);
    if (added) {
      setLocalProjects((prev) => [
        ...prev,
        {
          ...added,
          isMain: false,
          collaborators: [
            ...(added.collaborators || []),
            { id: studentId, username: props?.data?.username },
          ],
        },
      ]);
    }
    setProjectId(null);
  };

  const disconnectFromProject = async (projectId) => {
    await assignStudent({
      variables: {
        projectId,
        input: { disconnect: { id: studentId } },
      },
    });
    setLocalProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const addCollaborator = async (projectId, profileId) => {
    await assignStudent({
      variables: { projectId, input: { connect: { id: profileId } } },
    });
    const profile = roster.find((p) => p.id === profileId);
    patchProject(projectId, (proj) => ({
      collaborators: [
        ...(proj.collaborators || []),
        { id: profileId, username: profile?.username },
      ],
    }));
  };

  const removeCollaborator = async (projectId, profileId) => {
    await assignStudent({
      variables: { projectId, input: { disconnect: { id: profileId } } },
    });
    patchProject(projectId, (proj) => ({
      collaborators: (proj.collaborators || []).filter(
        (c) => c.id !== profileId
      ),
    }));
  };

  const createNewProject = async () => {
    if (!projectName) {
      return alert(t("dashboard.giveProjectNameFirst"));
    }
    await copyProposal({
      variables: {
        id: props?.classProposalBoardId || defaultProposalBoardId,
        title: projectName,
        classIdUsed: props?.classId,
        collaborators: [studentId],
      },
    });
    setProjectName("");
    closeModal();
  };

  const toggleProjectAsMain = async ({ projectId, isMain }) => {
    try {
      // Optimistically update local state
      setLocalProjects((prevProjects) =>
        prevProjects.map((proj) =>
          proj.id === projectId ? { ...proj, isMain } : proj
        )
      );

      await updateProject({
        variables: {
          id: projectId,
          input: {
            isMain,
          },
        },
        optimisticResponse: {
          updateProposalBoard: {
            __typename: "ProposalBoard",
            id: projectId,
            isMain,
          },
        },
      });
    } catch (err) {
      console.error("Error toggling main project:", err);
      // Revert local state on error
      setLocalProjects(props?.data?.projects || []);
      alert(t("dashboard.failedToUpdateMainProject"));
    }
  };

  // Radio semantics: exactly one main project, so unset any other
  const setMainProject = async (projectId) => {
    for (const proj of localProjects) {
      const isMain = proj.id === projectId;
      if (!!proj.isMain !== isMain) {
        await toggleProjectAsMain({ projectId: proj.id, isMain });
      }
    }
  };

  const openBoard = (projectId) =>
    window.open(`/builder/projects?selector=${projectId}`, "_blank");

  return (
    <>
      {!isControlled && (
        <DesignSystemButton
          variant="outline"
          leadingIcon={<DashboardAssetIcon src="/assets/icons/project.svg" />}
          onClick={() => setInternalOpen(true)}
        >
          {t("dashboard.manageProjects", { count: localProjects.length }, {
            default: "Manage Projects ({{count}})",
          })}
        </DesignSystemButton>
      )}
      <Modal
        open={isOpen}
        onClose={closeModal}
        maxWidth="95vw"
        maxHeight="95vh"
      >
        <StyledProjectManager>
          <h1>
            {t(
              "dashboard.studentProjects",
              { username: props?.data?.username },
              { default: "{{username}}'s projects" }
            )}
          </h1>
          <p>
            {t("dashboard.projectManagerIntro", null, {
              default:
                "Select the main project, open a board, or add a student to another project below.",
            })}
          </p>

          {updateError && (
            <MessageCard
              variant="warning"
              message={t("dashboard.failedToUpdateProjectStatus")}
            />
          )}

          <div className="actions">
            <section>
              <h2>
                {t("dashboard.chooseExistingProject", null, {
                  default: "Choose and assign to an existing project",
                })}
              </h2>
              <DropdownSelect
                searchableSingle
                value={projectId}
                placeholder={t("dashboard.selectAProject")}
                options={projectOptions}
                onChange={setProjectId}
                disabled={projectOptions.length === 0}
              />
              <DesignSystemButton
                variant="filled"
                onClick={assignToProject}
                disabled={!projectId}
              >
                {t("dashboard.assignToExistingProject")}
              </DesignSystemButton>
            </section>
            <section>
              <h2>{t("dashboard.createNewProject")}</h2>
              <Input
                value={projectName}
                onChange={setProjectName}
                placeholder={t("dashboard.enterNewProjectName")}
              />
              <DesignSystemButton
                variant="filled"
                onClick={createNewProject}
                disabled={!projectName}
              >
                {t("dashboard.createProject")}
              </DesignSystemButton>
            </section>
          </div>

          {hasProjects ? (
            <div className="tableScroll">
              <table>
                <thead>
                  <tr>
                    <th colSpan={3}>{t("dashboard.mainProject")}</th>
                    <th>{t("dashboard.collaborator", null, { default: "Collaborator" })}</th>
                    <th>{t("dashboard.mentor", null, { default: "Mentor" })}</th>
                    <th>{t("dashboard.study", null, { default: "Study" })}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sortedProjects.map((project) => {
                    const collaborators = (project.collaborators || []).filter(
                      (c) => c.id !== studentId
                    );
                    const mentors = getMentors(project);
                    const addOptions = roster
                      .filter(
                        (s) =>
                          s.id !== studentId &&
                          !collaborators.some((c) => c.id === s.id)
                      )
                      .map((s) => ({ value: s.id, label: s.username }));
                    return (
                      <tr key={project.id}>
                        <td className="tight">
                          <Radio
                            checked={!!project.isMain}
                            onChange={() => setMainProject(project.id)}
                            disabled={updateLoading}
                            ariaLabel={t("dashboard.setAsMainAria", {
                              title: project.title,
                            })}
                          />
                        </td>
                        <td>
                          <Chip variant="static" tone="neutral" label={project.title} />
                        </td>
                        <td>
                          <DesignSystemButton
                            variant="primary"
                            leadingIcon={<OpenInNewIcon />}
                            onClick={() => openBoard(project.id)}
                          >
                            {t("dashboard.viewProjectBoard")}
                          </DesignSystemButton>
                        </td>
                        <td>
                          <div className="chips">
                            {collaborators.map((c) => (
                              <Chip
                                key={c.id}
                                label={c.username}
                                onClose={() =>
                                  removeCollaborator(project.id, c.id)
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
                                onChange={(id) => addCollaborator(project.id, id)}
                              />
                            )}
                          </div>
                        </td>
                        <td>
                          {mentors.length > 0
                            ? mentors.map((m) => m.username).join(", ")
                            : t("dashboard.none")}
                        </td>
                        <td>
                          <Chip variant="static" tone={project.study?.title ? "success" : "warning"} label={project.study?.title || t("dashboard.noStudyAssigned")} />
                        </td>
                        <td>
                          <DesignSystemButton
                            variant="text"
                            tone="warning"
                            leadingIcon={<TrashIcon />}
                            onClick={() => disconnectFromProject(project.id)}
                          >
                            {t("dashboard.removeAsCollaborator")}
                          </DesignSystemButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p>{t("dashboard.notAssignedToAnyProjects")}</p>
          )}
        </StyledProjectManager>
      </Modal>
    </>
  );
}

// Layout only — typography, colour and controls come from the design system
const StyledProjectManager = styled.div`
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
