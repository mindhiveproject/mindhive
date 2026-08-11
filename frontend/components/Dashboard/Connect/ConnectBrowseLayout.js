import styled from "styled-components";

/**
 * Page chrome shared by the Connect browse pages (Explore Connect, Saved
 * Connections): a page header followed by one white container holding the
 * search field, the card grid and the pagination controls.
 */

const CARD_MIN_WIDTH = {
  horizontal: "484px",
  vertical: "320px",
};

export const BrowseShell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 0 clamp(16px, 6vw, 64px) 48px;
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;

  /* Opt out of the dashboard-wide hover fade; controls here state themselves. */
  a:hover,
  button:hover {
    opacity: 1;
  }
`;

export const BrowseHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 1024px;

  h1 {
    margin: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    font-family: "Inter", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    line-height: 1.2;
  }

  p {
    margin: 0;
    max-width: 640px;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    font-family: "Inter", sans-serif;
    font-size: 16px;
    line-height: 24px;
  }
`;

export const BrowseContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1024px;
  padding: 24px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

export const BrowseSearchField = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
  background: var(--MH-Theme-Neutrals-White, #ffffff);

  &:focus-within {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
  }

  .search-icon {
    flex-shrink: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 20px;
    color: var(--MH-Theme-Neutrals-Black, #171717);

    &::placeholder {
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    }
  }
`;

export const BrowseCardsGrid = styled.div`
  display: grid;
  gap: 16px;
  justify-items: center;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(100%, ${({ $layout }) => CARD_MIN_WIDTH[$layout]}), 1fr)
  );
`;

export const BrowseEmptyState = styled.p`
  margin: 0;
  padding: 32px 0;
  text-align: center;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  line-height: 24px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

