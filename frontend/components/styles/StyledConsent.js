import styled from "styled-components";

export const StyledConsent = styled.div`
  display: grid;
  grid-gap: 2rem;
  .singlePost {
    display: grid;
    grid-gap: 2rem;
    margin: 1rem;
  }
  .item {
    font: var(--MH-Type-Body-Large);
    letter-spacing: 0;
  }
  .consentPage {
    display: grid;
    grid-gap: 2rem;
  }
  .consentHeader {
    display: grid;
    grid-template-columns: 1fr auto;
    margin: 2rem 0rem;
  }
`;

export default StyledConsent;
