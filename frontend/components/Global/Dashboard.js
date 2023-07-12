import PropTypes from "prop-types";
import { useContext } from "react";

import {
  StyledDashboard,
  StyledDashboardContent,
} from "../styles/StyledDashboard";
import DashboardNavigation from "../Dashboard/Navigation";
import { UserContext } from "./Authorized";

export default function Dashboard({ children }) {
  const user = useContext(UserContext);

  if (!user) {
    return <div>Please first log in!</div>;
  }

  return (
    <StyledDashboard>
      <DashboardNavigation />
      <StyledDashboardContent>{children}</StyledDashboardContent>
    </StyledDashboard>
  );
}
