import React from "react";
import { Button, Header, Image, Modal, Icon } from "semantic-ui-react";
import styled from "styled-components";

const StyledModal = styled.div`
  display: grid;
  margin: 50px 50px 50px 50px;
  .title {
    font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
    letter-spacing: 0;
    text-align: left;
    color: #1a1a1a;
  }
  .content {
    margin: 15px 0px 40px 0px;
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    text-align: left;
  }
`;

const StyledButtons = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  justify-items: start;
  grid-gap: 30px;
  .incomplete {
    background: #ffffff;
    border: 2px solid #b3b3b3;
  }
  .complete {
    background: #e6f2f1;
    border: 2px solid #007c70;
  }
`;

const StyledButton = styled.button`
  display: grid;
  grid-template-columns: 1fr auto;
  grid-gap: 10px;
  cursor: pointer;
  border-radius: 4px;
  align-items: center;
  padding: 14px 20px;
  font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
  letter-spacing: 0;
  text-align: center;
  color: #666666;
`;

function CheckModal({
  name,
  title,
  description,
  action,
  takeAction,
  isComplete,
  toggleCheckTo,
  isSubmitted,
}) {
  const [open, setOpen] = React.useState(false);

  const mark = () => {
    toggleCheckTo(name, !isComplete);
  };

  return (
    <Modal
      closeIcon
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      dimmer="blurring"
      trigger={
        <div className="triggerArea">
          <strong>{title}</strong>
        </div>
      }
    >
      <StyledModal>
        <div className="title">{title}</div>

        <div className="content">{description}</div>

        <StyledButtons>
          {action && (
            <StyledButton
              className="incomplete"
              onClick={() => takeAction(action)}
            >
              <Icon name="download" />
              Export your proposal
            </StyledButton>
          )}
          <StyledButton
            className={isComplete ? "complete" : "incomplete"}
            onClick={() => {
              if (isSubmitted) {
                return;
              }
              mark();
            }}
          >
            <Icon name="check" />
            Mark as complete
          </StyledButton>
        </StyledButtons>
      </StyledModal>
    </Modal>
  );
}

export default CheckModal;
