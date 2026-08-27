import DiscoverStudyBank from "../Studies/Bank/Discover";
import StyledLibrary from "../styles/StyledLibrary";
import DiscoverTaskBank from "../Tasks/Bank/Discover";
import { NavbarItem, SectionNavbar } from "../DesignSystem/Navbar";

import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

export default function Library({ query, user, isDashboard }) {
  const { t } = useTranslation("common");
  const selector = query?.selector || "study";
  const basePath = `${isDashboard ? "/dashboard" : ""}/discover`;

  return (
    <StyledLibrary>
      <SectionNavbar
        variant="underline"
        showRule
        gapless
        aria-label={t("navigation.discover", {}, { default: "Discover" })}
      >
        <NavbarItem
          as={Link}
          href={{ pathname: isDashboard ? `${basePath}/study` : basePath }}
          selected={selector === "study"}
        >
          {t("navigation.studies")}
        </NavbarItem>

        <NavbarItem
          as={Link}
          href={{ pathname: `${basePath}/task` }}
          selected={selector === "task"}
        >
          {t("tasksAndSurveys")}
        </NavbarItem>
      </SectionNavbar>

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
