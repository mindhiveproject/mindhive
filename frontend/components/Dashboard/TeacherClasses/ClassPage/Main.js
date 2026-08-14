import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import Link from "next/link";

import Header from "./Header";
import ClassStudents from "./Students";
import ClassMentors from "./Mentors";
import ClassStudies from "./Studies";
import ClassProjects from "./Projects/Main";
import ClassAssignments from "./Assignments/Main";
import ClassResources from "./Resources/Main";
import ClassOpportunities from "./Opportunities/Main";
import ClassSettings from "./Settings";

import { GET_CLASS } from "../../../Queries/Classes";
import RestrictedAccess from "../../../Global/Restricted";

import StyledClass from "../../../styles/StyledClass";

import Dashboard from "./Dashboard/Main";
import { normalizeCurriculumType } from "../../../../lib/curriculumTypes";
import {
  readClassPrefs,
  writeClassPagePref,
} from "./classPagePrefs";

const NYU_CUSP_HIDDEN_TABS = new Set([
  "dashboard",
  "studies",
  "assignments",
  "resources",
]);

const CLASS_PAGE_NAV_ITEMS = [
  {
    value: "dashboard",
    labelKey: "main.dashboard",
    iconSrc: "/assets/icons/visualize/bar_chart.svg",
  },
  {
    value: "students",
    labelKey: "main.students",
    iconSrc: "/assets/icons/profile/people.svg",
  },
  {
    value: "mentors",
    labelKey: "main.mentors",
    iconSrc: "/assets/icons/user.svg",
  },
  {
    value: "projects",
    labelKey: "main.projects",
    iconSrc: "/assets/icons/project.svg",
  },
  {
    value: "studies",
    labelKey: "main.studies",
    iconSrc: "/assets/icons/education.svg",
  },
  {
    value: "assignments",
    labelKey: "main.assignments",
    iconSrc: "/assets/icons/document.svg",
  },
  {
    value: "resources",
    labelKey: "main.resources",
    iconSrc: "/assets/icons/visualize/folder_open.svg",
  },
  {
    value: "opportunities",
    labelKey: "main.opportunities",
    iconSrc: "/assets/icons/group.svg",
  },
  {
    value: "settings",
    labelKey: "main.settings",
    iconSrc: "/assets/icons/settings.svg",
  },
];

export default function ClassPage({ code, user, query }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { action, board } = query || {};

  const { data } = useQuery(GET_CLASS, {
    variables: { code },
  });

  const myclass = data?.class || { title: "", description: "" };
  const curriculumType = normalizeCurriculumType(
    myclass?.settings?.curriculumType
  );
  const isNyuCusp = curriculumType === "nyu_cusp";
  const showOpportunitiesTab = isNyuCusp;
  const defaultPage = isNyuCusp ? "opportunities" : "dashboard";
  const pageFromQuery = query?.page;
  const page = pageFromQuery || defaultPage;
  const navItems = useMemo(() => {
    const filtered = CLASS_PAGE_NAV_ITEMS.filter((item) => {
      if (item.value === "opportunities" && !showOpportunitiesTab) return false;
      if (isNyuCusp && NYU_CUSP_HIDDEN_TABS.has(item.value)) return false;
      return true;
    });
    if (!isNyuCusp) return filtered;
    return [
      ...filtered.filter((item) => item.value === "opportunities"),
      ...filtered.filter((item) => item.value !== "opportunities"),
    ];
  }, [isNyuCusp, showOpportunitiesTab]);
  const allowedPageValues = useMemo(
    () => navItems.map((item) => item.value),
    [navItems]
  );

  useEffect(() => {
    if (!router.isReady || !myclass?.id) return;

    if (!pageFromQuery) {
      const savedPage = readClassPrefs(myclass.id)?.page;
      if (savedPage && allowedPageValues.includes(savedPage)) {
        router.replace({
          pathname: `/dashboard/myclasses/${code}`,
          query: { page: savedPage },
        });
        return;
      }
    } else if (allowedPageValues.includes(pageFromQuery)) {
      writeClassPagePref(myclass.id, pageFromQuery);
    }
  }, [
    router.isReady,
    myclass?.id,
    pageFromQuery,
    code,
    router,
    allowedPageValues,
  ]);

  useEffect(() => {
    if (page === "board") {
      router.replace({
        pathname: `/dashboard/myclasses/${code}`,
        query: { page: "projects" },
      });
      return;
    }
    if (isNyuCusp && NYU_CUSP_HIDDEN_TABS.has(page)) {
      router.replace({
        pathname: `/dashboard/myclasses/${code}`,
        query: { page: defaultPage },
      });
      return;
    }
    if (isNyuCusp && showOpportunitiesTab && !query?.page) {
      const savedPage = myclass?.id
        ? readClassPrefs(myclass.id)?.page
        : null;
      if (savedPage && allowedPageValues.includes(savedPage)) {
        return;
      }
      router.replace({
        pathname: `/dashboard/myclasses/${code}`,
        query: { page: "opportunities" },
      });
    }
  }, [
    page,
    code,
    router,
    isNyuCusp,
    defaultPage,
    showOpportunitiesTab,
    query?.page,
    myclass?.id,
    allowedPageValues,
  ]);

  const isProjectsFullscreen =
    page === "projects" && action === "edit" && board;

  if (page === "board" || (isNyuCusp && NYU_CUSP_HIDDEN_TABS.has(page))) {
    return null;
  }

  if (isProjectsFullscreen) {
    return (
      <StyledClass>
        <ClassProjects myclass={myclass} user={user} query={query} />
      </StyledClass>
    );
  }

  return (
    <StyledClass>
      <RestrictedAccess
        userCanAccess={[
          ...user?.teacherIn.map((c) => c?.id),
          ...user?.mentorIn.map((c) => c?.id),
        ]}
        whatToAccess={myclass?.id}
      >
        <div>
          <Header user={user} myclass={myclass} />
          <nav className="classPageNav" aria-label={t("main.classSectionsNav")}>
            <div className="secondLine">
              <div className="menu">
                {navItems.map((item) => (
                  <Link
                    key={item.value}
                    href={{
                      pathname: `/dashboard/myclasses/${code}`,
                      query: { page: item.value },
                    }}
                    aria-current={page === item.value ? "page" : undefined}
                  >
                    <div
                      className={
                        page === item.value
                          ? "menuTitle selectedMenuTitle"
                          : "menuTitle"
                      }
                    >
                      <div className="titleWithIcon">
                        <p>{t(item.labelKey)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div>
            {page === "dashboard" && !isNyuCusp && (
              <Dashboard myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "students" && (
              <ClassStudents myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "mentors" && (
              <ClassMentors myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "projects" && (
              <ClassProjects myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "studies" && !isNyuCusp && (
              <ClassStudies myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "assignments" && (
              <ClassAssignments myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "resources" && (
              <ClassResources myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "opportunities" && showOpportunitiesTab && (
              <ClassOpportunities myclass={myclass} user={user} />
            )}
          </div>
          <div>
            {page === "settings" && (
              <ClassSettings myclass={myclass} user={user} query={query} />
            )}
          </div>
        </div>
      </RestrictedAccess>
    </StyledClass>
  );
}
