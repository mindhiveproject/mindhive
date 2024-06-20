import { useContext } from "react";

import {
  StyledDashboard,
  StyledDashboardNavigation,
  StyledDashboardWrapper,
  StyledDashboardContent,
} from "../styles/StyledDashboard";
import DashboardNavigation from "../Dashboard/Navigation";
import { UserContext } from "./Authorized";

import { Sidebar } from "semantic-ui-react";

import Page from "../../components/Global/Page";
import Form from "../../components/Global/Form";
import Login from "../Auth/Login";

export default function Dashboard({ children, area, selector }) {
  const user = useContext(UserContext);

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
  if (area === "review" && selector === "proposal") {
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
        <StyledDashboardWrapper>
          <StyledDashboardContent>{children}</StyledDashboardContent>
        </StyledDashboardWrapper>
      </StyledDashboard>
    </Sidebar.Pushable>
  );
}
