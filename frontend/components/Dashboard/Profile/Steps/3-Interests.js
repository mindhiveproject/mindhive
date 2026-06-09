import InterestSelector from "../InterestSelector/Main";
import useTranslation from "next-translate/useTranslation";
import { resolveProfileType } from "../../../../lib/profileEditNavigation";

export default function Interests({ query, user }) {
  const { t } = useTranslation("connect");
  const profileType = resolveProfileType(query, user);

  const title = profileType
    ? t(`createProfileFlow.interests.title.${profileType}`, {}, { default: t("interests.title") })
    : t("interests.title");

  const description = profileType
    ? t(`createProfileFlow.interests.description.${profileType}`, {}, { default: t("interests.description") })
    : t("interests.description");

  return (
    <div className="interests">
      <div className="interestsHeader">
        <div className="h40">{title}</div>
        <div className="p15">{description}</div>
      </div>

      <InterestSelector query={query} user={user} />
    </div>
  );
}
