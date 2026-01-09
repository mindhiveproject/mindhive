import { useState } from "react";
import styled from "styled-components";

import { Modal } from "semantic-ui-react";
import TipTapEditor from "../../../../TipTap/Main";

import StyledModal from "../../../../styles/StyledModal";
import ClassSelector from "./ClassSelector";
import useTranslation from "next-translate/useTranslation";

// Styled button matching Figma design (Primary Action - Teal)
const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  font-family: Lato;
  font-size: 18px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
  text-align: center;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: #336F8A;
  color: #ffffff;
  
  &:hover {
    background: #ffc107;
    color: #1a1a1a;
  }
  
  &:active {
    background: #4db6ac;
    color: #1a1a1a;
  }
  
  &:disabled {
    background: #e0e0e0;
    color: #9e9e9e;
    cursor: not-allowed;
  }
`;

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
            <PrimaryButton
              onClick={() => {
                submit();
                setOpen(false);
              }}
            >
              {btnName}
            </PrimaryButton>
          </StyledModal>
        </Modal.Description>
      </Modal.Content>
    </Modal>
  );
}
