import { useState } from "react";
import { Modal } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";

import LinkClass from "./LinkClass";
import Collaborators from "../../../../Global/Collaborators";

export default function ConnectModal({
  study,
  user,
  handleChange,
  updateStudy,
}) {
  const [open, setOpen] = useState(false);

  const userClasses = [
    ...user?.teacherIn.map((cl) => cl?.id),
    ...user?.mentorIn.map((cl) => cl?.id),
    ...user?.studentIn.map((cl) => cl?.id),
  ];
  const collaborators =
    (study && study?.collaborators?.map((c) => c?.id)) || [];

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
            Study author is {study?.author?.username || "No Author"} (
            <em>This information is visible only for ADMIN</em>)
          </div>
        </Modal.Header>
      )}
      <Modal.Content>
        <Modal.Description>
          <div>
            <h2>Select the class</h2>
            <LinkClass study={study} handleChange={handleChange} />
            <h2>Add collaborators</h2>
            <Collaborators
              userClasses={userClasses}
              collaborators={collaborators}
              handleChange={handleChange}
            />
          </div>
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
              updateStudy();
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
