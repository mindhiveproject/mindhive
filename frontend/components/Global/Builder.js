import PropTypes from "prop-types";
import { useContext } from "react";

import { StyledBuilder } from "../styles/StyledBuilder";
import { UserContext } from "./Authorized";

export default function Dashboard({ children }) {
  const user = useContext(UserContext);

  if (!user) {
    return <div>Please first log in!</div>;
  }

  return <StyledBuilder>{children}</StyledBuilder>;
}
