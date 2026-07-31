import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import ProfileType from "./Steps/1-ProfileType";
import About from "./Steps/AboutSwitch";
import Interests from "./Steps/3-Interests";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../Queries/User";
import { StyledCreateProfileFlow } from "../../styles/StyledProfile";
import {
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

  // Capture whether an org already existed when the user first loaded this
  // screen. If they create one mid-wizard (about → interests), we must not
  // redirect away from the first-run flow.
  const hadOrgOnLoadRef = useRef(null);
  useEffect(() => {
    if (!user?.id || hadOrgOnLoadRef.current !== null) return;
    hadOrgOnLoadRef.current = !!resolveLinkedOrganization(user)?.id;
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    if (profileType !== "organization") return;
    if (page !== "about" && page !== "type") return;
    if (!hadOrgOnLoadRef.current) return;
    const linked = resolveLinkedOrganization(user);
    router.replace(manageOrganizationHref(linked?.id));
  }, [user, profileType, page, router]);

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

  if (
    user?.id &&
    hadOrgOnLoadRef.current &&
    profileType === "organization" &&
    (page === "about" || page === "type")
  ) {
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
