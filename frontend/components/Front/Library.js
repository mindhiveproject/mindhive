import DiscoverStudyBank from "../Studies/Bank/Discover";
import StyledLibrary from "../styles/StyledLibrary";
import DiscoverTaskBank from "../Tasks/Bank/Discover";

import Link from "next/link";

export default function Library({ query, user, isDashboard }) {
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
            <p>Studies</p>
          </Link>

          <Link
            href={{
              pathname: `${isDashboard ? "/dashboard" : ""}/discover/task`,
            }}
            className={
              selector === "task" ? "menuTitle selectedMenuTitle" : "menuTitle"
            }
          >
            <p>Tasks & Surveys</p>
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
