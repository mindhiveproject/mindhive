import styled from "styled-components";

export const StyledTag = styled.div`
  display: grid;
  grid-gap: 20px;
  .board {
    display: grid;
    .line {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-gap: 10px;
      align-items: center;
    }
  }
`;
