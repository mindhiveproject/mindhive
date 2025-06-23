import DiscoverStudyBank from "../Studies/Bank/Discover";
import StyledLibrary from "../styles/StyledLibrary";
import DiscoverTaskBank from "../Tasks/Bank/Discover";

import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

export default function Library({ query, user, isDashboard }) {
  const { t } = useTranslation("common");
  const selector = query?.selector || "study";

  return (
    <StyledLibrary>
      <div>
        <div className="menu">
          <Link
            href={{
              pathname: `${isDashboard ? "/dashboard" : ""}/discover${
                isDashboard ? "/study" : ""
              }`,
            }}
            className={
              selector === "study" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
          >
            <p>{t("studies")}</p>
          </Link>

          <Link
            href={{
              pathname: `${isDashboard ? "/dashboard" : ""}/discover/task`,
            }}
            className={
              selector === "task" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
          >
            <p>{t("tasksAndSurveys")}</p>
          </Link>
        </div>
      </div>

      {selector === "study" && (
        <DiscoverStudyBank
          query={query}
          user={user}
          isDashboard={isDashboard}
        />
      )}

      {selector === "task" && (
        <DiscoverTaskBank query={query} user={user} isDashboard={isDashboard} />
      )}
    </StyledLibrary>
  );
}
