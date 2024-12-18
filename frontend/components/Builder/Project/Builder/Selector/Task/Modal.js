import { Modal } from "semantic-ui-react";

import TaskPage from "../../../../../Tasks/Landing/TaskPage";

import {
  StyledModalHeader,
  StyledModalButtons,
} from "../../../../../styles/StyledModal";

export default function TaskModal({
  user,
  component,
  addFunctions,
  onModalClose,
}) {
  const isAuthor = component?.author?.id === user?.id;
  const isCollaborator = component?.collaborators
    .map((c) => c?.id)
    .includes(user?.id);

  const taskType = component?.taskType.toLowerCase();

  return (
    <Modal open closeOnDimmerClick size="large" onClose={() => onModalClose()}>
      <Modal.Header>
        <StyledModalHeader>
          <div>
            <h1>{component?.title}</h1>
            <p>{component?.description}</p>
          </div>
          <div className="rightPanel">
            <StyledModalButtons>
              <div>
                <button
                  className="addBtn"
                  onClick={() => {
                    addFunctions.addComponentToCanvas({
                      name: component?.title,
                      details: component?.description,
                      componentID: component?.id,
                      taskType: component?.taskType,
                      subtitle: component?.subtitle,
                    });
                    onModalClose();
                  }}
                >
                  Add to study
                </button>
              </div>
              {(isAuthor || isCollaborator) && (
                <div>
                  <button
                    className="previewBtn"
                    onClick={() => {
                      addFunctions.addComponentToCanvas({
                        name: component?.title,
                        details: component?.description,
                        componentID: component?.id,
                        taskType: component?.taskType,
                        subtitle: component?.subtitle,
                        createCopy: true,
                      });
                      onModalClose();
                    }}
                  >
                    Create a copy
                  </button>
                </div>
              )}

              <button className="previewBtn">
                <a
                  target="_blank"
                  href={`/preview/${taskType}/${component?.id}`}
                >
                  Preview {taskType}
                </a>
              </button>
            </StyledModalButtons>
          </div>
        </StyledModalHeader>
      </Modal.Header>

      <Modal.Content style={{ padding: "50px", backgroundColor: "#f8f9f8" }}>
        <TaskPage user={user} task={component} />
      </Modal.Content>

      <Modal.Actions>
        <StyledModalButtons>
          <button className="closeBtn" onClick={() => onModalClose()}>
            Close
          </button>
        </StyledModalButtons>
      </Modal.Actions>
    </Modal>
  );
}
