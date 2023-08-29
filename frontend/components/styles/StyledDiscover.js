import styled from "styled-components";

export const StyledDiscover = styled.div`
  display: grid;

  .filterHeader {
    display: grid;
    grid-gap: 20px;
    grid-template-columns: 1fr auto;
    margin: 20px 0px;
  }

  .tasks {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px;
  }
`;
