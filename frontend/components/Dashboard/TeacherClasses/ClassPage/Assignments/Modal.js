import { useState } from "react";

import { Modal } from "semantic-ui-react";
import JoditEditor from "../../../../Jodit/Editor";

import StyledModal from "../../../../styles/StyledModal";
import ClassSelector from "./ClassSelector";
import useTranslation from "next-translate/useTranslation";

export default function AssignmentModal({
  btnName,
  assignment,
  inputs,
  handleChange,
  submit,
  children,
  user,
}) {
  const { t } = useTranslation("classes");
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
              <p>{t("assignment.title")}</p>
              <input
                type="text"
                id="title"
                name="title"
                value={inputs?.title}
                onChange={handleChange}
                required
              />
            </label>
            <p><br></br>Instruction for your students:</p>
            <JoditEditor
              content={inputs?.content}
              setContent={(content) =>
                handleChange({ target: { name: "content", value: content } })
              }
            />
            <p><br></br>Place holder for your students:</p>
            <JoditEditor
              content={inputs?.placeholder}
              setContent={(placeholder) =>
                handleChange({ target: { name: "placeholder", value: placeholder } })
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
