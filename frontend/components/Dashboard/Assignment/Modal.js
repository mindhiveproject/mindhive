import { useState } from "react";

import StyledModal from "../../styles/StyledModal";
import { Modal } from "semantic-ui-react";
import JoditEditor from "../../Jodit/Editor";
import Status from "../TeacherClasses/ClassPage/Assignments/Homework/Status";

export default function HomeworkModal({
  btnName,
  inputs,
  content,
  updateContent,
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
            <div>
              <h4>Status</h4>
              <Status settings={inputs?.settings} handleChange={handleChange} />
            </div>
            <JoditEditor
              content={content?.current}
              setContent={updateContent}
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
