import useTranslation from "next-translate/useTranslation";

export default function Header({ user, myclass }) {
  const { t } = useTranslation("classes");

  return (
    <div>
      <div className="editableClassHeader">
        <h1>{myclass?.title}</h1>
        <h2>{myclass?.description}</h2>
        <div className="teacher">{t("teacher")} {myclass?.creator?.username}</div>
      </div>
    </div>
  );
}
