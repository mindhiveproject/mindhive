import { useQuery } from "@apollo/client";
import ProfileType from "./Steps/1-ProfileType";
import About from "./Steps/AboutSwitch";
import Interests from "./Steps/3-Interests";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../Queries/User";
import { StyledCreateProfileFlow } from "../../styles/StyledProfile";
import { resolveProfileType } from "../../../lib/profileEditNavigation";

import { Progress } from "semantic-ui-react";

export default function EditProfile({ query }) {
  const { t } = useTranslation("connect");
  const { page } = query;

  const { data } = useQuery(GET_PROFILE);
  const user = data?.authenticatedItem;
  const profileType = resolveProfileType(query, user);

  const pageTitle = profileType
    ? t(`createProfileFlow.title.${profileType}`, {}, { default: t("createProfile") })
    : t("createProfile");

  const progressSteps = [
    {
      label: profileType
        ? t(`createProfileFlow.steps.aboutMe.${profileType}`, {}, { default: t("steps.aboutMe") })
        : t("steps.aboutMe"),
      page: "about",
    },
    {
      label: profileType
        ? t(`createProfileFlow.steps.interests.${profileType}`, {}, { default: t("steps.interests") })
        : t("steps.interests"),
      page: "interests",
    },
  ];

  const currentStepIndex = progressSteps.findIndex((s) => s.page === page);
  const percent =
    currentStepIndex >= 0
      ? ((currentStepIndex + 1) / progressSteps.length) * 100
      : 0;

  return (
    <StyledCreateProfileFlow>
      <div>
        <h1>{pageTitle}</h1>
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
