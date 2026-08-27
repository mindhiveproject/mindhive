import styled from "styled-components";

export const StyledFooter = styled.footer`
  display: grid;
  grid-template-rows: auto auto;
  gap: 1.25rem;
  align-content: start;
  min-height: unset;
  grid-area: footer;
  padding: 2rem 2rem 1.75rem;
  background: transparent;
  border-top: 1px solid #e6e6e6;
  font-style: normal;
  font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  width: 100%;
  box-sizing: border-box;

  p {
    color: var(--MH-Theme-Neutrals-Black, #171717);
    margin: 0 0 0.75rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  @media (max-width: 600px) {
    padding: 1.5rem 1.25rem;
    gap: 1.25rem;
  }

  .logoRow {
    display: grid;
    justify-content: start;
    align-content: center;
    max-width: 100%;
  }

  .logo {
    display: block;
    height: 40px;
    width: auto;
    max-width: 200px;
    /* White SVG → dark for light footer background */
    filter: brightness(0);
  }

  .footerBody {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2.5rem;
    align-items: start;

    @media (max-width: 800px) {
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
  }

  .infoPanel {
    display: grid;
    max-width: 48rem;
    align-content: start;

    @media (max-width: 800px) {
      max-width: none;
    }
  }

  .linksPanel {
    display: grid;
    justify-items: end;
    justify-self: end;
    align-content: start;
    gap: 0.5rem;
    text-align: right;

    @media (max-width: 800px) {
      justify-items: start;
      justify-self: start;
      text-align: left;
    }

    a,
    a.link {
      color: var(--MH-Theme-Primary-Dark, #336f8a);
      font: var(--MH-Type-Label-Large, 500 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
      text-decoration: none !important;

      &:hover {
        text-decoration: underline !important;
        opacity: 0.9;
      }
    }
  }

  .link {
    cursor: pointer;
  }
`;
