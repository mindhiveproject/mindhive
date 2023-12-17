import { useState } from "react";

import StyledModal from "../../styles/StyledModal";
import { Modal } from "semantic-ui-react";
import JoditEditor from "../../Jodit/Editor";

export default function HomeworkModal({
  btnName,
  inputs,
  handleChange,
  submit,
  children,
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
      <Modal.Actions></Modal.Actions>
    </Modal>
  );
}
