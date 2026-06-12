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
  resolveLinkedOrganization,
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
  const organization = resolveLinkedOrganization(user);

  const [dirtySections, setDirtySections] = useState({});
  const hasUnsavedChanges = Object.values(dirtySections).some(Boolean);

  useUnsavedChangesGuard(hasUnsavedChanges);

  const setBasicDirty = useCallback((isDirty) => {
    setDirtySections((prev) =>
      prev.basic === isDirty ? prev : { ...prev, basic: isDirty },
    );
  }, []);

  const setBackgroundDirty = useCallback((isDirty) => {
    setDirtySections((prev) =>
      prev.background === isDirty ? prev : { ...prev, background: isDirty },
    );
  }, []);

  const setIntroductionDirty = useCallback((isDirty) => {
    setDirtySections((prev) =>
      prev.introduction === isDirty ? prev : { ...prev, introduction: isDirty },
    );
  }, []);

  const setPreferencesDirty = useCallback((isDirty) => {
    setDirtySections((prev) =>
      prev.preferences === isDirty ? prev : { ...prev, preferences: isDirty },
    );
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
          onDirtyChange={setBasicDirty}
        />
        <Background
          query={query}
          user={user}
          onDirtyChange={setBackgroundDirty}
        />
        {isOrganization && (
          <Members user={user} organization={organization} />
        )}
        {!isOrganization && (
          <>
            <IntroductionVideo
              query={query}
              user={user}
              onDirtyChange={setIntroductionDirty}
            />
            <Preferences
              query={query}
              user={user}
              onDirtyChange={setPreferencesDirty}
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
