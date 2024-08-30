import styled from "styled-components";

export const StyledProposal = styled.div`
  display: grid;
  width: 100%;
  overflow-y: auto;
  padding: 20px;
  min-height: 80vh;
  background: #f7f9f8;
  .closeBtn {
    line-height: 3rem;
    text-align: center;
    cursor: pointer;
    border-radius: 2.25rem;
    color: #5f6871;
    font-size: 3rem;
    cursor: pointer;
    :hover {
      transform: scale(1.5);
      transition: transform 0.5s;
      color: red;
    }
  }

  button {
    display: grid;
    align-content: center;
    max-width: 300px;
    width: 100%;
    background: none;
    color: #666666;
    padding: 15px 10px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    cursor: pointer;
    font-family: Roboto;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: 0.05em;
    text-align: center;
  }

  .overview {
    display: grid;
    grid-gap: 1rem;
    margin: 3rem;
    align-content: baseline;
    .navigationHeader {
      display: grid;
      justify-content: end;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 200px;
      align-items: center;
    }
    .proposalHeader {
      display: grid;
      margin: 5px;
      padding: 10px;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      cursor: pointer;
      font-weight: bold;
    }
    .itemRow {
      display: grid;
      margin: 5px;
      padding: 10px;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      background: white;
      align-items: center;
      .actionLinks {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-gap: 1rem;
      }
    }
  }

  .empty {
    display: grid;
    margin: 10px 0px 20px 0px;
    grid-gap: 1rem;
    align-content: center;
    justify-content: center;
    justify-items: center;
    text-align: center;
    width: 100%;
  }

  .dropdown {
    width: 100%;
    height: auto;
  }

  .proposalBoard {
    display: grid;
    grid-template-rows: auto 1fr;
    width: max-content;
    margin: 20px;

    .previewToggle {
      display: grid;
      grid-template-columns: auto auto 1fr;
      grid-gap: 1rem;
      margin: 5px 0px 15px 0px;
      align-items: center;
      span {
        font-family: Roboto;
        font-size: 18px;
        font-style: normal;
        font-weight: 400;
        line-height: 24px;
        letter-spacing: 0.05em;
      }
      .goBackButton {
        cursor: pointer;
      }
      .preview {
        display: grid;
        grid-template-columns: auto auto;
        align-items: center;
      }
      .alert {
        background: #fff9e6;
        padding: 5px 10px 5px 10px;
        margin-left: 5px;
        border-radius: 4px;
        span,
        .icon {
          font-weight: 400;
          font-size: 13px;
          color: #666666;
        }
      }
    }
    .proposalPDF {
      display: grid;
      align-content: baseline;
      margin: 20px;
      max-width: 90vw;
      height: 100%;
    }
  }

  .newInput {
    display: grid;
    justify-content: stretch;
    text-align: start;
    margin: 30px 10px 0px 10px;
    input {
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      padding: 10px 10px 10px 10px;
      height: 50px;
      margin: 5px 0px 0px 0px;
    }
    .addBtn {
      display: grid;
      justify-self: center;
      margin: 10px 0px 5px 0px;
      cursor: pointer;
      text-align: center;
      padding: 5px;
      color: #007c70;
      width: fit-content;
    }
  }

  .inner {
    display: grid;
    grid-template-columns: 1fr auto;
    /* width: 90vw; */
    .scrollable {
      overflow-x: auto;
    }
  }

  .sections {
  }

  .section {
    display: grid;
    grid-gap: 0.5rem;
    position: relative;
    background: #f5f5f5;
    border: 1px solid #e6e6e6;
    border-radius: 8px;
    min-width: 250px;
    margin: 15px;
    padding: 0px 0px 20px 0px;
    .infoLine {
      margin: 0.2rem 0px 0px 3rem;
      display: grid;
      color: #b3b3b3;
    }
    .column-drag-handle {
      margin: 0px 0px 0px 0px;
      padding: 1rem 2rem 1rem 1rem;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      .firstLine {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 10px;
        justify-items: baseline;
        align-items: center;
        text-align: center;
      }
      .sectionTitle {
        font-family: Lato;
        font-size: 23px;
        font-style: normal;
        font-weight: 700;
        line-height: 27px;
        letter-spacing: 0em;
        text-align: center;
      }
      span {
        font-family: Lato;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 21px;
        letter-spacing: 0em;
        text-align: center;
      }
    }
    .deleteBtn {
      position: absolute;
      bottom: -5px;
      left: -5px;
      cursor: pointer;
      img {
        width: 20px;
        opacity: 0.1;
      }
      img: hover {
        opacity: 1;
      }
    }
  }

  .header {
    display: grid;
    margin-bottom: 20px;
    padding: 10px;
    input,
    textarea,
    select {
      background: #f6f9f8;
      width: 100%;
      border: 0px solid #e6e6e6;
      border-radius: 4px;
      &:focus {
        outline: 0;
        background: white;
        border-color: mintcream;
      }
    }
    button {
      background: #007c70;
      color: white;
      max-width: 256px;
      border-radius: 3px;
      cursor: pointer;
    }
    .title {
      font-family: Lato;
      font-size: 48px;
      font-style: normal;
      font-weight: 400;
      line-height: 56px;
      letter-spacing: 0em;
      text-align: left;
      color: #1a1a1a;
      margin-bottom: 23px;
    }
    .description {
      font-family: Lato;
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      line-height: 32px;
      letter-spacing: 0em;
      text-align: left;
      color: #666666;
    }
    .checkboxField {
      display: grid;
      grid-template-columns: 30px 1fr;
      grid-gap: 10px;
      align-items: center;
      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        color: green;
      }
    }
  }

  .cardPreview {
    display: grid;
    grid-gap: 10px;
    margin: 3rem;
    .description {
      background: #fbfaf7;
      padding: 10px 5px;
      border-radius: 7px;
    }

    .buttons {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr auto;
      justify-items: end;
      grid-gap: 10px;

      .button {
        cursor: pointer;
        border-radius: 4px;
        align-items: center;
        padding: 14px 24px;
        font-family: Lato;
        font-size: 18px;
        font-style: normal;
        font-weight: 400;
        line-height: 18px;
        letter-spacing: 0.05em;
        text-align: center;
      }
      .primary {
        background: #007c70;
        color: #ffffff;
        border: 2px solid #007c70;
      }
      .secondary {
        background: #ffffff;
        color: #666666;
        border: 2px solid #b3b3b3;
      }
    }
  }

  .post {
    display: grid;
    grid-row-gap: 10px;
    font-family: Lato;
    font-size: 18px;
    text-align: left;

    .lockedMessage {
      display: grid;
      grid-gap: 15px;
      align-items: center;
      grid-template-columns: 1fr auto;
      background: orange;
      padding: 15px;
      .username {
        font-weight: bold;
      }
      .buttonHolder {
        display: grid;
        button {
          background: white;
        }
      }
    }

    .buttons {
      width: auto;
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 200px 200px;
      justify-content: end;
      .primary {
        background: #007c70;
        color: #ffffff;
        border: 2px solid #007c70;
      }
      .secondary {
        background: #ffffff;
        color: #666666;
        border: 2px solid #b3b3b3;
      }
    }

    .proposalCardBoard {
      display: grid;
      grid-template-columns: 7fr 3fr;
      height: 100%;
    }

    .jodit-container {
      border: none !important;
    }

    label {
      display: block;
      font-style: normal;
      font-weight: normal;
      font-size: 14px;
      line-height: 20px;
    }
    input,
    textarea,
    select {
      border: 1px solid #cccccc;
      border-radius: 4px;
      width: 100%;
      font-size: 16px;
      line-height: 24px;
      padding: 12px;
      &:focus {
        outline: 0;
        border-color: ${(props) => props.theme.red};
      }
    }
    input[type="submit"] {
      margin-top: 3rem;
      margin-bottom: 1rem;
      width: 100%;
      background: #007c70;
      color: white;
      padding: 1.5rem 0.5rem;
      font-style: normal;
      font-weight: normal;
      font-size: 18px;
      line-height: 100%;
      border: 2px solid #007c70;
      border-radius: 4px;
      cursor: pointer;
    }
    fieldset {
      display: grid;
      justify-self: center;
      grid-gap: 5px;
      width: 100%;
      border: 0;
      padding: 0;
      &[disabled] {
        opacity: 0.5;
      }
    }
    .cardHeader {
      margin-bottom: 15px;
      font-family: Roboto;
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      line-height: 30px;
      letter-spacing: 0em;
      text-align: left;
    }
    .cardDescription {
      color: #666666;
      font-family: Roboto;
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px;
      letter-spacing: 0em;
      text-align: left;
      padding-bottom: 40px;
      margin-bottom: 44px;
      border-bottom: 2px solid #e6e6e6;
    }
    .textBoard {
      margin: 15px 10px 0px 20px;
    }
    .infoBoard {
      display: grid;
      grid-gap: 30px;
      align-content: baseline;
      border-radius: 0px 4px 4px 0px;
      padding: 53px 30px 30px 37px;
      font-family: Roboto;
      font-size: 16px;
      font-style: normal;
      font-weight: 500;
      line-height: 30px;
      letter-spacing: 0em;
      text-align: left;
      height: 100%;
    }
    .proposalCardComments {
      display: grid;
    }
  }

  .jodit {
    height: 100%;
    input,
    textarea,
    select {
      width: 100%;
      &:focus {
        outline: 0;
        background: white;
        border-color: mintcream;
      }
    }
    button {
      margin: 1px;
      border: 0px solid #e6e6e6;
      cursor: pointer;
    }
    .jodit-toolbar-button__button {
      background: transparent;
      color: black;
    }
    .jodit-ui-button__text {
      color: black;
    }
  }
`;

export const StyledProposalCard = styled.div`
  background: #ffffff;
  border: 1px solid #e6e6e6;
  box-sizing: border-box;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  margin: 3px 10px;
  position: relative;
  min-width: 264px;
  min-height: 71px;

  border-right: 8px solid;
  border-right-color: ${(props) =>
    props.type === "PROPOSAL"
      ? "#623A39"
      : props.type === "ASSIGNMENT"
      ? "#2C9389"
      : props.type === "LESSON"
      ? "#E06766"
      : props.type === "ARTICLE"
      ? "#28619E"
      : props.type === "SURVEY"
      ? "#007c70"
      : props.type === "LINK"
      ? "#C9D6CD"
      : "#FFE29D"};

  .card-drag-handle {
    display: grid;
    font-family: Lato;
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
    line-height: 24px;
    letter-spacing: 0em;
  }
  .deleteCardBtn {
    position: absolute;
    bottom: -5px;
    left: -5px;
    cursor: pointer;
    img {
      width: 20px;
      opacity: 0.1;
    }
    img: hover {
      opacity: 1;
    }
  }
  .card-information {
    display: grid;
    grid-template-columns: 40px 1fr;
    align-items: center;
    .status {
      color: #007c70;
      font-family: Lato;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
    }

    .info-assigned-container {
      display: grid;
      justify-items: baseline;
      grid-gap: 5px;
    }
    .info-assigned {
      display: grid;
      align-items: center;
      color: #666666;
      background: #ffffff;
      border: 1px solid #e6e6e6;
      box-sizing: border-box;
      border-radius: 60px;
      font-family: Lato;
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 0.05em;
      padding: 1px 7px 1px 7px;
    }
    .info-status {
      width: fit-content;
      display: grid;
      align-items: center;
      box-sizing: border-box;
      border: 1px solid transparent;
      border-radius: 60px;
      font-family: Lato;
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 0.05em;
      padding: 1px 7px 1px 7px;
    }
    .status-not-started {
      color: #896900;
      background: rgba(254, 210, 79, 0.18);
    }
    .status-started {
      color: #0063ce;
      background: rgba(0, 117, 224, 0.12);
    }
    .status-needs-feedback {
      color: #c92927;
      background: rgba(224, 103, 102, 0.12);
    }
    .status-feedback-given {
      color: #6f25ce !important;
      background: rgba(111, 37, 206, 0.12) !important;
    }
    .status-completed {
      color: #00635a;
      background: rgba(0, 124, 112, 0.12);
    }
    img {
      width: 20px !important;
    }
    .card-left-side {
      display: grid;
      justify-content: center;
    }
    .card-right-side {
      display: grid;
      margin: 0px 5px 5px 5px;
      .card-type {
        display: grid;
        justify-content: end;
        font-family: Lato;
        font-size: 8px;
        font-weight: 600;
        line-height: 13px;
        text-align: center;
        span {
          margin-top: 5px;
          border-radius: 10px;
          padding: 1px 8px 1px 8px;
          background: ${(props) =>
            props.type === "PROPOSAL"
              ? "#ebe5e5"
              : props.type === "ASSIGNMENT"
              ? "#98cbc6"
              : props.type === "LESSON"
              ? "#f9e1df"
              : props.type === "ARTICLE"
              ? "#b8d2ec"
              : props.type === "SURVEY"
              ? "#FFC107"
              : props.type === "LINK"
              ? "#C9D6CD"
              : "#FFE29D"};
          color: ${(props) =>
            props.type === "PROPOSAL"
              ? "#623A39"
              : props.type === "ASSIGNMENT"
              ? "#004A43"
              : props.type === "LESSON"
              ? "#E06766"
              : props.type === "ARTICLE"
              ? "#28619E"
              : props.type === "SURVEY"
              ? "#856502"
              : props.type === "LINK"
              ? "#3C443E"
              : "#FFE29D"};
        }
      }
      .card-title {
        display: grid;
        grid-template-columns: 1fr auto;
        margin-bottom: 5px;
      }
      .editedByAvatar {
        display: grid;
        align-content: end;
      }
    }
  }
`;
