import styled from "styled-components";

const StyledFront = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  align-content: baseline;
  justify-self: center;
  grid-gap: 3rem;
  margin: 5rem 0rem;
  padding: 2rem 0rem;

  /* Keep a gutter once the window is narrower than the 1200px column. */
  .discoverLibrary {
    @media (max-width: 1264px) {
      padding: 0rem 2rem;
    }
  }

  .centered {
    display: grid;
    width: 100%;
    max-width: 1200px;
    justify-self: center;
  }

  .studies {
    display: grid;
    width: 100%;
    max-width: 1200px;
    justify-self: center;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-column-gap: 26px;
    grid-row-gap: 26px;
    @media (max-width: 500px) {
      grid-template-columns: 1fr;
    }
  }
`;

export default StyledFront;
