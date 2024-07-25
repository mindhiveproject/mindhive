import styled from "styled-components";

const StyledHome = styled.div`
  display: grid;
  .createProfileArea {
    display: grid;
    grid-template-columns: 300px 1fr;
    grid-gap: 1rem;
    margin: 2rem 0rem;
    padding: 2rem;
    border-radius: 10px;
    background: var(--neutral_white, #fff);
    box-shadow: 0px 4px 4px 0px rgba(204, 204, 204, 0.25);
  }
`;

export default StyledHome;
