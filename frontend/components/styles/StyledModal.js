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
    font-family: Lato;
    height: 48px;
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

  .message {
    margin-top: 180px;
    background: #fff3cd;
    border-radius: 4px;
    padding: 66px 86px 66px 86px;
  }
  h2 {
    font-family: Lato;
    font-size: 24px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.05em;
    /* text-align: center !important; */
  }
  p {
    font-family: Lato;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.05em;
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
    gap: 18px;

    p {
      margin: 0;
      font-family: "Inter", sans-serif;
      letter-spacing: normal;
    }
  }
  .classNetworkDetailTitle {
    margin: 0;
    color: #171717;
    font-family: "Inter", sans-serif;
    font-size: 22px;
    font-weight: 700;
    line-height: 30px;
    letter-spacing: normal;
  }
  .classNetworkDetailDescription {
    color: #3d3d3d;
    font-size: 15px;
    line-height: 22px;
  }
  .classNetworkDetailSummary {
    display: grid;
    gap: 12px;
  }
  .classNetworkDetailRow {
    display: grid;
    gap: 6px;
    padding: 14px 16px;
    border: 1px solid #ece9e6;
    border-radius: 14px;
    background: #fbfbfa;
  }
  .classNetworkDetailLabel {
    color: #625b71;
    font-family: "Inter", sans-serif;
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
  }
  .classNetworkDetailValue {
    color: #171717;
    font-family: "Inter", sans-serif;
    font-size: 15px;
    font-weight: 700;
    line-height: 22px;
  }

  .classNetworkDetailNames {
    display: grid;
    gap: 8px;
    margin: 2px 0 0;
    padding-left: 20px;
    color: #3d3d3d;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 20px;
  }
  .classNetworkAdmins {
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid #ece9e6;
    border-radius: 14px;
    background: #ffffff;
  }
  .classNetworkAdminsHeader {
    display: grid;
    gap: 4px;

    h4 {
      margin: 0;
      color: #171717;
      font-family: "Inter", sans-serif;
      font-size: 16px;
      font-weight: 700;
      line-height: 22px;
    }

    p {
      color: #625b71;
      font-size: 14px;
      line-height: 20px;
    }
  }
  .classNetworkAdminList {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .classNetworkAdminRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid #ece9e6;
    border-radius: 12px;
    background: #fbfbfa;

    div {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    strong {
      overflow: hidden;
      color: #171717;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      line-height: 20px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      overflow: hidden;
      color: #625b71;
      font-family: "Inter", sans-serif;
      font-size: 12px;
      line-height: 16px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .classNetworkAdminEmpty {
    color: #625b71;
    font-size: 14px;
    line-height: 20px;
  }
  .classNetworkAdminForm {
    display: grid;
    gap: 8px;

    label {
      color: #171717;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      font-weight: 700;
      line-height: 20px;
    }
  }
  .classNetworkAdminFormRow {
    display: grid;
    gap: 8px;
    grid-template-columns: minmax(0, 1fr) auto;

    input {
      height: 42px;
      font-family: "Inter", sans-serif;
      font-size: 14px;
    }
  }
  .classNetworkAdminFeedback {
    color: #1d6b3a;
    font-size: 13px;
    line-height: 18px;

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
    background: rgb(0, 124, 112);
    color: rgb(255, 255, 255);
    border: 2px solid rgb(0, 124, 112);
  }
`;

export default StyledModal;
