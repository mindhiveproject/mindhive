import { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import ProfileType from "./Steps/1-ProfileType";
import About from "./Steps/AboutSwitch";
import Interests from "./Steps/3-Interests";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../Queries/User";
import { StyledCreateProfileFlow } from "../../styles/StyledProfile";
import {
  MANAGE_ORGANIZATION_HREF,
  manageOrganizationHref,
  resolveLinkedOrganization,
  resolveProfileType,
} from "../../../lib/profileEditNavigation";

import { Progress } from "semantic-ui-react";

export default function EditProfile({ query }) {
  const { t } = useTranslation("connect");
  const router = useRouter();
  const { page } = query;

  const { data } = useQuery(GET_PROFILE);
  const user = data?.authenticatedItem;
  const profileType = resolveProfileType(query, user);

  // Organization setup/edit lives on Connect Manage — never the profile wizard.
  useEffect(() => {
    if (!user?.id) return;
    if (profileType !== "organization") return;
    if (page !== "about" && page !== "type" && page !== "interests") return;
    const linked = resolveLinkedOrganization(user);
    router.replace(
      linked?.id
        ? manageOrganizationHref(linked.id)
        : { pathname: MANAGE_ORGANIZATION_HREF, query: { create: "1" } },
    );
  }, [user, profileType, page, router]);

  const pageTitle =
    profileType && profileType !== "organization"
      ? t(`createProfileFlow.title.${profileType}`, {}, {
          default: t("createProfile"),
        })
      : t("createProfile");

  const progressSteps = [
    {
      label: t("steps.aboutMe"),
      page: "about",
    },
    {
      label: t("steps.interests"),
      page: "interests",
    },
  ];

  const currentStepIndex = progressSteps.findIndex((s) => s.page === page);
  const percent =
    currentStepIndex >= 0
      ? ((currentStepIndex + 1) / progressSteps.length) * 100
      : 0;

  if (user?.id && profileType === "organization") {
    return null;
  }

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
