import styled from "styled-components";

/**
 * Shared layout for SponsorConnect Opportunities pages (list + editors).
 * Cancels StyledDashboardContent's 50px margin so pages share one effective
 * width; modest vertical padding keeps a light inset without the old 50px feel.
 */
export const DASHBOARD_CONTENT_MARGIN_PX = 50;
export const OPPORTUNITY_PAGE_GUTTER = "clamp(16px, 6vw, 24px)";
/** Modest top/bottom inset inside the shell (keeps list + editor aligned). */
export const OPPORTUNITY_PAGE_VERTICAL_PADDING_PX = 64;

export const OpportunityPageShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  /* Allow grid/flex parents to shrink this bleed shell to the scrollport */
  min-width: 0;
  /* Cancel StyledDashboardContent's 50px margin; vertical padding lives on the shell */
  margin: -${DASHBOARD_CONTENT_MARGIN_PX}px;
  width: calc(100% + ${DASHBOARD_CONTENT_MARGIN_PX * 2}px);
  max-width: none;
  box-sizing: border-box;
  padding: ${OPPORTUNITY_PAGE_VERTICAL_PADDING_PX}px ${OPPORTUNITY_PAGE_GUTTER};
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
  scroll-padding-top: 6px;
`;
