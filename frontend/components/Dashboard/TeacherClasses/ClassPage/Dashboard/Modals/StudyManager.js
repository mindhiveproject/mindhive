import { useMutation, useQuery } from "@apollo/client";
import { Modal, Icon, Dropdown } from "semantic-ui-react";
import { useState } from "react";

import StyledModal from "../../../../../styles/StyledModal";

// query to refetch after the student update
import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
// query to get all studies of a class
import { GET_CLASS } from "../../../../../Queries/Classes";
// mutation to update a project (by linking it to a new or existing study)
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";
// mutation to upate a study (by linking it to existing project)
import { UPDATE_STUDY } from "../../../../../Mutations/Study";

import StyledClass from "../../../../../styles/StyledClass";

export default function ProjectManager(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [studyId, setStudyId] = useState("");
  const [studyName, setStudyName] = useState("");
  const [projectId, setProjectId] = useState(props?.data?.projectId);

  const projectOptions =
    props?.data?.projects.map((project) => ({
      key: project?.id,
      text: project?.title,
      value: project?.id,
    })) || [];

  const { data: dataClass } = useQuery(GET_CLASS, {
    variables: { code: props?.classCode },
  });

  const studies = dataClass?.class?.studies || [];
  const studyOptions =
    studies?.map((study) => ({
      key: study?.id,
      text: study?.title,
      value: study?.id,
    })) || [];

  const [updateProject] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const [updateStudy] = useMutation(UPDATE_STUDY, {
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const assignToStudy = async () => {
    if (!studyId) {
      return alert("Select the study first");
    }
    // update the study
    await updateStudy({
      variables: {
        id: studyId,
        input: {
          proposal: {
            connect: {
              id: projectId,
            },
          },
          collaborators: {
            connect: props?.data?.project?.collaborators.map((c) => ({
              id: c?.id,
            })),
          },
        },
      },
    });
    setIsOpen(false);
  };

  const createNewStudy = async () => {
    if (!studyName) {
      return alert("Give the project a name first");
    }
    await updateProject({
      variables: {
        id: projectId,
        input: {
          study: {
            create: {
              title: studyName,
              classes: {
                connect: {
                  id: props?.classId,
                },
              },
              collaborators: {
                connect: props?.data?.project?.collaborators.map((c) => ({
                  id: c?.id,
                })),
              },
            },
          },
        },
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
            <h2>Manage the study for {props?.data?.username}</h2>
          </div>
        </Modal.Header>

        <Modal.Content scrolling>
          <StyledClass>
            <div className="dashboard">
              {projectOptions.length > 1 && (
                <div>
                  <h3>Select the student's project</h3>
                  <Dropdown
                    selection
                    options={projectOptions}
                    value={projectId}
                    onChange={(e, data) => setProjectId(data?.value)}
                  />
                </div>
              )}

              <div className="manageModal">
                <div>
                  <h3>Select the existing study</h3>

                  <div>
                    <Dropdown
                      selection
                      search
                      options={studyOptions}
                      value={studyId}
                      onChange={(e, data) => setStudyId(data?.value)}
                    />
                  </div>
                  <button onClick={assignToStudy}>Save & Close</button>
                </div>

                <div>
                  <h3>Create a new study</h3>
                  <input
                    type="text"
                    name="studyName"
                    placeholder="The name of the new study is "
                    value={studyName}
                    onChange={(e) => {
                      setStudyName(e?.target?.value);
                    }}
                  />

                  <button onClick={createNewStudy}>Create new study</button>
                </div>
              </div>
            </div>
          </StyledClass>
        </Modal.Content>
      </StyledModal>
    </Modal>
  );
}
