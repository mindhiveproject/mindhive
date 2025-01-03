import styled from "styled-components";

export const StyledResource = styled.div`
  display: grid;
  grid-gap: 2rem;
  .board {
    .headerMy {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
    }
    .headerPublic {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
    }
    .buttonLinks {
      display: grid;
      grid-gap: 1rem;
      grid-template-columns: 1fr auto;
    }
  }
`;

export default StyledResource;
