import styled from 'styled-components';

export const StyledUpdateCard = styled.div`
  position: relative;
  display: grid;
  max-width: 560px;
  grid-template-columns: 4fr 1fr;
  background: #ffffff;
  border: 1px solid #ebebeb;
  box-sizing: border-box;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.09), 0px 5px 6px rgba(0, 0, 0, 0.08);
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
  .infoMessage {
    padding: 31px;
    border-right: 1px solid #ebebeb;
  }
  .linkMessage {
    padding: 10px;
    display: grid;
    align-items: center;
    justify-content: center;
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
  .deleteButton {
    position: absolute;
    top: -20%;
    right: -5%;
    width: 3.3rem;
    line-height: 3rem;
    text-align: center;
    cursor: pointer;
    border-radius: 2.25rem;
    color: #969696;
    padding-bottom: 5px;
    font-size: 2rem;
    :hover {
      transform: scale(1.1);
      transition: transform 0.5s;
    }
  }
`;
