import InterestSelector from "../InterestSelector/Main";
import useTranslation from "next-translate/useTranslation";

export default function Interests({ query, user }) {
  const { t } = useTranslation("connect");

  return (
    <div className="interests">
      <div className="interestsHeader">
        <div className="h40">{t("interests.title")}</div>
        <div className="p15">
          {t("interests.description")}
        </div>
      </div>

      <InterestSelector user={user} />
    </div>
  );
}
