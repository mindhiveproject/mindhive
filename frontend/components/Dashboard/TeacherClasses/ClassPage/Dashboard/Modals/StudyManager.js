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

import StyledClass from "../../../../../styles/StyledClass";

export default function ProjectManager(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [studyId, setStudyId] = useState("");
  const [studyName, setStudyName] = useState("");

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
    variables: { id: props?.data?.projectId },
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
    await updateProject({
      variables: {
        input: {
          study: {
            connect: {
              id: studyId,
            },
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
        input: {
          study: {
            create: {
              title: studyName,
              classes: {
                connect: {
                  id: props?.classId,
                },
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
              <div className="manageModal">
                <div>
                  <h3>Select the existing study</h3>

                  <div>
                    <Dropdown
                      selection
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
