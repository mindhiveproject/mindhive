import styled from "styled-components";

export const StyledDashboard = styled.div`
  /*
   * Breathing room around the floating menu card — the single knob for the
   * space between the menu, the page content and the viewport edge. Everything
   * downstream reads this variable, including the footer height maths in
   * StyledDashboardContent, so this is the only value to change.
   */
  --dashboard-inset: 16px;

  display: grid;
  /* The menu bar sizes its own column so it can change width when collapsed. */
  grid-template-columns: auto minmax(0, 1fr);
  grid-gap: var(--dashboard-inset);
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  padding: var(--dashboard-inset);
  background: #f6f9f8;
  color: ${(props) => props.theme.grey};
  font-style: normal;
  font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
  margin: 0;
  button:hover {
    opacity: 0.6;
  }
  a:hover {
    opacity: 0.6;
  }
`;

export const StyledDashboardNavigation = styled.div`
  display: grid;
  height: 100%;
  max-height: 100%;
  min-height: 0;
`;

export const StyledDashboardWrapper = styled.div`
  max-width: ${(props) => props.theme.maxWidth};
  /* Fills its grid track; the track is already inset by the dashboard padding. */
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  mask-image: linear-gradient(to top, transparent, black),
    linear-gradient(to left, transparent 17px, black 17px);
  mask-size: 100% 20000px;
  mask-position: left bottom;
  -webkit-mask-image: linear-gradient(to top, transparent, black),
    linear-gradient(to left, transparent 17px, black 17px);
  -webkit-mask-size: 100% 20000px;
  -webkit-mask-position: left bottom;
  transition: mask-position 0.3s, -webkit-mask-position 0.3s;

  :hover {
    -webkit-mask-position: left top;
  }
`;

export const StyledDashboardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => (props.$boardEditorFullscreen ? "0" : "20px")};
  margin: ${(props) => (props.$boardEditorFullscreen ? "0" : "50px")};
  max-width: ${(props) => props.theme.maxWidth};
  /* In board editor fullscreen, pin to the wrapper height so the wrapper
     cannot scroll vertically. Normal pages use min-height to push the footer. */
  ${(props) =>
    props.$boardEditorFullscreen
      ? "height: 100%; min-height: 0; overflow: hidden;"
      : `min-height: ${
          props.$withFooter
            ? "calc(100vh - (var(--dashboard-inset, 24px) * 2) - 100px)"
            : "100%"
        };`}

  .dashboardMain {
    flex: 1 0 auto;
    display: grid;
    /* Prevent content-sized tracks from blowing past the scrollport */
    grid-template-columns: minmax(0, 1fr);
    grid-gap: 20px;
    align-content: start;
    /* Dashboard inset (x2) + top margin (50px) + content gap (20px)
       → footer starts at or below the fold */
    min-height: ${(props) =>
      props.$withFooter
        ? "calc(100vh - (var(--dashboard-inset, 24px) * 2) - 70px)"
        : "unset"};

    ${(props) =>
      props.$boardEditorFullscreen
        ? `
      flex: 1 1 0;
      min-height: 0;
      overflow: hidden;
      align-content: stretch;
    `
        : ""}
  }

  .header {
    display: grid;
    grid-gap: 2rem;
    grid-template-columns: 1fr auto;
    .idInfo {
      display: grid;
      grid-gap: 1rem;
    }
  }

  .code {
    background: white;
    padding: 1rem;
    border-radius: 5px;
  }

  .dropdown {
    display: grid;
    justify-content: end;
    p {
      font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
    }
  }
`;

/** Full-bleed footer slot inside dashboard content (counters content margin). */
export const StyledDashboardFooterSlot = styled.div`
  flex: 0 0 auto;
  margin: 0 -50px -50px;
  width: calc(100% + 100px);
  max-width: none;
  align-self: stretch;
`;

