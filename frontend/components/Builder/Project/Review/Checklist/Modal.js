import React from "react";
import { Button, Header, Image, Modal, Icon } from "semantic-ui-react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

const StyledModal = styled.div`
  display: grid;
  margin: 50px 50px 50px 50px;
  .title {
    font-family: Roboto;
    font-size: 24px;
    font-style: normal;
    font-weight: 400;
    line-height: 30px;
    letter-spacing: 0em;
    text-align: left;
    color: #1a1a1a;
  }
  .content {
    margin: 15px 0px 40px 0px;
    font-family: Roboto;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0em;
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
  font-family: Lato;
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
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
  const { t } = useTranslation("builder");

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
              {t("checklist.exportProposal", "Export your proposal")}
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
            {t("checklist.markAsComplete", "Mark as complete")}
          </StyledButton>
        </StyledButtons>
      </StyledModal>
    </Modal>
  );
}

export default CheckModal;
