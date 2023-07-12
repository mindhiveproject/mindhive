import styled from "styled-components";

export const StyledTaskPage = styled.div`
  display: grid;
  grid-template-columns: 8fr 4fr;
  grid-template-areas: "description info";
  grid-gap: 10rem;
  max-width: 1200px;
  width: 100%;
  margin: 5rem 0rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "description"
      "info";
  }
  @media (max-width: 375px) {
    padding: 1rem;
  }

  .taskDescription {
    display: grid;
    grid-area: description;
    grid-gap: 2rem;
    align-content: baseline;

    .headerLine {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-gap: 2rem;
      align-items: center;
    }
  }

  .taskInfo {
    display: grid;
    grid-area: info;
    grid-gap: 2rem;
    align-content: baseline;
    .authors {
      display: grid;
      grid-gap: 1rem;
    }
    .time {
      display: grid;
      grid-gap: 1rem;
    }
  }

  p {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 14px;
    color: #666666;
  }
  h1 {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 48px;
    line-height: 56px;
    color: #1a1a1a;
  }
  h3 {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 24px;
    line-height: 32px;
    color: #666666;
  }
  button {
    height: 56px;
    width: 266px;
    background: ${(props) => props.theme.darkgreen};
    border: 2px solid ${(props) => props.theme.darkgreen};
    box-sizing: border-box;
    border-radius: 4px;
    color: ${(props) => props.theme.white};
    font-family: "Lato";
    font-size: 18px;
    letter-spacing: 0.05em;
    cursor: pointer;
    margin-top: 20px;
    margin-bottom: 20px;
  }
  a {
    text-decoration-line: underline;
    cursor: pointer;
  }
  img {
    max-width: 100%;
    object-fit: cover;
  }

  .controlBtns {
    display: grid;
    grid-gap: 5px;
    margin-bottom: 34px;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    button {
      width: auto;
      margin: 0;
    }
    .secondaryBtn {
      border: 2px solid #007c70;
      color: #007c70;
      background: #f7f9f8;
    }
  }
`;
