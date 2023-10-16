import styled from "styled-components";

const StyledModal = styled.div`
  display: grid;
  margin: 30px 10px;
  justify-content: center;
  align-items: stretch;
  text-align: center;

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
    text-align: center !important;
  }
  p {
    font-family: Lato;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.05em;
    text-align: center !important;
  }
`;

export default StyledModal;
