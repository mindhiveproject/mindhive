import { useState } from "react";
import { Modal } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";

import LinkClass from "./LinkClass";
import Collaborators from "../../../../Global/Collaborators";
import { StyledInput } from "../../../../styles/StyledForm";
import { StyledLinkedProjects } from "../../../../styles/StyledProject";

export default function ConnectModal({
  project,
  user,
  handleChange,
  updateProject,
}) {
  const [open, setOpen] = useState(false);

  const userClasses = [
    ...user?.teacherIn.map((cl) => cl?.id),
    ...user?.mentorIn.map((cl) => cl?.id),
    ...user?.studentIn.map((cl) => cl?.id),
  ];
  const collaborators =
    (project && project?.collaborators?.map((c) => c?.id)) || [];

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Icon size="large" name="dropdown" />}
    >
      {user?.permissions.map((p) => p?.name).includes("ADMIN") && (
        <Modal.Header>
          <div>
            Project creator is {project?.author?.username || "No Author"} (
            <em>This information is visible only for ADMIN</em>)
          </div>
        </Modal.Header>
      )}
      <Modal.Content>
        <Modal.Description>
          <StyledInput>
            <h2>Project title</h2>
            <input
              type="text"
              id="title"
              name="title"
              value={project?.title}
              onChange={handleChange}
            />
          </StyledInput>
          <h2>Linked class</h2>
          <LinkClass project={project} handleChange={handleChange} />
          <h2>Project board collaborators</h2>
          <Collaborators
            userClasses={userClasses}
            collaborators={collaborators}
            handleChange={handleChange}
          />

          {project?.study?.title && (
            <StyledLinkedProjects>
              <h2>Linked projects</h2>
              <p>
                Projects that share access to your study{" "}
                <span className="projectName"> {project?.study?.title}</span>
              </p>
              <div>
                {project?.study?.proposal.map((project) => (
                  <div className="project">
                    <div>{project?.title}</div>
                    <a
                      href={`/builder/projects?selector=${project?.id}`}
                      target="_blank"
                    >
                      Open in a new tab
                    </a>
                  </div>
                ))}
              </div>
            </StyledLinkedProjects>
          )}
        </Modal.Description>
      </Modal.Content>

      <Modal.Actions>
        <div className="modalButtons">
          <button
            className="secondaryBtn"
            onClick={() => setOpen(false)}
            disabled={false}
          >
            Close
          </button>

          <button
            className="primaryBtn"
            onClick={() => {
              updateProject();
              setOpen(false);
            }}
            disabled={false}
          >
            Save & Close
          </button>
        </div>
      </Modal.Actions>
    </Modal>
  );
}
