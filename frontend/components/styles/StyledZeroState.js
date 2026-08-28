import styled from "styled-components";

const StyledZeroState = styled.div`
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
    font-style: normal;
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    color: #1a1a1a;
  }
  a {
    font-style: normal;
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
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
    font-style: normal;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
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

export default StyledZeroState;
