/**
 * Builder URL identity: selector means a proposalBoard id on /builder/projects
 * and a study id on /builder/studies and /builder/cloneofstudy.
 */

export function getBuilderMode(area) {
  if (area === "projects") return "project";
  if (area === "cloneofstudy") return "cloneofstudy";
  return "study";
}

export function isProjectArea(area) {
  return area === "projects";
}

export function isStudySelectorArea(area) {
  return area === "studies" || area === "cloneofstudy";
}

export function defaultBuilderTab(area) {
  return getBuilderMode(area) === "project" ? "board" : "page";
}

export function dashboardBackPath(area) {
  return isProjectArea(area)
    ? "/dashboard/develop/projects"
    : "/dashboard/develop/studies";
}

export function builderHref({ area, selector, tab, query = {} }) {
  return {
    pathname: `/builder/${area}`,
    query: {
      selector,
      ...(tab ? { tab } : {}),
      ...query,
    },
  };
}

export function stayOnBuilder({ area, selector, tab, extraQuery = {} }) {
  return builderHref({ area, selector, tab, query: extraQuery });
}

/**
 * Collect / participant deep links must keep the current area and selector
 * (proposal id vs study id), not switch to /builder/studies with a study id.
 */
export function collectHref({ area, selector, extraQuery = {} }) {
  return stayOnBuilder({
    area,
    selector,
    tab: "collect",
    extraQuery,
  });
}

export function getNavTabs({ mode, t }) {
  if (mode === "cloneofstudy") {
    return [{ value: "page", name: t("participantPage") }];
  }

  const tabs = [];

  tabs.push({ value: "board", name: t("projectBoard") });

  if (mode === "project") {
    tabs.push({ value: "builder", name: t("studyBuilder") });
    tabs.push({ value: "page", name: t("participantPage") });
  } else {
    tabs.push({ value: "page", name: t("participantPage") });
    tabs.push({ value: "builder", name: t("studyBuilder") });
  }

  tabs.push({ value: "collect", name: t("testAndCollect") });
  tabs.push({ value: "journal", name: t("visualize") });

  return tabs;
}
