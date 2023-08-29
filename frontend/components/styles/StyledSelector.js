import styled from "styled-components";

export const StyledSelector = styled.div`
  display: grid;
  grid-template-rows: minmax(1px, auto) 1fr;
  /* height: 100vh; */
  background: #f7f9f8;

  .selectionHeader {
    display: grid;
    grid-template-columns: 1fr auto;
  }

  .goBackBtn {
    cursor: pointer;
    margin: 1rem;
    font-family: Lato;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    letter-spacing: 0em;
    text-align: left;
    color: #007c70;
  }

  .closeBtn {
    width: 6rem;
    line-height: 3rem;
    text-align: center;
    cursor: pointer;
    border-radius: 2.25rem;
    color: #5f6871;
    padding-top: 5px;
    padding-bottom: 5px;
    font-size: 4rem;
    :hover {
      transform: scale(1);
      color: red;
      transition: transform 2s;
    }
  }

  .selectionBody {
    display: grid;
    align-content: center;
    text-align: center;
    justify-self: center;
    width: 100%;
    max-width: 1400px;
  }

  .studyOptions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    grid-gap: 10px;
    justify-items: center;
  }

  .options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    grid-gap: 50px;
    justify-items: center;
  }

  h1 {
    font-family: Lato;
    font-size: 48px;
    font-style: normal;
    font-weight: 400;
    line-height: 56px;
    letter-spacing: 0em;
    text-align: center;
    margin-bottom: 40px;
  }
  h3 {
    font-family: Lato;
    font-size: 24px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.05em;
    text-align: center;
  }
  p {
    font-family: Lato;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.05em;
  }

  .option {
    max-width: 355px;
  }
  .iconSelect {
    height: 90px;
    display: grid;
    align-items: center;
    justify-content: center;
  }
  .option {
    cursor: pointer;
    padding: 60px 29px 60px 29px;
    :hover {
      background: #ffffff;
      box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.09),
        0px 5px 6px rgba(0, 0, 0, 0.08);
      border-radius: 4px;
      transform: scale(1.05);
      transition: transform 0.5s;
    }
  }
  .selectHeader {
    p {
      text-align: center;
    }
  }
`;
