import FavoritePeople from "./FavoritePeople";
import useTranslation from "next-translate/useTranslation";

export default function Connections({ query, user }) {
  const { t } = useTranslation("connect");
  return (
    <>
      <h1>{t("myConnections")}</h1>
      <FavoritePeople user={user} />
    </>
  );
}
