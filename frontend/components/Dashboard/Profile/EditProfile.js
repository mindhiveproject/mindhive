import { useQuery } from "@apollo/client";
import ProfileType from "./Steps/1-ProfileType";
import About from "./Steps/2-AboutMe";
import Interests from "./Steps/3-Interests";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../Queries/User";
import { StyledCreateProfileFlow } from "../../styles/StyledProfile";

import { Progress } from "semantic-ui-react";

export default function EditProfile({ query }) {
  const { t } = useTranslation("connect");
  const { selector, page } = query;

  const progressSteps = [
    { label: t("steps.aboutMe"), page: "about" },
    { label: t("steps.interests"), page: "interests" },
  ];

  const currentStepIndex = progressSteps.findIndex((s) => s.page === page);
  const percent =
    currentStepIndex >= 0
      ? ((currentStepIndex + 1) / progressSteps.length) * 100
      : 0;

  // query the full profile of the user
  const { data } = useQuery(GET_PROFILE);
  const user = data?.authenticatedItem;

  return (
    <StyledCreateProfileFlow>
      <div>
        <h1>{t("createProfile")}</h1>
        {page !== "type" && (
          <div className="progressBar">
            <Progress percent={percent} size="large">
              <div className="progressLabels">
                {progressSteps.map((step) => (
                  <div key={step.page}>{step.label}</div>
                ))}
              </div>
            </Progress>
          </div>
        )}
      </div>

      {page === "type" && <ProfileType />}
      {page === "about" && <About query={query} user={user} />}
      {page === "interests" && <Interests query={query} user={user} />}
    </StyledCreateProfileFlow>
  );
}
