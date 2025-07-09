import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import AddClass from "./AddClass";
import ClassPage from "./ClassPage/Main";

import ClassesList from "./ClassesList";
import StyledClass from "../../styles/StyledClass";

export default function TeacherClasses({ query, user }) {
  const { t } = useTranslation("classes");
  const { selector } = query;

  if (!selector) {
    return (
      <StyledClass>
        <h1>{t("teacherClasses.teacherClasses")}</h1>
        <Link href="/dashboard/myclasses/add">
          <button>{t("teacherClasses.addClass")}</button>
        </Link>
        <ClassesList query={query} user={user} />
      </StyledClass>
    );
  }
  if (selector === "add") {
    return <AddClass user={user} />;
  }

  return <ClassPage code={selector} user={user} query={query} />;
}
