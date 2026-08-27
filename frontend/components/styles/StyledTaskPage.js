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
    font-style: normal;
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    color: #666666;
  }
  h1 {
    font-style: normal;
    font: var(--MH-Type-Heading-Large, 700 46px/52px "Inter", sans-serif);
    letter-spacing: 0;
    color: #1a1a1a;
  }
  h3 {
    font-style: normal;
    font: var(--MH-Type-Heading-Small, 600 28px/36px "Inter", sans-serif);
    letter-spacing: 0;
    color: #666666;
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
  }
`;

export const StyledContent = styled.div`
  display: grid;
  grid-template-columns: 60% auto;
  column-gap: 1px;
  .leftPanel {
    display: grid;
    grid-gap: 15px;
    /* padding: 50px 70px 0px 70px; */
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
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
  }
  img {
    width: 100%;
  }
`;
