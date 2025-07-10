import Link from "next/link";
import ClassPage from "./ClassPage/Main";

import ClassesList from "./ClassesList";
import StyledClass from "../../styles/StyledClass";
import useTranslation from "next-translate/useTranslation";

export default function StudentClasses({ query, user }) {
  const { t } = useTranslation("classes");
  const { selector } = query;

  if (!selector) {
    return (
      <StyledClass>
        <h1>{t("myClasses")}</h1>
        <Link href="/signup/student">
          <button>{t("joinClass")}</button>
        </Link>
        <ClassesList query={query} user={user} />
      </StyledClass>
    );
  }

  return (
    <StyledClass>
      <ClassPage code={selector} user={user} query={query} />
    </StyledClass>
  );
}
