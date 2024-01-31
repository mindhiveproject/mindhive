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

export default function Dashboard({ children, area }) {
  const user = useContext(UserContext);

  if (!user) {
    return <div>Please first log in!</div>;
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
