import { useQuery } from "@apollo/client";
import ProfileType from "./Steps/1-ProfileType";
import About from "./Steps/2-AboutMe";
import Interests from "./Steps/3-Interests";

import { GET_PROFILE } from "../../Queries/User";
import { StyledCreateProfileFlow } from "../../styles/StyledProfile";

import { Progress } from "semantic-ui-react";

export default function ProfileMain({ query }) {
  const { selector, page } = query;

  const steps = [
    { step: 1, label: "1. Profile Type", percent: 25, page: "type" },
    { step: 2, label: "2. About me", percent: 50, page: "about" },
    { step: 3, label: "3. Interests", percent: 75, page: "interests" },
    { step: 4, label: "4. Complete Profile", percent: 100, page: "complete" },
  ];

  // query the full profile of the user
  const { data } = useQuery(GET_PROFILE);
  const user = data?.authenticatedItem;

  return (
    <StyledCreateProfileFlow>
      <div>
        <h1>Create Profile</h1>
        <p>
          Your profile is incomplete. Enter the remaining information to
          complete your profile and begin contributing to the MindHive
          community.
        </p>
        <div className="progressBar">
          <Progress
            percent={steps
              .filter((s) => s?.page === page)
              .map((s) => s?.percent)}
            size="large"
          >
            {steps.filter((s) => s?.page === page).map((s) => s?.label)}
          </Progress>
        </div>
      </div>

      {page === "type" && <ProfileType />}
      {page === "about" && <About query={query} user={user} />}
      {page === "interests" && <Interests query={query} user={user} />}
    </StyledCreateProfileFlow>
  );
}
