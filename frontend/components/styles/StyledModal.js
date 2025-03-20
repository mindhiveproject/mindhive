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
