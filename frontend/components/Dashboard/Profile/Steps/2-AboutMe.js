import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import Background from "./Blocks/Background";
import BasicInformation from "./Blocks/Basic";
import IntroductionVideo from "./Blocks/Introduction";
import Preferences from "./Blocks/Preferences";

export default function About({ query, user }) {
  const { t } = useTranslation("connect");

  return (
    <>
      <div className="aboutMe">
        <BasicInformation query={query} user={user} />
        <Background query={query} user={user} />
        <IntroductionVideo query={query} user={user} />
        <Preferences query={query} user={user} />

        <div className="navButtons">
          <Link
            href={{
              pathname: `/dashboard/profile/edit`,
              query: {
                page: "type",
              },
            }}
          >
            <button className="secondary">{t("navigation.previous")}</button>
          </Link>

          <Link
            href={{
              pathname: `/dashboard/profile/edit`,
              query: {
                page: "interests",
              },
            }}
          >
            <button className="primary">{t("navigation.next")}</button>
          </Link>
        </div>
      </div>
    </>
  );
}
