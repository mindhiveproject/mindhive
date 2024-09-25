import { useQuery } from "@apollo/client";
import ProfileType from "./Steps/1-ProfileType";
import About from "./Steps/2-AboutMe";
import Interests from "./Steps/3-Interests";

import { GET_PROFILE } from "../../Queries/User";
import { StyledCreateProfileFlow } from "../../styles/StyledProfile";

import { Progress } from "semantic-ui-react";

export default function SetAvailability({ query }) {
  const { selector, page } = query;

  // query the full profile of the user
  const { data } = useQuery(GET_PROFILE);
  const user = data?.authenticatedItem;

  return (
    <StyledCreateProfileFlow>
      Currently this area is under construction 🚧
    </StyledCreateProfileFlow>
  );
}
