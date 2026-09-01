import styled from "styled-components";

/**
 * Width of the floating menu card in each state, shared with the dashboard grid.
 */
export const MENU_BAR_WIDTH = 256;
export const MENU_BAR_COLLAPSED_WIDTH = 72;

/**
 * The floating navigation card. Sits inside the dashboard grid with the page
 * background showing through around it, which is what gives it the inset,
 * card-like look rather than running to the viewport edge.
 */
export const StyledMenuBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: ${(props) => (props.$collapsed ? "center" : "flex-start")};

  box-sizing: border-box;
  height: 100%;
  width: ${(props) =>
    props.$collapsed ? MENU_BAR_COLLAPSED_WIDTH : MENU_BAR_WIDTH}px;
    
  /* No top padding: the sticky action row supplies it instead, so the row rests
     and pins at exactly the same offset and nothing shifts when it sticks. */
  padding: 0 16px 24px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;

  color: var(--MH-Theme-Neutrals-Black, #171717);

  /* Long permission sets overflow; keep the scrollbar out of the layout. */
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }

  .menuBarHeader {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    align-items: ${(props) => (props.$collapsed ? "center" : "stretch")};
  }

  /*
   * Pinned to the top of the card: the collapse toggle acts on this container,
   * so it must never scroll out of reach. Must stay a direct child of the card
   * — sticky is constrained by its nearest block ancestor, so nesting it would
   * release it as soon as that ancestor scrolled past.
   *
   * The align-self stretch beats the card's align-items and fills the content
   * box; the negative side margins then carry the opaque background out to the
   * card edges, so nothing shows through beside it while scrolling. Top padding
   * is supplied here rather than on the card, so the row rests and pins at the
   * same offset and nothing shifts the moment it sticks.
   */
  .menuBarActions {
    position: sticky;
    top: 0;
    z-index: 2;
    align-self: stretch;
    margin: 0 -16px;
    padding: 16px 16px 0;
    background: var(--MH-Theme-Neutrals-White, #ffffff);

    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .menuBarActionsRow {
    display: flex;
    gap: 12px;
    width: 100%;
    align-items: center;
    justify-content: ${(props) => (props.$collapsed ? "center" : "flex-start")};
    flex-direction: ${(props) => (props.$collapsed ? "column" : "row")};
  }

  /* Closes the pinned row off against the content sliding beneath it. Sits
     inside the row's padding, so it stops short of the card edges. */
  .menuBarActionsRule {
    height: 1px;
    width: 100%;
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  }

  .menuBarLogo {
    display: flex;
    justify-content: center;
    width: 100%;

    img {
      display: block;
      height: ${(props) => (props.$collapsed ? "24px" : "44px")};
      width: auto;
    }
  }

  /* Sections are separated by the card's own 32px gap, so the nav itself only
     needs to space items within a section. */
  .menuBarNav {
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 100%;
    align-items: ${(props) => (props.$collapsed ? "center" : "stretch")};

  }
`;

/** Circular icon button used for the collapse toggle and notifications. */
export const StyledMenuIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;

  height: 40px;
  width: 40px;
  padding: 8px;
  border: 0;
  border-radius: 100px;
  background: var(--MH-Theme-Neutrals-Light-Green, #f6f9f8);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  cursor: pointer;

  &:hover {
    background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
    opacity: 1;
  }

  /* Count badge from UpdatesCount, pinned to the corner of the bell. */
  .updateCounter {
    position: absolute;
    top: -2px;
    right: -2px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 20px;
    background: var(--MH-Theme-Warning-Base, #b9261a);
    color: white;
    font: var(--MH-Type-Label-Small);
    letter-spacing: 0;
  }
`;

/**
 * Search field. Non-functional for now — rendered to spec so the layout is
 * correct, but nothing is wired to it yet.
 */
export const StyledMenuSearch = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;

  height: 40px;
  width: ${(props) => (props.$collapsed ? "40px" : "100%")};
  padding: ${(props) => (props.$collapsed ? "4px 8px" : "4px 16px 4px 8px")};
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
  border-radius: 8px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

  svg {
    flex-shrink: 0;
  }

  input {
    flex: 1 0 0;
    min-width: 0;
    border: 0;
    outline: none;
    background: none;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);

    &::placeholder {
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    }
  }
`;

/** Account block: identity row plus the disclosure panel it toggles. */
export const StyledMenuProfile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;

  .profileTrigger {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;

    padding: ${(props) => (props.$collapsed ? "8px" : "8px 16px")};
    border: 0;
    border-radius: 12px;
    background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
    color: var(--MH-Theme-Neutrals-Black, #171717);
    cursor: pointer;
    text-align: left;

    &:hover {
      background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
      opacity: 1;
    }
  }

  .profileIdentity {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    flex: 1 0 0;
  }

  /* MH-Theme/label/small. Truncates because a user holding several permissions
     renders them all, which outgrows the card well before the name does. */
  .profileRole {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* MH-Theme/label/base — matches the nav item and Button label size. */
  .profileName {
    font: var(--MH-Type-Label-Large);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profileCaret {
    flex-shrink: 0;
    display: flex;
    transform: ${(props) => (props.$open ? "rotate(180deg)" : "none")};
  }

  /*
   * Disclosure panel, hung off a vertical rule as in the design.
   *
   * Stays in flow when collapsed rather than becoming a flyout: the card is an
   * overflow-y: auto scroller, which computes overflow-x to auto as well, so an
   * absolutely positioned panel would be clipped by the rail. Collapsing it to
   * a stack of icon-only actions keeps Settings and Log Off reachable and
   * matches how the nav items themselves collapse.
   */
  .profilePanel {
    display: flex;
    gap: ${(props) => (props.$collapsed ? "8px" : "6px")};
    align-items: ${(props) => (props.$collapsed ? "center" : "stretch")};
    flex-direction: ${(props) => (props.$collapsed ? "column" : "row")};
    padding-left: ${(props) => (props.$collapsed ? "0" : "8px")};
  }

  .profilePanelRule {
    width: 2px;
    flex-shrink: 0;
    background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 2px;
  }

  .profilePanelLinks {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1 0 0;
    min-width: 0;
    align-items: ${(props) => (props.$collapsed ? "center" : "stretch")};

    /* Settings renders through the shared Navbar component; keep it at the
       navbar's own label/large size so it lines up with the rest of the rail
       (and with the Log off button below). No explicit height here either
       — see the .menuBarNav override for why. */
    .navbar-container.vertical .navbar-item {
      font: var(--MH-Type-Label-Large);
      letter-spacing: 0;
    }
  }

  .signoutButton {
    display: flex;
    align-items: center;
    justify-content: ${(props) =>
      props.$collapsed ? "center" : "flex-start"};
    gap: 8px;

    padding: ${(props) => (props.$collapsed ? "8px" : "8px 24px 8px 16px")};
    width: ${(props) => (props.$collapsed ? "40px" : "auto")};
    border: 0;
    /* Square edges like the vertical nav items above — no pill. The 3px
       transparent right border mirrors their reserved selected-rule space so
       the hover fills line up exactly. */
    border-radius: 0;
    border-right: 3px solid transparent;
    background: none;
    cursor: pointer;

    /* MH-Type/label/large — matches the nav items and Settings above it. */
    font: var(--MH-Type-Label-Large);
    letter-spacing: 0;
    color: var(--MH-Theme-Warning-Base, #b9261a);

    /* Hover is a background fill only, matching the nav items — a warning tint
       here rather than the accent, since this is the destructive action. */
    &:hover {
      background: var(--MH-Theme-Warning-Light, #edcecd);
      opacity: 1;
    }
  }
`;
