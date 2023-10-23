import { useContext } from "react";

import {
  StyledDashboard,
  StyledDashboardNavigation,
  StyledDashboardWrapper,
  StyledDashboardContent,
} from "../styles/StyledDashboard";
import DashboardNavigation from "../Dashboard/Navigation";
import { UserContext } from "./Authorized";

import { 
  Sidebar, 
} from "semantic-ui-react";

export default function Dashboard({ children }) {
  const user = useContext(UserContext);

  if (!user) {
    return <div>Please first log in!</div>;
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
