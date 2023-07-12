import styled from "styled-components";

const StyledFront = styled.div`
  display: grid;
  width: 100%;
  justify-self: center;
  grid-gap: 3rem;
  margin: 5rem 0rem;
  padding: 2rem 0rem;

  .featuredHeader {
    display: grid;
    width: 100%;
    max-width: 1200px;
    justify-self: center;
  }

  .featuredContainerWrapper {
    background: #f6f9f8;
    width: 100%;
    padding: 7rem 0rem 2rem 0rem;
    @media (max-width: 1300px) {
      padding: 7rem 2rem;
    }
  }

  .featuredContainer {
    display: grid;
    width: 100%;
    max-width: 1200px;
    justify-self: center;
    min-height: 400px;
    background: #f6f9f8;
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
