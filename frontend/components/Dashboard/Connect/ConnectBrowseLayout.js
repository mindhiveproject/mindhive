import styled from "styled-components";

/**
 * Page chrome shared by the Connect browse pages (Explore Connect, Saved
 * Connections): a page header, then the search field, the card grid and the
 * pagination controls sitting straight on the honeycomb background.
 */

const imgBackground = "/assets/connect/background.svg";

/**
 * A ConnectCard rests at 296px and only stretches toward its 368px max in the
 * single-column layout (Figma 506:1306). 920px is exactly three resting cards
 * plus their two gaps, so the header and the grid share one flush edge.
 */
export const CARD_WIDTH = "296px";
const CARD_MAX_WIDTH = "368px";
const CONTENT_MAX_WIDTH = "920px";

/** Below this the page is one column, so the card may take its full max width. */
const SINGLE_COLUMN = "690px";

export const BrowseShell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 0 clamp(16px, 6vw, 64px) 48px;
  background-color: #f7f9f8;
  background-image: url(${imgBackground});
  background-repeat: repeat;
  background-position: center top;
  background-attachment: fixed;
  background-size: auto;
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
  max-width: ${CONTENT_MAX_WIDTH};

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

export const BrowseBody = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: ${CONTENT_MAX_WIDTH};
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
  justify-content: start;
  align-items: stretch;
  /* Fixed tracks: spare room becomes gutter on the trailing edge rather than
     padding every card out to a width its content cannot fill. */
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(100%, ${CARD_WIDTH}), ${CARD_WIDTH})
  );

  @media (max-width: ${SINGLE_COLUMN}) {
    grid-template-columns: minmax(0, ${CARD_MAX_WIDTH});
  }
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
