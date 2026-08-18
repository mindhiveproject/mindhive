import Link from "next/link";
import AddLesson from "./AddLesson";
import EditLesson from "./EditLesson";

import LessonsList from "./LessonsList";
import Button from "../../DesignSystem/Button";
import useTranslation from "next-translate/useTranslation";

export default function LessonsMain({ query, user }) {
  const { selector } = query;
  const { t } = useTranslation("dashboard");

  if (!selector) {
    return (
      <>
        <h1>My lessons</h1>
        <Link href="/dashboard/lessons/add">
          <Button variant="filled" type="button">
            {t("lessons.addLesson", {}, { default: "Add lesson" })}
          </Button>
        </Link>
        <LessonsList query={query} user={user} />
      </>
    );
  }
  if (selector === "add") {
    return <AddLesson user={user} />;
  }
  return <EditLesson selector={selector} user={user} query={query} />;
}
