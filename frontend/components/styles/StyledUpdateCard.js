import styled from "styled-components";

export const StyledUpdateCard = styled.div`
  position: relative;
  display: grid;
  margin: 0px 0px 0px 0px;
  grid-template-columns: 50px 1fr 50px;
  background: #ffffff;
  border: 1px solid #ebebeb;
  box-sizing: border-box;
  border-radius: 4px;

  h2 {
    font-family: Roboto;
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    line-height: 21px;
    color: #1a1a1a;
  }
  a {
    font-family: Roboto;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 20px;
    text-decoration-line: underline;
    color: #007c70;
  }
  .updateIcon {
    display: grid;
    justify-content: center;
    margin-top: 16px;
  }
  .updateContent {
    display: grid;
    margin: 16px 5px 16px 5px;
    .title {
      font-family: Lato;
      font-size: 18px;
      font-weight: 500;
      line-height: 18px;
      text-align: left;
      color: #373737;
      margin-bottom: 18px;
    }
    .message {
      font-family: Lato;
      font-size: 14px;
      font-weight: 400;
      line-height: 13px;
      text-align: left;
      color: #0000008f;
      margin-bottom: 10px;
    }
    .linkTitle {
      font-family: Lato;
      font-size: 14px;
      font-weight: 400;
      line-height: 13px;
      text-align: left;
      color: #007c70;
      text-decoration: underline;
    }
  }
  .contextInfo {
    font-family: Roboto;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: 0em;
    text-align: left;
    color: #969696;
  }
  .updateDelete {
    display: grid;
    justify-content: center;
    cursor: pointer;
    margin-top: 16px;
  }
`;
