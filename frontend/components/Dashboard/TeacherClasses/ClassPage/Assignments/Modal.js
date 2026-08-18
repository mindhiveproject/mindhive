import { useState } from "react";

import { Modal } from "semantic-ui-react";
import TipTapEditor from "../../../../TipTap/Main";

import StyledModal from "../../../../styles/StyledModal";
import ClassSelector from "./ClassSelector";
import useTranslation from "next-translate/useTranslation";
import Button from "../../../../DesignSystem/Button";

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
              <TipTapEditor 
                content={inputs?.title || ""} 
                onUpdate={(content) =>
                  handleChange({ target: { name: "title", value: content } })
                }
                isEditable={true}
                toolbarVisible={false}
              />
            </label>
            <p><br />Instruction for your students:</p>
            <TipTapEditor
              content={inputs?.content || ""}
              onUpdate={(content) =>
                handleChange({ target: { name: "content", value: content } })
              }
              isEditable={true}
              toolbarVisible={true}
            />
            <p><br />Place holder for your students:</p>
            <TipTapEditor
              content={inputs?.placeholder || ""}
              onUpdate={(placeholder) =>
                handleChange({ target: { name: "placeholder", value: placeholder } })
              }
              isEditable={true}
              toolbarVisible={true}
            />
            <Button
              variant="filled"
              onClick={() => {
                submit();
                setOpen(false);
              }}
            >
              {btnName}
            </Button>
          </StyledModal>
        </Modal.Description>
      </Modal.Content>
    </Modal>
  );
}
