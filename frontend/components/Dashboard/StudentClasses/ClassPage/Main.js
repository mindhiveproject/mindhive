import { useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import Link from "next/link";
import clsx from "clsx";

import Header from "./Header";
import ClassAssignments from "./Assignments/Main";
import ClassStudies from "./Studies";
import ClassProjects from "./Projects";
import ClassOpportunities from "./Opportunities/Main";

import { GET_CLASS } from "../../../Queries/Classes";
import { normalizeCurriculumType } from "../../../../lib/curriculumTypes";

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

export default function ClassPage({ code, user, query }) {
  const { t } = useTranslation("classes");
  const router = useRouter();

  const { data } = useQuery(GET_CLASS, {
    variables: { code },
  });

  const myclass = data?.class || { title: "", description: "" };
  const hasClassData = Boolean(data?.class);
  const isNyuCusp =
    hasClassData &&
    normalizeCurriculumType(myclass?.settings?.curriculumType) === "nyu_cusp";
  // Wait for class settings before choosing nav — avoids flashing non-Capstone tabs on NYU classes.
  const navItems = !hasClassData
    ? []
    : isNyuCusp
      ? NYU_CUSP_NAV_ITEMS
      : DEFAULT_NAV_ITEMS;
  const defaultPage = isNyuCusp ? "opportunities" : "projects";
  const allowedPages = isNyuCusp ? NYU_CUSP_ALLOWED_PAGES : DEFAULT_ALLOWED_PAGES;
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

  return (
    <div>
      <Header myclass={myclass} />
      <nav
        className="classPageNav"
        aria-label={t("main.classSectionsNav", {}, {
          default: "Class sections",
        })}
      >
        <div className="secondLine">
          <div className="menu">
            {navItems.map((item) => (
              <Link
                key={item.value}
                href={{
                  pathname: `/dashboard/classes/${code}`,
                  query: { page: item.value },
                }}
                aria-current={page === item.value ? "page" : undefined}
              >
                <div
                  className={clsx(
                    "menuTitle",
                    page === item.value && "selectedMenuTitle"
                  )}
                >
                  <div className="titleWithIcon">
                    <p>
                      {t(item.labelKey, {}, {
                        default: item.defaultLabel,
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>

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
