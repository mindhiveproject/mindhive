import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import Background from "./Blocks/Background";
import BasicInformation from "./Blocks/Basic";
import IntroductionVideo from "./Blocks/Introduction";
import Preferences from "./Blocks/Preferences";
import {
  profileEditHref,
  resolveProfileType,
} from "../../../../lib/profileEditNavigation";

export default function About({ query, user }) {
  const { t } = useTranslation("connect");
  const profileType = resolveProfileType(query, user);
  const isOrganization = profileType === "organization";

  return (
    <>
      <div className="aboutMe">
        <BasicInformation query={query} user={user} />
        <Background query={query} user={user} />
        {!isOrganization && (
          <>
            <IntroductionVideo query={query} user={user} />
            <Preferences query={query} user={user} />
          </>
        )}

        <div className="navButtons">
          <Link href={profileEditHref({ page: "type" })}>
            <button className="secondary">{t("navigation.previous")}</button>
          </Link>

          <Link
            href={profileEditHref({ page: "interests", type: profileType })}
          >
            <button className="primary">{t("navigation.next")}</button>
          </Link>
        </div>
      </div>
    </>
  );
}
