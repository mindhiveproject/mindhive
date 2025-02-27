import { useMutation, useQuery } from "@apollo/client";
import { Modal, Icon, Dropdown } from "semantic-ui-react";
import { useState } from "react";

import StyledModal from "../../../../../styles/StyledModal";

// query to refetch after the student update
import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
// query to get all projects of a class
import { CLASS_PROJECTS_QUERY } from "../../../../../Queries/Proposal";
// query to get default proposals
import { DEFAULT_PROJECT_BOARDS } from "../../../../../Queries/Proposal";
// mutation to update a student
import { ASSIGN_STUDENT_TO_PROJECT } from "../../../../../Mutations/Classes";
// mutation to create a new project board
import { COPY_PROPOSAL_MUTATION } from "../../../../../Mutations/Proposal";

import StyledClass from "../../../../../styles/StyledClass";

export default function ProjectManager(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");

  const { data: classProjectsData } = useQuery(CLASS_PROJECTS_QUERY, {
    variables: { classId: props?.classId },
  });
  const projects = classProjectsData?.proposalBoards || [];

  const projectOptions =
    projects?.map((project) => ({
      key: project?.id,
      text: project?.title,
      value: project?.id,
    })) || [];

  const { data: proposalData } = useQuery(DEFAULT_PROJECT_BOARDS);
  const defaultProposalBoardId =
    proposalData?.proposalBoards?.map((p) => p?.id)[0] || [];

  const [updateStudent] = useMutation(ASSIGN_STUDENT_TO_PROJECT, {
    variables: { studentId: props?.data?.id },
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const assignToProject = async () => {
    if (!projectId) {
      return alert("Select the project first");
    }
    // get the study id (if it exists)
    let studyId;
    const p = projects
      .filter((p) => p?.id === projectId)
      .map((p) => p?.study?.id);
    if (p && p.length) {
      studyId = p[0];
    }
    await updateStudent({
      variables: {
        input: {
          collaboratorInProposal: { connect: { id: projectId } },
          collaboratorInStudy: studyId ? { connect: { id: studyId } } : null,
        },
      },
    });
    setIsOpen(false);
  };

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

  const createNewProject = async () => {
    if (!projectName) {
      return alert("Give the project a name first");
    }
    await copyProposal({
      variables: {
        id: props?.classProposalBoardId || defaultProposalBoardId,
        title: projectName,
        classIdUsed: props?.classId,
        collaborators: [props?.data?.id],
      },
    });
    setIsOpen(false);
  };

  return (
    <Modal
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      open={isOpen}
      trigger={<div>Create</div>}
      dimmer="blurring"
      size="small"
      closeIcon
    >
      <StyledModal>
        <Modal.Header>
          <div className="centeredHeader">
            <h2>Manage the project for {props?.data?.username}</h2>
          </div>
        </Modal.Header>

        <Modal.Content scrolling>
          <StyledClass>
            <div className="dashboard">
              <div className="manageModal">
                <div>
                  <h3>Select the existing project</h3>

                  <div>
                    <Dropdown
                      selection
                      options={projectOptions}
                      value={projectId}
                      onChange={(e, data) => setProjectId(data?.value)}
                    />
                  </div>
                  <button onClick={assignToProject}>Save & Close</button>
                </div>

                <div>
                  <h3>Create a new project</h3>
                  <input
                    type="text"
                    name="projectName"
                    placeholder="The name of the new project is "
                    value={projectName}
                    onChange={(e) => {
                      setProjectName(e?.target?.value);
                    }}
                  />

                  <button onClick={createNewProject}>Create new project</button>
                </div>
              </div>
            </div>
          </StyledClass>
        </Modal.Content>
      </StyledModal>
    </Modal>
  );
}
