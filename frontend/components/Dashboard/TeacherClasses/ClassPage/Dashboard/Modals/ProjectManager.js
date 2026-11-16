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
import { peopleOption } from "./peopleOption";
import { classDashboardRefetchQueries } from "../useClassDashboardData";
import { boardRuleMessage } from "../../../../../../lib/mainProject";

import { CLASS_ROSTER_QUERY } from "../../../../../Queries/Classes";
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
    .map((project) =>
      peopleOption(
        project,
        t("dashboard.untitledProject", {}, { default: "Untitled project" })
      )
    );

  // Class roster, used to add other students as collaborators on a project
  const { data: rosterData } = useQuery(CLASS_ROSTER_QUERY, {
    variables: { classId: props?.classId },
    skip: !props?.classId,
  });
  const roster = rosterData?.profiles || [];
  const rosterIds = new Set(roster.map((profile) => profile.id));
  const usernameOf = (id) =>
    id === studentId
      ? props?.data?.username
      : roster.find((profile) => profile.id === id)?.username;

  // The students on a board: its author and collaborators who are in the
  // class roster. Teachers and mentors are not counted
  // (keystone/lib/mainProject.js).
  const studentIdsOf = (project) => [
    ...new Set(
      [project?.author?.id, ...(project?.collaborators || []).map((c) => c.id)]
        .filter((id) => id && (rosterIds.has(id) || id === studentId))
    ),
  ];

  // Shown after adding someone to a main project when that leaves them with
  // two main projects in this class. Allowed, but the teacher should know.
  const [doubleMain, setDoubleMain] = useState(null);
  const warnIfSecondMain = (profileId, target, otherBoards) => {
    if (!target?.isMain) return;
    const other = otherBoards.find(
      (board) =>
        board.id !== target.id &&
        board.isMain &&
        studentIdsOf(board).includes(profileId)
    );
    if (!other) return;
    setDoubleMain({
      username: usernameOf(profileId),
      titles: [other.title, target.title],
    });
  };

  const { data: proposalData } = useQuery(DEFAULT_PROJECT_BOARDS);
  const defaultProposalBoardId =
    proposalData?.proposalBoards?.map((p) => p?.id)[0] || [];

  const [assignStudent] = useMutation(ASSIGN_STUDENT_TO_PROJECT, {
    refetchQueries: [
      ...classDashboardRefetchQueries(props?.classId),
      { query: CLASS_PROJECTS_QUERY, variables: { classId: props?.classId } },
    ],
  });

  const [copyProposal] = useMutation(COPY_PROPOSAL_MUTATION, {
    variables: {},
    refetchQueries: [
      { query: CLASS_PROJECTS_QUERY, variables: { classId: props?.classId } },
      ...classDashboardRefetchQueries(props?.classId),
    ],
  });

  const [updateProject, { loading: updateLoading }] =
    useMutation(UPDATE_PROJECT_BOARD, {
      refetchQueries: classDashboardRefetchQueries(props?.classId),
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
      warnIfSecondMain(studentId, added, localProjects);
      setLocalProjects((prev) => [
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
    warnIfSecondMain(
      profileId,
      localProjects.find((proj) => proj.id === projectId),
      availableProjects
    );
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

  // One update: the server checks the one-main-per-class rule and un-mains
  // the boards this one replaces (keystone/lib/mainProject.js). When it
  // refuses, the reason is shown above the table.
  const [mainError, setMainError] = useState(null);
  const saveMain = async (projectId, isMain, replacedIds = []) => {
    setMainError(null);
    try {
      await updateProject({
        variables: { id: projectId, input: { isMain } },
      });
      setLocalProjects((prev) =>
        prev.map((proj) => {
          if (proj.id === projectId) return { ...proj, isMain };
          if (replacedIds.includes(proj.id)) return { ...proj, isMain: false };
          return proj;
        })
      );
    } catch (err) {
      setMainError(boardRuleMessage(err));
    }
  };

  const setMainProject = (projectId) => {
    const target = localProjects.find((proj) => proj.id === projectId);
    const targetStudents = studentIdsOf(target);
    // Replaced: main projects whose students are all on the new main project.
    const replacedIds = localProjects
      .filter(
        (proj) =>
          proj.id !== projectId &&
          proj.isMain &&
          studentIdsOf(proj).every((id) => targetStudents.includes(id))
      )
      .map((proj) => proj.id);
    return saveMain(projectId, true, replacedIds);
  };

  const unsetMainProject = (projectId) => saveMain(projectId, false);

  const mainCount = localProjects.filter((proj) => proj.isMain).length;

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

          {mainError && (
            <MessageCard
              variant="warning"
              message={mainError}
              onClose={() => setMainError(null)}
              closeAriaLabel={t("dashboard.dismiss", {}, { default: "Dismiss" })}
            />
          )}
          {mainCount > 1 && (
            <MessageCard
              variant="information"
              message={t(
                "dashboard.severalMainProjects",
                { username: props?.data?.username },
                {
                  default: `${props?.data?.username} has more than one main project in this class. A main project is shared by every student on it, so this happens when a student joins a project that is already someone's main project. The dashboard shows the first one; select the one to keep, or remove the others as main project.`,
                }
              )}
            />
          )}
          {doubleMain && (
            <MessageCard
              variant="information"
              message={t(
                "dashboard.collaboratorHasTwoMains",
                {
                  username: doubleMain.username,
                  titles: doubleMain.titles.map((title) => `"${title}"`).join(", "),
                },
                {
                  default: `${doubleMain.username} now has two main projects in this class: ${doubleMain.titles
                    .map((title) => `"${title}"`)
                    .join(", ")}. Open their projects to choose which one to keep.`,
                }
              )}
              onClose={() => setDoubleMain(null)}
              closeAriaLabel={t("dashboard.dismiss", {}, { default: "Dismiss" })}
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
                portal
                value={projectId}
                placeholder={t("dashboard.searchProjectsByTitleOrPeople", {}, {
                  default: "Search by project title, creator or collaborator",
                })}
                searchPlaceholder={t("dashboard.searchProjectsByTitleOrPeople", {}, {
                  default: "Search by project title, creator or collaborator",
                })}
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
                    // The other students whose main project this is too.
                    const sharedWith = studentIdsOf(project)
                      .filter((id) => id !== studentId)
                      .map(usernameOf)
                      .filter(Boolean);
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
                          {project.isMain && (
                            <div className="mainNote">
                              {sharedWith.length > 0 && (
                                <span>
                                  {t(
                                    "dashboard.mainSharedWith",
                                    { names: sharedWith.join(", ") },
                                    {
                                      default: `Also the main project of ${sharedWith.join(
                                        ", "
                                      )}`,
                                    }
                                  )}
                                </span>
                              )}
                              <DesignSystemButton
                                variant="text"
                                onClick={() => unsetMainProject(project.id)}
                                disabled={updateLoading}
                              >
                                {t("dashboard.removeAsMain", {}, {
                                  default: "Remove as main project",
                                })}
                              </DesignSystemButton>
                            </div>
                          )}
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

  .mainNote {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    font: var(--MH-Type-Body-Small, var(--MH-Type-Body-Base));
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
