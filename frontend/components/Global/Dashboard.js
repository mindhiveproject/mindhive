import { useContext } from "react";

import {
  StyledDashboard,
  StyledDashboardNavigation,
  StyledDashboardWrapper,
  StyledDashboardContent,
  StyledDashboardFooterSlot,
} from "../styles/StyledDashboard";
import DashboardNavigation from "../Dashboard/Navigation";
import { UserContext } from "./Authorized";

import { Sidebar } from "semantic-ui-react";

import Page from "../../components/Global/Page";
import Form from "../../components/Global/Form";
import Login from "../Auth/Login";
import Footer from "./Footer";
import FullScreenLoading from "../DesignSystem/FullScreenLoading";

/**
 * Platform-browsing dashboard areas that show the site footer.
 * Focused workspaces (builder, develop, review, classes, etc.) are excluded.
 */
const DASHBOARD_FOOTER_AREAS = new Set(["discover", "connect", "review", "settings", "sponsor-connect"]);

function shouldShowDashboardFooter(area) {
  // Home is `/dashboard` with no area param
  if (!area) return true;
  return DASHBOARD_FOOTER_AREAS.has(area);
}

export default function Dashboard({ children, area, selector }) {
  const { user, loading: authLoading } = useContext(UserContext);
  const showFooter = shouldShowDashboardFooter(area);

  const content = (
    <StyledDashboardContent $withFooter={showFooter}>
      <div className="dashboardMain">{children}</div>
      {showFooter ? (
        <StyledDashboardFooterSlot>
          <Footer />
        </StyledDashboardFooterSlot>
      ) : null}
    </StyledDashboardContent>
  );

  // Must come before the !user branch: until the user query answers, a null
  // user means "not known yet", not "logged out".
  if (authLoading) {
    return <FullScreenLoading />;
  }

  if (!user) {
    return (
      <Page>
        <Form>
          <Login />
        </Form>
      </Page>
    );
  }

  // use the full screen for reviewing
  if (area === "review" && selector === "comment") {
    return <>{children}</>;
  }

  // do not use dashboard wrapper on the proposals page
  // it has max-width that renders the card sidebar incorrectly
  if (area === "proposals") {
    return (
      <Sidebar.Pushable>
        <StyledDashboard>
          <StyledDashboardNavigation>
            <DashboardNavigation />
          </StyledDashboardNavigation>
          <StyledDashboardContent>{children}</StyledDashboardContent>
        </StyledDashboard>
      </Sidebar.Pushable>
    );
  }

  return (
    <Sidebar.Pushable>
      <StyledDashboard>
        <StyledDashboardNavigation>
          <DashboardNavigation />
        </StyledDashboardNavigation>
        <StyledDashboardWrapper>{content}</StyledDashboardWrapper>
      </StyledDashboard>
    </Sidebar.Pushable>
  );
}
