import styled from "styled-components";

const StyledModal = styled.div`
  display: grid;
  grid-gap: 10px;
  margin: 30px 20px;
  /* justify-content: center; */
  align-items: stretch;
  /* text-align: center; */

  input,
  textarea,
  select {
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    height: 48px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    width: 100%;
    padding: 12px;
    &:focus {
      outline: 0;
      border-color: ${(props) => props.theme.red};
    }
  }

  .message {
    margin-top: 180px;
    background: #fff3cd;
    border-radius: 4px;
    padding: 66px 86px 66px 86px;
  }
  h2 {
    font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
    letter-spacing: 0;
    /* text-align: center !important; */
  }
  p {
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    /* text-align: center !important; */
  }
  .selectUser {
    margin: 10px 0px;
  }
  .red {
    color: red;
  }
  .centeredHeader {
    display: grid;
    justify-content: center;
  }
  .linkedProjects {
    display: grid;
    background: red;
  }
  .classNetworkDetail {
    display: grid;
    gap: 28px;

    p {
      margin: 0;
      font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
    }
  }
  .classNetworkDetailTitle {
    margin: 0;
    color: #171717;
    font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
    letter-spacing: 0;
  }
  .classNetworkDetailDescription {
    color: #3d3d3d;
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
  }
  .classNetworkDetailSummary {
    display: grid;
    gap: 16px;
  }
  .classNetworkDetailRow {
    display: grid;
    gap: 10px;
    padding: 18px 20px;
    border: 1px solid #ece9e6;
    border-radius: 14px;
    background: #fbfbfa;
  }
  .classNetworkDetailLabel {
    color: #625b71;
    font: var(--MH-Type-Title-Small, 600 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
  }
  .classNetworkDetailValue {
    color: #171717;
    font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
  }

  .classNetworkDetailNames {
    display: grid;
    gap: 12px;
    margin: 4px 0 0;
    padding-left: 20px;
    color: #3d3d3d;
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
  }
  .classNetworkAdmins {
    display: grid;
    gap: 18px;
    padding: 20px;
    border: 1px solid #ece9e6;
    border-radius: 14px;
    background: #ffffff;
  }
  .classNetworkAdminsHeader {
    display: grid;
    gap: 8px;

    h4 {
      margin: 0;
      color: #171717;
      font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
    }

    p {
      color: #625b71;
      font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
      letter-spacing: 0;
    }
  }
  .classNetworkAdminList {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .classNetworkAdminRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    border: 1px solid #ece9e6;
    border-radius: 12px;
    background: #fbfbfa;

    div {
      display: grid;
      gap: 6px;
      min-width: 0;
    }

    strong {
      overflow: hidden;
      color: #171717;
      font: var(--MH-Type-Title-Small, 600 14px/20px "Inter", sans-serif);
      letter-spacing: 0;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      overflow: hidden;
      color: #625b71;
      font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
      letter-spacing: 0;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .classNetworkEmailButton {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    margin: 0;
    padding: 2px 0;
    border: none;
    background: transparent;
    color: #336f8a;
    font: var(--MH-Type-Label-Small, 600 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
    text-align: left;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      color: #1f4f63;
    }

    &:focus-visible {
      outline: 2px solid #336f8a;
      outline-offset: 2px;
      border-radius: 2px;
    }
  }
  .classNetworkAdminEmpty {
    color: #625b71;
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
  }
  .classNetworkAdminForm {
    display: grid;
    gap: 12px;

    label {
      color: #171717;
      font: var(--MH-Type-Title-Small, 600 14px/20px "Inter", sans-serif);
      letter-spacing: 0;
    }
  }
  .classNetworkAdminFormRow {
    display: grid;
    gap: 12px;
    grid-template-columns: minmax(0, 1fr) auto;

    input {
      height: 42px;
      font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
      letter-spacing: 0;
    }
  }
  .classNetworkAdminFeedback {
    color: #1d6b3a;
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    letter-spacing: 0;

    &.error {
      color: #871b16;
    }
  }
  .modalTwoSideContent {
    display: grid;
    align-content: baseline;
    grid-template-columns: 1fr 1fr;
    grid-gap: 20px;
    margin: 10px 0px;
    min-height: 150px;
    .firstSide {
      display: grid;
      align-content: baseline;
    }
    .secondSide {
      display: grid;
      grid-gap: 10px;
      align-content: baseline;
    }
  }
  .footer {
    display: grid;
    justify-items: end;
    margin: 20px;
  }
`;

export const StyledModalHeader = styled.div`
  display: grid;
  grid-template-columns: 70% auto;
  grid-gap: 20px;
  padding: 50px;
  background: #ffffff;
  .rightPanel {
    padding-top: 50px;
  }
`;

export const StyledModalButtons = styled.div`
  width: 100%;
  display: grid;
  grid-gap: 10px;
  justify-items: end;
  button {
    cursor: pointer;
    border-radius: 4px;
    align-items: center;
    padding: 14px 24px;
    font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
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
    background: rgb(0, 124, 112);
    color: rgb(255, 255, 255);
    border: 2px solid rgb(0, 124, 112);
  }
`;

export default StyledModal;
