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

  const steps = [
    { step: 1, label: t("steps.profileType"), percent: 20, page: "type" },
    { step: 2, label: t("steps.aboutMe"), percent: 36, page: "about" },
    { step: 3, label: t("steps.interests"), percent: 61, page: "interests" },
    { step: 4, label: t("steps.complete"), percent: 80, page: "complete" },
  ];

  // query the full profile of the user
  const { data } = useQuery(GET_PROFILE);
  const user = data?.authenticatedItem;

  return (
    <StyledCreateProfileFlow>
      <div>
        <h1>{t("createProfile")}</h1>
        {page !== "type" && (
          <div className="progressBar">
            <Progress
              percent={steps
                .filter((s) => s?.page === page)
                .map((s) => s?.percent)}
              size="large"
            >
              <div className="progressLabels">
                {steps.map((step) => (
                  <div key={step.step}>{step?.label}</div>
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
