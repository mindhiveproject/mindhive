import Link from "next/link";
import clsx from "clsx";
import ClassPage from "./ClassPage/Main";

import ClassesList from "./ClassesList";
import StyledClass from "../../styles/StyledClass";
import Button from "../../DesignSystem/Button";
import useTranslation from "next-translate/useTranslation";

export default function StudentClasses({ query, user }) {
  const { t } = useTranslation("classes");
  const { selector } = query;

  if (!selector) {
    return (
      <StyledClass>
        <div className="teacherClassesHeader">
          <h1>{t("myClasses", {}, { default: "My classes" })}</h1>
          <Link href="/signup/student">
            <Button variant="filled">
              {t("joinClass", {}, { default: "Join class" })}
            </Button>
          </Link>
        </div>
        <ClassesList query={query} user={user} />
      </StyledClass>
    );
  }

  const isOpportunityPreview =
    query?.page === "opportunities" && !!query?.opportunity;

  return (
    <StyledClass className={clsx(isOpportunityPreview && "isContentFullscreen")}>
      <ClassPage code={selector} user={user} query={query} />
    </StyledClass>
  );
}
