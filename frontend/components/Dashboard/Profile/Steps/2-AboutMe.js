import { useState, useCallback } from "react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import Background from "./Blocks/Background";
import BasicInformation from "./Blocks/Basic";
import IntroductionVideo from "./Blocks/Introduction";
import Preferences from "./Blocks/Preferences";
import Members from "./Blocks/Members";
import {
  profileEditHref,
  resolveProfileType,
} from "../../../../lib/profileEditNavigation";
import {
  confirmLeaveIfDirty,
  useUnsavedChangesGuard,
} from "../../../../lib/useUnsavedChangesGuard";

export default function About({ query, user }) {
  const { t } = useTranslation("connect");
  const profileType = resolveProfileType(query, user);
  const isOrganization = profileType === "organization";
  const organization = (user?.organizations || [])[0];

  const [dirtySections, setDirtySections] = useState({});
  const hasUnsavedChanges = Object.values(dirtySections).some(Boolean);

  useUnsavedChangesGuard(hasUnsavedChanges);

  const setSectionDirty = useCallback((section) => (isDirty) => {
    setDirtySections((prev) => ({ ...prev, [section]: isDirty }));
  }, []);

  const tryToLeave = (e) => {
    if (
      hasUnsavedChanges &&
      !confirmLeaveIfDirty(
        t("createProfileFlow.unsavedChangesWarning", {}, {
          default:
            "Your unsaved changes will be lost. Click Cancel to return and save your changes.",
        }),
      )
    ) {
      e.preventDefault();
    }
  };

  return (
    <>
      <div className="aboutMe">
        <BasicInformation
          query={query}
          user={user}
          onDirtyChange={setSectionDirty("basic")}
        />
        <Background
          query={query}
          user={user}
          onDirtyChange={setSectionDirty("background")}
        />
        {isOrganization && (
          <Members user={user} organization={organization} />
        )}
        {!isOrganization && (
          <>
            <IntroductionVideo
              query={query}
              user={user}
              onDirtyChange={setSectionDirty("introduction")}
            />
            <Preferences
              query={query}
              user={user}
              onDirtyChange={setSectionDirty("preferences")}
            />
          </>
        )}

        <div className="navButtons">
          <Link href={profileEditHref({ page: "type" })} onClick={tryToLeave}>
            <button className="secondary">{t("navigation.previous")}</button>
          </Link>

          <Link
            href={profileEditHref({ page: "interests", type: profileType })}
            onClick={tryToLeave}
          >
            <button className="primary">{t("navigation.next")}</button>
          </Link>
        </div>
      </div>
    </>
  );
}
