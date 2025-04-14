import styled, { keyframes } from "styled-components";

export const StyledBuilder = styled.div`
  display: grid;
`;

export const StyledBuilderArea = styled.div`
  display: grid;
  height: 100vh;
  width: 100%;
  grid-template-rows: auto 1fr;
  .newProject {
    background: #f7f9f8;
    display: grid;
    width: 100%;
    height: 100vh;
    justify-content: center;
    align-content: center;
    .modalEmpty {
      display: grid;
      grid-gap: 12px;
      max-width: 526px;
      text-align: center;
      font-family: "Nunito";
      font-style: normal;
      font-weight: 400;
      color: #6c6c6c;
      .title {
        font-size: 24px;
        line-height: 32px;
      }
      .subtitle {
        font-size: 17px;
        line-height: 23px;
      }
      .backBtn {
        margin: 15px auto;
        padding: 10px 24px;
        font-weight: 600;
        font-size: 20px;
        line-height: 20px;
        border: 1px solid green;
        border-radius: 20px;
        width: 200px;
      }
    }
    .modal {
      display: grid;
      grid-gap: 15px;
      background: #ffffff;
      padding: 24px 32px;
      border-radius: 8px;
      max-width: 360px;
      .title {
        font-family: Lato;
        font-size: 18px;
        font-weight: 600;
        line-height: 20px;
        color: var(--neutral_black1, #171717);
        margin: 5px 0px;
      }
      .message {
        font-family: Lato;
        font-size: 10px;
        font-weight: 400;
        line-height: 16px;
        color: #8a919d;
      }
      button {
        padding: 5px 20px;
        background: #b0b0b3;
        width: fit-content;
        border-radius: 50px;
        border: 1px solid #b0b0b3;
        font-family: Lato;
        font-size: 10px;
        font-weight: 700;
        line-height: 18px;
        text-align: center;
        color: #ffffff;
      }
    }
  }
  .navigation {
    display: grid;
    .on {
    }
    .off {
      background: lightGrey;
      border: 1px solid lightGrey;
    }
    .firstLineNewProject {
      display: grid;
      grid-gap: 1rem;
      grid-template-columns: auto 1fr;
      padding: 7px 10px;
      .centralPanel {
        display: grid;
        justify-items: center;
        font-family: Lato;
        font-size: 15px;
        font-weight: 400;
        line-height: 20px;
        text-align: center;
        color: #d0c9d6;
      }
    }
    .firstLine {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-gap: 20px;
      padding: 7px 10px;
      background: #ffffff;
      box-shadow: 0px 2px 20px rgba(0, 0, 0, 0.07);
      .leftPanel {
        display: grid;
        grid-gap: 20px;
        grid-template-columns: auto 1fr;
        align-items: center;
        .studyVersion {
          margin: 0px 10px;
          color: grey;
        }
      }
      .rightPanel {
        display: grid;
        grid-gap: 20px;
        grid-template-columns: auto auto auto auto;
        .icon {
          display: grid;
          align-items: center;
          justify-items: center;
          width: 42px;
          height: 42px;
          background: #f3f5f6;
          border-radius: 20px;
          cursor: pointer;
        }
      }
    }
    .secondLine {
      padding: 0px 15px;
      background: #e8ebef;
      box-shadow: 0px 2px 20px rgba(0, 0, 0, 0.07);
    }
  }
  .board {
    display: grid;
    height: 100%;
  }
  .connectArea {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-gap: 5px;
    justify-content: center;
    align-content: center;
    align-items: center;
    cursor: pointer;
    .icons {
    }
    .buttons {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr auto;
      justify-items: end;
      grid-gap: 10px;
      button {
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
  .pyodideLoadingMessage {
    position: absolute;
    width: 100%;
    z-index: 1;
    padding: 10px;
  }
`;

export const StyledCanvasBuilder = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  padding: 0px;
  height: 100%;
  background: #f4f5f5;
  box-shadow: 0px 2px 20px rgba(0, 0, 0, 0.07);
  position: relative;

  .lockedMessageOverlay {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 230, 230, 0.95);
    border: 1px solid #cc0000;
    color: #cc0000;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    max-width: 400px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    h3 {
      margin: 0 0 10px;
      font-size: 24px;
    }
    p {
      margin: 0;
      font-size: 16px;
    }
  }

  .sidepanel {
    display: grid;
    align-content: baseline;
    height: 85vh;
    overflow-y: auto;
    background: #ffffff;
    padding: 10px;
    .studyFlow {
      margin: 0rem;
    }
    .studySettings {
      margin: 1rem;
      display: grid;
      grid-gap: 2rem;
      .studyVersion {
        display: grid;
        grid-gap: 1rem;
        .studyVersionHeader {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-gap: 1rem;
          align-items: center;
          .studyVersionHeaderNote {
            color: grey;
          }
        }
        .studyVersionInfo {
          display: grid;
          grid-gap: 0.5rem;
          background: white;
          margin: 1rem 0rem;
          padding: 1rem;
          border-radius: 5px;
          .studyVersionInfoDescription {
            color: grey;
          }
        }
      }
      .switch {
        display: grid;
        grid-template-columns: 1fr auto auto;
        grid-gap: 1rem;
        align-items: center;
        .deleteBtn {
          background: darkred;
          border: 1px solid darkred;
        }
      }
    }
  }

  .board {
    display: grid;
    grid-template-columns: 5fr 3fr;
    height: 100%;
    position: relative;
    :active {
      .up-port:hover {
        border: 5px solid #ffc107;
        width: 378px;
        height: 128px;
      }
    }
  }

  .addCommentButton {
    position: absolute;
    z-index: 10;
    left: 10px;
    top: 10px;
    background: #007c70;
    border: 1px solid #007c70;
    border-radius: 100px;
    padding: 8px 20px;
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
    text-align: center;
    color: #ffffff;
    cursor: pointer;
    :hover {
      transform: scale(1.1);
      transition: transform 0.5s;
    }
    :disabled {
      background: #cccccc;
      border-color: #cccccc;
      cursor: not-allowed;
    }
  }

  .addAnchorButton {
    position: absolute;
    z-index: 10;
    left: 170px;
    top: 10px;
    background: #e9ecef;
    border: 1px solid #e9ecef;
    border-radius: 100px;
    padding: 8px 20px;
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
    text-align: center;
    color: black;
    cursor: pointer;
    :hover {
      transform: scale(1.1);
      transition: transform 0.5s;
    }
    :disabled {
      background: #cccccc;
      border-color: #cccccc;
      cursor: not-allowed;
    }
  }

  .background {
    position: fixed;
    height: 100%;
    width: 100%;
    top: 0;
    right: 0;
    background: rgba(188, 188, 188, 0.7);
    backdrop-filter: blur(4px);
    z-index: 2;
  }

  .modal {
    display: grid;
    background: #f4f5f5;
    align-content: baseline;
    box-shadow: 0px 2px 20px rgba(0, 0, 0, 0.07);
    position: fixed;
    height: 100%;
    top: 0;
    right: 0;
    min-width: 80%;
    max-width: 90%;
    bottom: 0;
    transition: all 0.3s;
    box-shadow: 0 0 10px 3px rgba(0, 0, 0, 0.2);
    z-index: 5;
    overflow-y: auto;
  }

  svg {
    overflow: visible;
  }

  .taskViewerHeader {
    display: grid;
    grid-template-columns: 70% auto;
    grid-gap: 20px;
    padding: 50px;
    background: #ffffff;
    .rightPanel {
      padding-top: 50px;
    }
  }

  .taskViewerButtons {
    width: 100%;
    display: grid;
    grid-gap: 10px;
    justify-items: end;
    button {
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
    .addBtn {
      background: #007c70;
      color: white;
      border-radius: 100px;
      border: 0px;
    }
    .previewBtn {
      background: #e9ecef;
      color: black;
      border-radius: 100px;
      border: 0px;
    }
    .closeBtn {
      position: absolute;
      top: 1%;
      right: 1%;
      width: 2.2em;
      line-height: 2em;
      text-align: center;
      cursor: pointer;
      border-radius: 2.25em;
      background-color: #007c70;
      color: white;
      padding-bottom: 5px;
      font-size: 2em;
      :hover {
        transform: scale(1.1);
        transition: transform 0.5s;
      }
    }
  }

  .taskViewerContent {
    display: grid;
    grid-template-columns: 60% auto;
    column-gap: 1px;
    .leftPanel {
      display: grid;
      grid-gap: 15px;
      padding: 50px 70px 0px 70px;
      background-color: #f7f9f8;
    }
    .rightPanel {
      display: grid;
      grid-gap: 15px;
      padding: 50px;
      background-color: #f7f9f8;
    }
    .contentBlock {
      ul {
        padding-left: 20px;
      }
    }
    .symbolBlock {
      background: #ffffff;
      box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.07);
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 50px;
    }
    p,
    li,
    span {
      font-size: 16px;
    }
    img {
      width: 100%;
    }
  }

  .portsEditor {
    display: grid;
    margin: 20px 30px;
    .navigation {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 50px 1fr auto;
      align-items: center;
      .goBackBtn {
        font-size: 30px;
        cursor: pointer;
      }
    }
    .port {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 100px 2fr 1fr 1fr 1fr;
      margin: 10px 0px;
      align-items: center;
      input,
      select {
        width: 100%;
        height: 46px;
        font-family: Lato;
        font-size: 16px;
        background: #ffffff;
        border: 1px solid #cccccc;
        border-radius: 4px;
        padding: 0px 0px 0px 10px;
      }
    }
    .footer {
      display: grid;
      margin: 30px 0px;
    }
  }

  .editPane {
    display: grid;
    width: 100%;
    align-content: baseline;
    resize: horizontal;
    .header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-gap: 10px;
      padding: 0px 1px 20px 0px;
    }
    .createdByDropdown {
      display: grid !important;
      align-items: center !important;
      border: 1px solid #cccccc !important;
    }
    .blocksMenu {
      .blocksMenuTitle {
        display: grid;
        grid-template-columns: 1fr auto;
        padding: 20px 25px 15px 30px;
        h3 {
          font-family: "Inter";
          font-style: normal;
          font-weight: 500;
          font-size: 16px;
          line-height: 150%;
          color: #1a1a1a;
        }
        p {
          font-family: "Inter";
          font-style: normal;
          font-weight: 400;
          font-size: 16px;
          line-height: 150%;
          color: #666666;
        }
      }
      .blocksMenuContent {
        overflow-y: auto;
        max-height: 40vh;
      }
      .blocksMenuSurveyBuilder {
        padding: 10px 25px 0px 30px;
        overflow-y: auto;
        max-height: 40vh;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 2rem;
      }
    }
    label {
      display: block;
    }
    input,
    select {
      width: 100%;
      height: 46px;
      font-family: Lato;
      font-size: 16px;
      background: #ffffff;
      border: 1px solid #cccccc;
      border-radius: 4px;
      padding: 0px 0px 0px 10px;
    }
    input[type="checkbox"] {
      width: 24px;
      height: 24px;
    }
    textarea {
      width: 100%;
      font-family: Lato;
      font-size: 16px;
      border: 1px solid #e6e6e6;
      border-radius: 4px;
      &:focus {
        outline: 0;
        background: mintcream;
        border-color: ${(props) => props.theme.red};
      }
    }
    .discoverMenu {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      margin: 20px 6px 29px 6px !important;
      cursor: pointer;
      .discoverMenuTitle {
        padding-bottom: 10px !important;
        display: grid;
        justify-content: center;
        border-bottom: 2px solid #e6e6e6;
        p {
          font-size: 18px;
        }
      }
      .selectedMenuTitle {
        border-bottom: 4px solid #ffc107 !important;
        p {
          color: #1a1a1a;
        }
      }
    }
    .consentSelector {
      margin-top: 10px;
      margin-bottom: 10px;
    }
    .closeBtnContainerEdit {
      display: grid;
      justify-self: end;
    }
    .closeBtnEdit {
      display: grid;
      justify-self: end;
      cursor: pointer;
      color: #5f6871;
      margin: 0px -35px 0px 0px;
      font-size: 2.5rem;
      :hover {
        transform: scale(1.2);
        transition: transform 0.5s;
      }
    }
  }
`;

export const StyledCard = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 30px 4fr 1fr;
  grid-gap: 10px;
  background: #ffffff;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.07);
  border-radius: 8px;
  margin-bottom: 10px;

  border-top: 8px solid;
  border-top-color: ${(props) =>
    props.taskType === "TASK"
      ? "#64c9e2"
      : props.taskType === "SURVEY"
      ? "#28619e"
      : props.taskType === "BLOCK"
      ? "#ffc7c3"
      : props.taskType === "DESIGN"
      ? "#007c70"
      : "#FFE29D"};

  .addBlock {
    margin: 0px 10px;
  }
  .movableCard {
    display: grid;
    width: 100%;
    height: 100%;
  }
  .icons {
    display: grid;
    align-items: center;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px;
    padding: 16px;
    .icon {
      display: grid;
      align-items: center;
      justify-items: center;
      background: #f3f5f6;
      width: 42px;
      height: 42px;
      border-radius: 20px;
      cursor: pointer;
    }
  }
`;

export const StyledParticipantPage = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  padding: 0px;
  height: 90vh;
  .preview {
    background: #fbfaf7;
    display: grid;
    height: 100%;
    grid-template-columns: 1fr;
    overflow: auto;
    grid-gap: 3rem;
    padding: 30px 50px;
    overflow-y: scroll;

    input,
    textarea,
    select {
      background: #fbfaf7;
      width: 100%;
      border: 1px solid #e6e6e6;
      border-radius: 4px;
      &:focus {
        outline: 0;
        background: white;
        border-color: mintcream;
      }
    }

    .studyInformation {
      display: grid;
      justify-items: center;
      grid-gap: 1rem;

      .title {
        font-family: "Inconsolata";
        font-style: normal;
        font-weight: 400;
        font-size: 48px;
        line-height: 60px;
        text-align: center;
        color: #1a1a1a;
        width: 953px;
      }

      .description {
        font-family: "Inconsolata";
        font-style: normal;
        font-weight: 400;
        font-size: 24px;
        line-height: 30px;
        text-align: center;
        color: #666666;
        width: 758px;
      }
    }

    .details {
      display: grid;
      align-items: baseline;
      width: 1125px;
      justify-self: center;
      grid-template-columns: 5fr 2fr;
      grid-gap: 10rem;
      /* border-opacity: 0.5; */
      border-top: 14px solid #f2f2f2;
      .leftPanel {
        display: grid;
      }
      .rightPanel {
        display: grid;
      }
    }

    .timeInformationBlock {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin: 40px 0px 30px 0px;
      .completeTimeLine {
        display: grid;
        grid-template-columns: 24px auto;
      }
    }

    .infoTabsContainer {
      display: grid;
      align-items: center;
      grid-template-columns: auto 100px;
      grid-gap: 5px;
      .tabHeaderContainer {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 5px;
      }
      input {
        font-family: Lato;
        font-style: normal;
        font-weight: normal;
        font-size: 16px;
        line-height: 24px;
        color: #666666;
        border: 0px solid;
      }
      input: focus {
        border: 1px solid red;
      }
      .menu {
        width: 100%;
        display: grid;
        grid-gap: 10px;
        grid-template-columns: repeat(auto-fill, 100px);
        margin: 10px 0px 0px 0px;
        .menuTitle {
          display: grid;
          align-items: center;
          justify-items: center;
          grid-template-columns: 1fr;
          border-bottom: 2px solid #e8ebef;
          padding-bottom: 10px;
          cursor: pointer;
        }
        .titleWithIcon {
          display: grid;
          grid-gap: 5px;
          grid-template-columns: auto 1fr;
        }
        .selectedMenuTitle {
          border-bottom: 4px solid #ffc107;
        }
      }
    }

    .uploadImageContainer {
      .upload-btn-wrapper {
        position: relative;
        overflow: hidden;
        display: inline-block;
        background: #f2f2f2;
        padding: 65px 52px 65px 52px;
        margin-bottom: 10px;
      }

      .upload-btn-wrapper-with-image {
        position: relative;
        overflow: hidden;
        display: inline-block;
        margin-bottom: 10px;
      }

      .btn {
        color: white;
        background-color: white;
        padding: 14px 18px;
        border-radius: 4px;
        font-size: 18px;
        background: #b3b3b3;
        border: 2px solid #b3b3b3;
        font-family: Lato;
        font-style: normal;
        font-weight: 400;
        line-height: 18px;
        letter-spacing: 0.05em;
        text-align: center;
      }

      .upload-btn-wrapper input[type="file"] {
        font-size: 100px;
        position: absolute;
        left: 0;
        top: 0;
        opacity: 0;
      }
      .upload-btn-wrapper-with-image input[type="file"] {
        font-size: 100px;
        position: absolute;
        left: 0;
        top: 0;
        opacity: 0;
      }
    }
  }
  .settings {
    display: grid;
    align-content: baseline;
    grid-gap: 18px;
    background: #f4f5f5;
    box-shadow: 0px 2px 20px rgba(0, 0, 0, 0.07);
    padding: 30px;
    overflow-y: scroll;
    width: 494px;
    .studyDescription {
      display: grid;
      .selector {
        margin: 10px 0px;
        font-style: normal;
        font-weight: 500;
        font-size: 16px;
        line-height: 150%;
        color: #1a1a1a;
      }
    }
    .card {
      display: grid;
      padding: 20px 30px;
      background: #ffffff;
      box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.07);
      border-radius: 8px;
      margin: 10px 0px;
      .accessLink {
        cursor: pointer;
        padding: 15px 10px 15px 10px;
        background: #ffffff;
        border: 1px solid #ced4da;
        box-shadow: 0px 2px 2px rgba(33, 37, 41, 0.06),
          0px 0px 1px rgba(33, 37, 41, 0.08);
        border-radius: 8px;
      }
      .highlight {
        background: #fff3cd;
      }
      input {
        padding: 10px 10px 10px 10px;
        background: #ffffff;
        border: 1px solid #ced4da;
        box-shadow: 0px 2px 2px rgba(33, 37, 41, 0.06),
          0px 0px 1px rgba(33, 37, 41, 0.08);
        border-radius: 8px;
        width: 100%;
        margin-bottom: 5px;
      }
    }
    .settingsBlock {
      display: grid;
      grid-template-columns: 1fr 70px;
      grid-gap: 16px;
      justify-items: start;
      border-radius: 5px;
      .ui.toggle.checkbox input:checked ~ .box:before,
      .ui.toggle.checkbox input:checked ~ label:before {
        background-color: #007c70 !important;
      }
    }
  }
`;

export const StyledCollectPage = styled.div`
  display: grid;
  width: 100%;
  overflow-y: scroll;
  background: rgb(229, 229, 229);
  .clickable {
    cursor: pointer;
  }
  .collectBoard {
    display: grid;
    max-width: 1600px;
    margin: 45px 0px 45px 0px;
    width: 100%;
    justify-self: center;
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "participants";
    grid-gap: 20px;
    align-content: baseline;

    .header {
      display: grid;
      grid-area: header;
      grid-gap: 10px;
    }
    .participants {
      grid-area: participants;
    }
    .noresponses {
    }

    .study {
      background: #ffffff;
      padding: 2rem;
      display: grid;
      grid-gap: 20px;
      grid-template-columns: 1fr 1fr 1fr;
      border-radius: 4px;
      align-items: baseline;

      .shareStudy {
        display: grid;
        align-items: baseline;
      }

      .downloadOptions {
        display: grid;
        grid-gap: 15px;
        grid-template-columns: 1fr;
        .downloadArea {
          display: grid;
          grid-gap: 5px;
          grid-template-columns: auto 1fr;
          align-items: center;
          cursor: pointer;
        }
      }
      .downloadByComponent {
        display: grid;
        grid-gap: 10px;
        cursor: pointer;
      }
      .buttons {
        display: grid;
        grid-gap: 5px;
        grid-template-columns: auto auto;
        justify-content: start;
      }
      button {
        font-size: 18px;
        line-height: 100%;
        letter-spacing: 0.05em;
        color: #007c70;
        border: 2px solid #007c70;
        cursor: pointer;
        border-radius: 4px;
        padding: 1rem 3rem;
        background: none;
      }
    }

    .searchArea {
      display: grid;

      span {
        font-size: 18px;
        margin-bottom: 0.5rem;
      }
      input {
        font-family: Lato;
        border: 1px solid #cccccc;
        border-radius: 4px;
        width: 100%;
        font-size: 20px;
        padding: 12px;
        &:focus {
          outline: 0;
          border-color: ${(props) => props.theme.red};
        }
      }
    }
    .participantsBoard {
      display: grid;
      margin: 0px 1rem;
      .tableHeader {
        display: grid;
        padding: 10px;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        grid-gap: 2rem;
        p {
          font-weight: bold;
        }
      }
      .tableRow {
        display: grid;
        margin: 5px 0px;
        padding: 10px 10px;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        grid-gap: 2rem;
        background: white;
        align-items: center;
        .switcher {
          height: 2rem;
          display: grid;
          justify-items: start;
        }
      }

      .ui.toggle.checkbox input:checked ~ .box:before,
      .ui.toggle.checkbox input:checked ~ label:before {
        background-color: #007c70 !important;
      }
    }
  }
  .participantPage {
    display: grid;
    max-width: 1100px;
    margin: 45px 0px 45px 0px;
    width: 100%;
    justify-self: center;
    grid-template-columns: 1fr;
    grid-gap: 20px;
    align-content: baseline;
    .resultItem {
      display: grid;
      margin: 5px 0px;
      padding: 10px;
      grid-template-columns: repeat(auto-fit, minmax(30px, 1fr));
      background: white;
    }
    .infoItem {
      display: grid;
      margin: 5px 0px;
      padding: 10px;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      background: white;
    }
    .ui.toggle.checkbox input:checked ~ .box:before,
    .ui.toggle.checkbox input:checked ~ label:before {
      background-color: #007c70 !important;
    }
    .downloadArea {
      cursor: pointer;
    }
  }
`;

const loading = keyframes`
  from {
    background-position: 0 0;
  }

  to {
    background-position: 100% 100%;
  }
`;

export const StyledVisualizePage = styled.div`
  display: grid;
  width: 100%;
  overflow-y: auto;
  .board {
    margin: 10px;
  }
  .main {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: 5fr 4fr;
    height: 100%;
  }
  .dashboardArea {
    display: grid;
    margin: 20px 0px;
    justify-items: center;
    align-items: center;
  }
  .graphArea {
    display: grid;
    justify-items: center;
    align-items: center;
  }
  .buttons {
    display: grid;
    align-content: center;
    justify-content: center;
    width: 100%;
    label {
      font-family: "Lato";
      background: var(--green);
      border: 2px solid var(--green);
      border-radius: 4px;
      color: white;
      font-style: normal;
      font-weight: 400;
      font-size: 18px;
      line-height: 100%;
      padding: 10px 15px;
      cursor: pointer;
    }
    button {
      margin: 20px 0px;
    }
  }
  .dataTable {
    width: 100vw;
    overflow-x: scroll;
  }
  .specManager {
    display: grid;
    align-content: baseline;
    width: 100%;
    .upperPart {
      margin: 1rem;
      display: grid;
      grid-gap: 3rem;
      grid-template-columns: 1fr 4fr;
    }
    .header {
      display: grid;
      width: 100%;
      text-align: center;
      justify-items: center;
    }
    .scriptSelector {
      display: grid;
      width: 100%;
    }
    .savedScripts {
      display: grid;
      grid-gap: 2rem;
      margin: 1rem 0rem;
      padding: 2rem;
      border: 1px solid lightGrey;
      border-radius: 6px;
    }
    .savedScript {
      display: grid;
      grid-gap: 2rem;
      grid-template-columns: 2fr 4fr 2fr 2fr 3fr;
      .settingInfo {
        display: grid;
        grid-gap: 1rem;
        grid-template-columns: 1fr 1fr 1fr;
      }
    }

    .link {
      cursor: pointer;
      text-decoration: underline;
    }
    .checkboxField {
      font-family: Lato;
      font-style: normal;
      font-weight: normal;
      font-size: 18px;
      line-height: 24px;
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 1fr 14fr;
      align-items: center;
    }

    .visualizeScripts {
      display: grid;
      grid-gap: 1rem;
      margin: 1rem 0rem;
      padding: 1rem;
      border: 1px solid lightGrey;
      border-radius: 4px;
    }

    .visualizeScript {
      font-size: 14px;
      font-weight: normal;
      display: grid;
      grid-gap: 5px;
      grid-template-columns: 1fr 4fr 1fr 1fr;
    }

    .studyIdsInfo {
      display: grid;
      background: white;
      padding: 10px;
      grid-gap: 10px;
      .components {
        display: grid;
        grid-gap: 10px;
      }
      .componentHeader {
        display: grid;
        grid-gap: 5px;
        grid-template-columns: 1fr 1fr 1fr;
        font-weight: bold;
      }
      .componentRow {
        display: grid;
        grid-gap: 5px;
        grid-template-columns: 1fr 1fr 1fr;
      }
      .id {
        background: #ffc107;
        border: 1px solid lightGrey;
        border-radius: 5px;
        padding: 2px 10px;
      }
    }
  }
  .specManagerForm {
    display: grid;
    width: 100%;
    box-shadow: 0 0 5px 3px rgba(0, 0, 0, 0.05);
    border: 5px solid white;
    border-radius: 10px;
    padding: 10px;
    line-height: 1.5;
    font-weight: 600;
    label {
      display: block;
    }
    input,
    textarea,
    select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e6e6e6;
      padding: 10px;
      border-radius: 5px;
      &:focus {
        outline: 0;
        background: mintcream;
        border-color: ${(props) => props.theme.red};
      }
    }
    button,
    input[type="submit"] {
      width: 100%;
      background: #24b781;
      color: white;
      border: 0;
      border-radius: 5px;
      font-weight: 600;
      padding: 1rem 1.2rem;
    }
    fieldset {
      border: 0;
      padding: 0;

      &[disabled] {
        opacity: 0.5;
      }
      &::before {
        height: 10px;
        content: "";
        display: block;
        background-image: linear-gradient(
          to right,
          #208962 0%,
          #49e889 50%,
          #208962 100%
        );
      }
      &[aria-busy="true"]::before {
        background-size: 50% auto;
        animation: ${loading} 0.5s linear infinite;
      }
    }
  }
`;

export const StyledChatGPTPage = styled.div`
  display: grid;
  width: 100%;
  overflow-y: auto;
 
  .title {
    color: #000;
    text-align: center;
    font-family: Inter;
    font-size: 1.75rem;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
  }

  .subtitle {
      color: #000;
      margin-left: 25%;
      margin-right: 25%;
      text-align: center;
      font-family: Inter;
      font-size: 1.25rem;
      font-style: normal;
      font-weight: 400;
      line-height: normal; 
      margin-top: 1rem;
      margin-bottom: 2rem;
  }

  .text {
      color: #000;
      margin-left: 10%;
      margin-right: 10%;
      text-align: center;
      font-family: Inter;
      font-size: 1.25rem;
      font-style: normal;
      font-weight: 400;
      line-height: normal; 
  }


  input.promptInput {
      text-align: center;
      display:block; 
      line-height: 3.75rem;
      margin: auto;
      border-radius: 5rem;
      border: 1px solid #ABABAB;
      background: #FFF;
      box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
  }

  .row {
      display: flex;
      width: 100%;
  }

  .centered {
      display: block;
      margin-left: auto;
      margin-right: auto;
      justify-content: center;
      width: 20%;
      text-align: center;
  }

  .column {
      flex: 50%;
      flex-flow: column wrap;
      align-items: center;
  }

  .graph {
      display: block;
      margin-left: auto;
      margin-right: auto;
      margin-top: 30%;
      justify-content: center;
  }
  th, td {
      padding: 5px;
      border: 1px solid #ddd;
  }
  table {
      border-spacing: 0px;
  }
  .btn {
      border-radius: 1.8125rem;
      background: #007C70;
      text-align: center;
      color: white;
      padding: 5 px;
      margin-bottom: 10px;
      border: 2px solid #007C70;
      line-height: 3rem;
  }
  .btn:hover {
      background: #FFFFFF;
      color: #007C70;
  }
  .btn:active {
      background: #1A1A1A
      color: white;
  }
`;
