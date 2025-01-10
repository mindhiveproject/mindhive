import { Modal, Icon } from "semantic-ui-react";
import { useState } from "react";

import StyledModal from "../../../../../styles/StyledModal";

// query to refetch after the student update
import { GET_STUDENTS_DASHBOARD_DATA } from "../../../../../Queries/Classes";

export default function ProjectManagerModal({ ...props }) {
  console.log({ props });
  const [isOpen, setIsOpen] = useState(false);

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
            <h1>
              Manage the project for student {props?.props?.data?.username}
            </h1>
          </div>
        </Modal.Header>

        <Modal.Content scrolling>content</Modal.Content>
      </StyledModal>
    </Modal>
  );
}
