import { useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import Link from "next/link";

import Header from "./Header";
import ClassAssignments from "./Assignments/Main";
import ClassStudies from "./Studies";
import ClassProjects from "./Projects";
import ClassOpportunities from "./Opportunities/Main";

import { GET_CLASS } from "../../../Queries/Classes";
import { NavbarItem, SectionNavbar } from "../../../DesignSystem/Navbar";
import {
  classHasNyuCusp,
  classIsNyuCuspOnly,
} from "../../../../lib/curriculumTypes";

/** Default (non–NYU Capstone): Projects → Studies → Assignments. */
const DEFAULT_NAV_ITEMS = [
  {
    value: "projects",
    labelKey: "main.projects",
    defaultLabel: "Projects",
  },
  {
    value: "studies",
    labelKey: "main.studies",
    defaultLabel: "Studies",
  },
  {
    value: "assignments",
    labelKey: "main.assignments",
    defaultLabel: "Assignments",
  },
];

/** NYU Capstone (nyu_cusp): Opportunities first, then Projects only. */
const NYU_CUSP_NAV_ITEMS = [
  {
    value: "opportunities",
    labelKey: "main.opportunities",
    defaultLabel: "Opportunities",
  },
  {
    value: "projects",
    labelKey: "main.projects",
    defaultLabel: "Projects",
  },
];

const NYU_CUSP_ALLOWED_PAGES = new Set(
  NYU_CUSP_NAV_ITEMS.map((item) => item.value)
);
const DEFAULT_ALLOWED_PAGES = new Set(
  DEFAULT_NAV_ITEMS.map((item) => item.value)
);

/** Mixed curricula: Opportunities plus the default student tabs. */
const MIXED_NAV_ITEMS = [
  NYU_CUSP_NAV_ITEMS[0],
  ...DEFAULT_NAV_ITEMS,
];
const MIXED_ALLOWED_PAGES = new Set(
  MIXED_NAV_ITEMS.map((item) => item.value)
);

export default function ClassPage({ code, user, query }) {
  const { t } = useTranslation("classes");
  const router = useRouter();

  const { data } = useQuery(GET_CLASS, {
    variables: { code },
  });

  const myclass = data?.class || { title: "", description: "" };
  const hasClassData = Boolean(data?.class);
  const isNyuCuspOnly = hasClassData && classIsNyuCuspOnly(myclass?.settings);
  const hasNyuCusp = hasClassData && classHasNyuCusp(myclass?.settings);
  // Wait for class settings before choosing nav — avoids flashing non-Capstone tabs on NYU classes.
  const navItems = !hasClassData
    ? []
    : isNyuCuspOnly
      ? NYU_CUSP_NAV_ITEMS
      : hasNyuCusp
        ? MIXED_NAV_ITEMS
        : DEFAULT_NAV_ITEMS;
  const defaultPage = isNyuCuspOnly ? "opportunities" : "projects";
  const allowedPages = isNyuCuspOnly
    ? NYU_CUSP_ALLOWED_PAGES
    : hasNyuCusp
      ? MIXED_ALLOWED_PAGES
      : DEFAULT_ALLOWED_PAGES;
  const page = query?.page || (hasClassData ? defaultPage : undefined);

  useEffect(() => {
    if (!hasClassData) return;
    if (!query?.page || !allowedPages.has(query.page)) {
      router.replace({
        pathname: `/dashboard/classes/${code}`,
        query: { page: defaultPage },
      });
    }
  }, [hasClassData, allowedPages, defaultPage, query?.page, code, router]);

  const hideDisallowedPage =
    hasClassData && query?.page && !allowedPages.has(query.page);

  const isOpportunitiesFullscreen =
    page === "opportunities" &&
    (!!query?.opportunity || !!query?.round);

  // Full-page opportunity preview / ranking: skip class header + tab nav
  // (left dashboard nav stays). Preview vs rank is decided inside ClassOpportunities.
  if (isOpportunitiesFullscreen && !hideDisallowedPage) {
    return (
      <ClassOpportunities myclass={myclass} user={user} query={query} />
    );
  }

  return (
    <div>
      <Header myclass={myclass} />
      <SectionNavbar
        className="classPageNav"
        variant="underline"
        showRule
        aria-label={t("main.classSectionsNav", {}, {
          default: "Class sections",
        })}
      >
        {navItems.map((item) => (
          <NavbarItem
            key={item.value}
            as={Link}
            href={{
              pathname: `/dashboard/classes/${code}`,
              query: { page: item.value },
            }}
            selected={page === item.value}
          >
            {t(item.labelKey, {}, { default: item.defaultLabel })}
          </NavbarItem>
        ))}
      </SectionNavbar>

      {!hideDisallowedPage && page === "assignments" && (
        <div>
          <ClassAssignments myclass={myclass} user={user} query={query} />
        </div>
      )}

      {!hideDisallowedPage && page === "studies" && (
        <div>
          <ClassStudies myclass={myclass} user={user} query={query} />
        </div>
      )}

      {!hideDisallowedPage && page === "projects" && (
        <div>
          <ClassProjects myclass={myclass} user={user} query={query} />
        </div>
      )}

      {!hideDisallowedPage && page === "opportunities" && (
        <div>
          <ClassOpportunities myclass={myclass} user={user} query={query} />
        </div>
      )}
    </div>
  );
}
