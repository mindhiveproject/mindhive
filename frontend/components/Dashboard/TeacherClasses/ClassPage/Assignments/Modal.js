import { useState } from "react";

import { Modal } from "semantic-ui-react";
import JoditEditor from "../../../../Jodit/Editor";

import StyledModal from "../../../../styles/StyledModal";
import ClassSelector from "./ClassSelector";

export default function AssignmentModal({
  btnName,
  inputs,
  handleChange,
  submit,
  children,
  user,
}) {
  const [open, setOpen] = useState(false);

  return (
    <Modal
      closeIcon
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={children}
    >
      <Modal.Content>
        <Modal.Description>
          <StyledModal>
            <ClassSelector
              user={user}
              inputs={inputs}
              handleChange={handleChange}
            />
            <label htmlFor="title">
              <p>Title</p>
              <input
                type="text"
                id="title"
                name="title"
                value={inputs?.title}
                onChange={handleChange}
                required
              />
            </label>
            <JoditEditor
              content={inputs?.content}
              setContent={(content) =>
                handleChange({ target: { name: "content", value: content } })
              }
            />
            <button
              onClick={() => {
                submit();
                setOpen(false);
              }}
            >
              {btnName}
            </button>
          </StyledModal>
        </Modal.Description>
      </Modal.Content>
    </Modal>
  );
}
