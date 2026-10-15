import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import Link from "next/link";
import clsx from "clsx";

import Header from "./Header";
import ClassStudents from "./Students";
import ClassStudies from "./Studies";
import ClassAssignments from "./Assignments/Main";
import ClassResources from "./Resources/Main";
import ClassOpportunities from "./Opportunities/Main";
import ClassSettings from "./Settings";

import { GET_CLASS } from "../../../Queries/Classes";
import RestrictedAccess from "../../../Global/Restricted";
import { NavbarItem, SectionNavbar } from "../../../DesignSystem/Navbar";
import JustOneSecondNotice from "../../../DesignSystem/JustOneSecondNotice";
import { taughtClassIds } from "../../../../lib/classTeacherUtils";

import StyledClass from "../../../styles/StyledClass";
import ClassTemplateBoardPicker from "./ClassTemplateBoardPicker";
import ProjectsBoardEditor from "./Projects/ProjectsBoardEditor";
import CreateTemplateBoardModal from "./Modals/CreateTemplateBoardModal";

import Dashboard from "./Dashboard/Main";
import {
  classHasNyuCusp,
  classIsNyuCuspOnly,
} from "../../../../lib/curriculumTypes";
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
  // `editBoard` opens a class project board's editor full screen over any tab;
  // `createBoard` opens the create-board modal (Settings tab).
  const { editBoard, createBoard } = query || {};

  const { data, loading } = useQuery(GET_CLASS, {
    variables: { code },
  });

  const myclass = data?.class || { title: "", description: "" };
  const isClassQueryPending = loading && !data;
  const hasNyuCusp = classHasNyuCusp(myclass?.settings);
  const isNyuCuspOnly = classIsNyuCuspOnly(myclass?.settings);
  const showOpportunitiesTab = hasNyuCusp;
  const defaultPage = isNyuCuspOnly ? "opportunities" : "dashboard";
  const pageFromQuery = query?.page;
  const page = pageFromQuery || defaultPage;
  const navItems = useMemo(() => {
    const filtered = CLASS_PAGE_NAV_ITEMS.filter((item) => {
      if (item.value === "opportunities" && !showOpportunitiesTab) return false;
      if (isNyuCuspOnly && NYU_CUSP_HIDDEN_TABS.has(item.value)) return false;
      return true;
    });
    if (!isNyuCuspOnly) return filtered;
    return [
      ...filtered.filter((item) => item.value === "opportunities"),
      ...filtered.filter((item) => item.value !== "opportunities"),
    ];
  }, [isNyuCuspOnly, showOpportunitiesTab]);
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
    // The Projects and Mentors tabs moved into Settings; keep old links working.
    if (page === "board" || page === "projects" || page === "mentors") {
      const next = { page: "settings" };
      if (query?.action === "edit" && query?.board) next.editBoard = query.board;
      if (query?.action === "create") {
        next.createBoard = "1";
        if (query?.template) next.fromTemplate = query.template;
      }
      router.replace({ pathname: `/dashboard/myclasses/${code}`, query: next });
      return;
    }
    if (isNyuCuspOnly && NYU_CUSP_HIDDEN_TABS.has(page)) {
      router.replace({
        pathname: `/dashboard/myclasses/${code}`,
        query: { page: defaultPage },
      });
      return;
    }
    if (isNyuCuspOnly && showOpportunitiesTab && !query?.page) {
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
    isNyuCuspOnly,
    defaultPage,
    showOpportunitiesTab,
    query?.page,
    myclass?.id,
    allowedPageValues,
  ]);

  const closeCreateBoard = () =>
    router.replace({
      pathname: `/dashboard/myclasses/${code}`,
      query: { page: "settings" },
    });
  const isMatchingRoundFullscreen =
    page === "opportunities" &&
    typeof query?.round === "string" &&
    Boolean(query.round);

  if (
    page === "board" ||
    page === "projects" ||
    page === "mentors" ||
    (isNyuCuspOnly && NYU_CUSP_HIDDEN_TABS.has(page))
  ) {
    return null;
  }

  if (isClassQueryPending) {
    return (
      <StyledClass>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <JustOneSecondNotice
            message={{
              h1: t("main.loadingClassTitle", {}, { default: "Loading class" }),
              p: t("main.loadingClassBody", {}, {
                default: "Fetching this class and its content.",
              }),
            }}
          />
        </div>
      </StyledClass>
    );
  }

  if (typeof editBoard === "string" && editBoard) {
    return (
      <StyledClass className="isProjectsFullscreen">
        <ProjectsBoardEditor
          myclass={myclass}
          user={user}
          boardId={editBoard}
          page={page}
        />
      </StyledClass>
    );
  }

  return (
    <StyledClass
      className={clsx(isMatchingRoundFullscreen && "isMatchingRoundFullscreen")}
    >
      <RestrictedAccess
        userCanAccess={[
          ...taughtClassIds(user),
          ...(user?.mentorIn || []).map((c) => c?.id),
        ]}
        whatToAccess={myclass?.id}
      >
        <div
          className={clsx(
            isMatchingRoundFullscreen && "matchingRoundFullscreenLayout",
          )}
        >
          {isMatchingRoundFullscreen ? null : (
            <>
              <Header user={user} myclass={myclass} />
              <div className="classPageNavActions">
                <ClassTemplateBoardPicker myclass={myclass} page={page} />
              </div>
              <SectionNavbar
                className="classPageNav"
                variant="underline"
                showRule
                gapless
                aria-label={t("main.classSectionsNav")}
              >
                {navItems.map((item) => (
                  <NavbarItem
                    key={item.value}
                    as={Link}
                    href={{
                      pathname: `/dashboard/myclasses/${code}`,
                      query: { page: item.value },
                    }}
                    selected={page === item.value}
                  >
                    {t(item.labelKey)}
                  </NavbarItem>
                ))}
              </SectionNavbar>
            </>
          )}

          <div>
            {page === "dashboard" && !isNyuCuspOnly && (
              <Dashboard myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "students" && (
              <ClassStudents myclass={myclass} user={user} query={query} />
            )}
          </div>
          <div>
            {page === "studies" && !isNyuCuspOnly && (
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
          <div
            className={clsx(
              isMatchingRoundFullscreen && "matchingRoundWorkspaceSlot",
            )}
          >
            {page === "opportunities" && showOpportunitiesTab && (
              <ClassOpportunities myclass={myclass} user={user} />
            )}
          </div>
          <div>
            {page === "settings" && (
              <>
                <CreateTemplateBoardModal
                  open={createBoard === "1"}
                  onClose={closeCreateBoard}
                  myclass={myclass}
                  user={user}
                  initialTemplateId={query?.fromTemplate || null}
                  page="settings"
                />
                <ClassSettings myclass={myclass} user={user} query={query} />
              </>
            )}
          </div>
        </div>
      </RestrictedAccess>
    </StyledClass>
  );
}
