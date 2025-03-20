import { useMutation } from "@apollo/client";
import { Modal, Dropdown } from "semantic-ui-react";
import { useState } from "react";

import StyledModal from "../../../../../styles/StyledModal";

import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";

export default function SubmissionStatusManager(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(props?.value);

  const [updateStatus, { loading, error }] = useMutation(UPDATE_PROJECT_BOARD, {
    variables: {
      id: props?.data?.projectId,
    },
    refetchQueries: [
      {
        query: GET_STUDENTS_DASHBOARD_DATA,
        variables: { classId: props?.classId },
      },
    ],
  });

  const updateProjectStatus = () => {
    updateStatus({
      variables: {
        input: {
          [props?.type]: status,
        },
      },
    });
  };

  const statusOptions =
    [
      { label: "Not started", value: "NOT_STARTED" },
      { label: "In progress", value: "IN_PROGRESS" },
      { label: "Submitted", value: "SUBMITTED" },
      { label: "Review is finished", value: "FINISHED" },
    ].map((status) => ({
      key: status?.value,
      text: status?.label,
      value: status?.value,
    })) || [];

  return (
    <Modal
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      open={isOpen}
      trigger={<div>{props.value}</div>}
      dimmer="blurring"
      size="small"
      closeIcon
    >
      <StyledModal>
        <Modal.Content scrolling>
          <div className="modalTwoSideContent">
            <div className="firstSide">
              <h2>{props?.stage} of</h2>
              <p>{props?.data?.projectTitle}</p>
            </div>
            <div className="secondSide">
              <h2>Status</h2>
              <div>
                <Dropdown
                  selection
                  options={statusOptions}
                  value={status}
                  onChange={(e, data) => setStatus(data?.value)}
                />
              </div>
            </div>
          </div>
          <div className="footer">
            <button onClick={updateProjectStatus}>Update the status</button>
          </div>
        </Modal.Content>
      </StyledModal>
    </Modal>
  );
}
