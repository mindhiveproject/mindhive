import { useQuery } from "@apollo/client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { PROJECTS_QUERY } from "../../../../Queries/Proposal";
import { getProjectsQueryFilterForTab, isMilestoneSubmitted, isOpenForComments } from "../../../../../lib/milestoneStatus";
import { getMilestoneByKey } from "../../../../../lib/milestones";
import { isOnTeachingTeamOf } from "../../../../../lib/classTeacherUtils";
import { studentDisplayName } from "../../../../../lib/connectBallotUtils";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { ArrowDropDownIcon } from "../../../../DesignSystem/Icons";
import Card from "./Card";
import TaskSuggestionFilter from "./TaskSuggestionFilter";
import useTaskSuggestions, { TASK_SOURCES } from "./useTaskSuggestions";

function containsAny(arr1, arr2) {
  return arr1.some((item) => arr2.includes(item));
}

// Author and collaborators of a project, once each.
function projectStudentNames(project) {
  const seen = new Set();
  return [project?.author, ...(project?.collaborators || [])]
    .filter((profile) => {
      if (!profile?.id || seen.has(profile.id)) return false;
      seen.add(profile.id);
      return true;
    })
    .map(studentDisplayName)
    .filter(Boolean);
}

const sortOptions = [
  { label: "Oldest", value: "OLDEST" },
  { label: "Newest", value: "NEWEST" },
  { label: "Least comments", value: "LEAST_COMMENTS" },
  { label: "Most comments", value: "MOST_COMMENTS" },
];

// Align the dropdown triggers with the search input sitting next to them in
// `.searchTopArea` (StyledReview): same border, radius and padding.
const FILTER_TRIGGER_STYLE = {
  border: "1px solid #cccccc",
  borderRadius: "4px",
  padding: "12px",
};

const DROPDOWN_GLYPH = <ArrowDropDownIcon width={22} height={22} />;

export default function ProjectsBoard({
  selector,
  selectedClassId,
  allUniqueClassIds,
  myClassesIds,
  allUniqueClasses,
  milestones = [],
  user,
}) {
  const { t } = useTranslation("builder");
  const { locale } = useRouter();
  const scopedClassId = selectedClassId || null;
  const classIdsForQuery = scopedClassId
    ? [scopedClassId]
    : allUniqueClassIds || [];
  const [keyword, setKeyword] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [showMyClassOnly, setShowMyClassOnly] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [taskSource, setTaskSource] = useState(TASK_SOURCES.ALL);
  const [filterSortMessage, setFilterSortMessage] = useState(
    t("review.showingAllProjects")
  );

  // Use a ref to track if this is the initial mount
  const isInitialMount = useRef(true);
  // Store the previous selector value to detect tab switches
  const prevSelector = useRef(selector);

  const { whereStatus, status, isOpenForCommentsQuery } =
    getProjectsQueryFilterForTab(selector);

  const { data, loading, error, refetch } = useQuery(PROJECTS_QUERY, {
    variables: {
      where: {
        AND: [
          ...(Object.keys(whereStatus).length ? [whereStatus] : []),
          scopedClassId
            ? { usedInClass: { id: { equals: scopedClassId } } }
            : {
                OR: [
                  { study: { featured: { equals: true } } },
                  { usedInClass: { id: { in: classIdsForQuery } } },
                ],
              },
        ],
      },
    },
    skip: !classIdsForQuery.length,
  });

  const projects = (data?.proposalBoards || []).filter((project) =>
    isMilestoneSubmitted(project, status, milestones)
  );

  // Task & survey filter: on milestones whose review form has a task
  // selector (mentor suggestions) or whose cards carry tasks students picked.
  // Picked tasks are kept (and in the URL) but ignored elsewhere.
  const {
    enabled: taskFilterEnabled,
    mentorEnabled,
    studentEnabled,
    activeSource,
    suggestedTasks,
    tasksByProject,
    studentTasksByProject,
    taskTitles,
  } = useTaskSuggestions({
    classId: scopedClassId,
    milestone: getMilestoneByKey(status, milestones),
    milestones,
    status,
    projects,
    source: taskSource,
  });
  const taskSourceOptions = [
    {
      value: TASK_SOURCES.ALL,
      label: t("review.taskSourceAll", {}, { default: "All sources" }),
    },
    {
      value: TASK_SOURCES.MENTOR,
      label: t("review.taskSourceMentor", {}, {
        default: "Suggested by mentors",
      }),
    },
    {
      value: TASK_SOURCES.STUDENT,
      label: t("review.taskSourceStudent", {}, {
        default: "Picked by students",
      }),
    },
  ];
  const activeTaskIds = useMemo(
    () => (taskFilterEnabled ? selectedTaskIds : []),
    [taskFilterEnabled, selectedTaskIds]
  );

  // Initialize state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const classesParam = params.get("classes");
    const keywordParam = params.get("keyword");
    const sortParam = params.get("sort");
    const tasksParam = params.get("tasks");
    const taskSourceParam = params.get("taskSource");

    if (classesParam) setFilteredClasses(classesParam.split(","));
    if (keywordParam) setKeyword(keywordParam);
    if (sortParam) setSortBy(sortParam);
    if (tasksParam) setSelectedTaskIds(tasksParam.split(","));
    if (taskSourceParam) setTaskSource(taskSourceParam);

    // After initial mount, set isInitialMount to false
    isInitialMount.current = false;
  }, []);

  // Update filterSortMessage based on filters
  useEffect(() => {
    let message = t("review.showingAllProjects");
    if (filteredClasses.length > 0) {
      const classTitles = filteredClasses
        .map((classId) => allUniqueClasses.find((c) => c.id === classId)?.title)
        .filter(Boolean)
        .join(", ");
      message = t("review.showingProjectsIn", { classTitles });
    }
    if (sortBy) {
      if (sortBy === "OLDEST") {
        message += t("review.sortedByOldest");
      } else if (sortBy === "NEWEST") {
        message += t("review.sortedByNewest");
      } else if (sortBy === "LEAST_COMMENTS") {
        message += t("review.sortedByLeastComments");
      } else if (sortBy === "MOST_COMMENTS") {
        message += t("review.sortedByMostComments");
      }
    }
    if (keyword) {
      message += t("review.matchingKeyword", { keyword });
    }
    const taskNames = activeTaskIds
      .map((id) => taskTitles.get(id))
      .filter(Boolean);
    if (taskNames.length) {
      const tasks = new Intl.ListFormat(locale, {
        type: "disjunction",
      }).format(taskNames.map((name) => `"${name}"`));
      if (activeSource === TASK_SOURCES.STUDENT) {
        message += t(
          "review.matchingStudentTasks",
          { tasks },
          { default: ` whose students picked ${tasks}` }
        );
      } else if (activeSource === TASK_SOURCES.ALL) {
        message += t(
          "review.matchingSuggestedOrStudentTasks",
          { tasks },
          { default: ` that were suggested or picked ${tasks}` }
        );
      } else {
        message += t(
          "review.matchingSuggestedTasks",
          { tasks },
          { default: ` that were suggested ${tasks}` }
        );
      }
    }
    setFilterSortMessage(message);
  }, [
    filteredClasses,
    sortBy,
    keyword,
    allUniqueClasses,
    activeTaskIds,
    activeSource,
    taskTitles,
    locale,
    t,
  ]);

  // Reset filters only when selector changes (not on initial mount)
  useEffect(() => {
    // Skip reset on initial mount
    if (isInitialMount.current) {
      prevSelector.current = selector;
      return;
    }

    // Reset filters only if selector actually changed (tab switch)
    if (prevSelector.current !== selector) {
      setKeyword("");
      setSortBy("");
      setFilteredClasses([]);
      setShowMyClassOnly(false);
      setSelectedTaskIds([]);
      setTaskSource(TASK_SOURCES.ALL);
      setFilterSortMessage(t("review.showingAllProjects"));
      const newUrl = window.location.pathname;
      window.history.pushState({}, document.title, newUrl);
    }

    // Update prevSelector for the next render
    prevSelector.current = selector;
  }, [selector, t]);

  // Update URL when filters change
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (scopedClassId) {
      queryParams.set("class", scopedClassId);
    }
    if (filteredClasses.length > 0) {
      queryParams.set("classes", filteredClasses.join(","));
    } else {
      queryParams.delete("classes");
    }
    if (keyword) {
      queryParams.set("keyword", keyword);
    } else {
      queryParams.delete("keyword");
    }
    if (sortBy) {
      queryParams.set("sort", sortBy);
    } else {
      queryParams.delete("sort");
    }
    if (selectedTaskIds.length > 0) {
      queryParams.set("tasks", selectedTaskIds.join(","));
    } else {
      queryParams.delete("tasks");
    }
    if (taskSource !== TASK_SOURCES.ALL) {
      queryParams.set("taskSource", taskSource);
    } else {
      queryParams.delete("taskSource");
    }

    const queryString = queryParams.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.pushState(
      { filteredClasses, keyword, sortBy, selectedTaskIds, taskSource },
      document.title,
      newUrl
    );
  }, [
    filteredClasses,
    keyword,
    sortBy,
    selectedTaskIds,
    taskSource,
    scopedClassId,
  ]);

  // Restore state on popstate (back/forward navigation)
  useEffect(() => {
    const handlePopState = (event) => {
      const params = new URLSearchParams(window.location.search);
      const classesParam = params.get("classes");
      const keywordParam = params.get("keyword");
      const sortParam = params.get("sort");
      const tasksParam = params.get("tasks");

      setFilteredClasses(classesParam ? classesParam.split(",") : []);
      setKeyword(keywordParam || "");
      setSortBy(sortParam || "");
      setSelectedTaskIds(tasksParam ? tasksParam.split(",") : []);
      setTaskSource(params.get("taskSource") || TASK_SOURCES.ALL);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Filter and sort proposals
  useEffect(() => {
    async function filterProposals() {
      const projectsFiltered = projects.filter((project) => {
        let isMatchingKeyword = true;
        let isInFilteredClasses = true;
        let isMatchingTasks = true;
        if (keyword) {
          isMatchingKeyword = project.title
            .toLowerCase()
            .includes(keyword.toLowerCase());
        }
        if (filteredClasses.length) {
          isInFilteredClasses = containsAny(
            [project?.usedInClass?.id],
            filteredClasses
          );
        }
        // Any picked task suggested to the proposal (OR).
        if (activeTaskIds.length) {
          const suggested = tasksByProject.get(project.id);
          isMatchingTasks = activeTaskIds.some((id) => suggested?.has(id));
        }
        return isMatchingKeyword && isInFilteredClasses && isMatchingTasks;
      });
      if (sortBy) {
        const projectsFilteredAndSorted = projectsFiltered.sort((a, b) => {
          if (sortBy === "OLDEST") {
            if (a.createdAt < b.createdAt) return -1;
            if (a.createdAt > b.createdAt) return 1;
          }
          if (sortBy === "NEWEST") {
            if (a.createdAt > b.createdAt) return -1;
            if (a.createdAt < b.createdAt) return 1;
          }
          if (sortBy === "LEAST_COMMENTS") {
            if (
              a?.reviews?.filter((r) => r?.stage === status).length <
              b?.reviews?.filter((r) => r?.stage === status).length
            )
              return -1;
            if (
              a?.reviews?.filter((r) => r?.stage === status).length >
              b?.reviews?.filter((r) => r?.stage === status).length
            )
              return 1;
          }
          if (sortBy === "MOST_COMMENTS") {
            if (
              a?.reviews?.filter((r) => r?.stage === status).length >
              b?.reviews?.filter((r) => r?.stage === status).length
            )
              return -1;
            if (
              a?.reviews?.filter((r) => r?.stage === status).length <
              b?.reviews?.filter((r) => r?.stage === status).length
            )
              return 1;
          }
        });
        setFilteredProjects(projectsFilteredAndSorted);
      } else {
        setFilteredProjects(projectsFiltered);
      }
    }
    if (projects) {
      filterProposals();
    }
  }, [
    projects?.length,
    keyword,
    showMyClassOnly,
    sortBy,
    filteredClasses,
    status,
    activeTaskIds,
    tasksByProject,
  ]);

  // Function to navigate to a project page
  const navigateToProject = ({ id, stage }) => {
    const feedbackCenterUrl = window.location.href; // Current URL with filters
    const projectUrl = `/dashboard/review/project?id=${id}&stage=${stage}&from=${encodeURIComponent(
      feedbackCenterUrl
    )}`; // Adjust this path as needed
    window.location.href = projectUrl; // Full navigation to another page
  };

  return (
    <div className="board">
      <div className="searchTopArea">
        <div className="searchArea" id="searchArea">
          <input
            placeholder={t("review.search")}
            type="text"
            name="keyword"
            value={keyword}
            onChange={({ target }) => setKeyword(target.value)}
          />
        </div>

        <div id="sortBy">
          <DropdownSelect
            ariaLabel={t("review.sortBy")}
            placeholder={t("review.sortBy")}
            value={sortBy}
            options={sortOptions.map((p) => ({
              value: p.value,
              label: t(`review.${p.value.toLowerCase()}`),
            }))}
            triggerStyle={FILTER_TRIGGER_STYLE}
            icon={DROPDOWN_GLYPH}
            onChange={(next) => setSortBy(next)}
          />
        </div>
        <div id="filterByClasses">
          {!scopedClassId && allUniqueClasses?.length ? (
            <DropdownSelect
              multiple
              ariaLabel={t("review.filterByClasses")}
              placeholder={t("review.filterByClasses")}
              value={filteredClasses}
              options={allUniqueClasses.map((c) => ({
                value: c.id,
                label: c.title,
              }))}
              triggerStyle={FILTER_TRIGGER_STYLE}
              icon={DROPDOWN_GLYPH}
              onChange={(next) => setFilteredClasses(next)}
            />
          ) : null}
        </div>
      </div>

      {taskFilterEnabled ? (
        <div className="taskFilterArea">
          <div className="taskFilterSearch">
            <TaskSuggestionFilter
              tasks={suggestedTasks}
              taskTitles={taskTitles}
              value={selectedTaskIds}
              onChange={setSelectedTaskIds}
              source={activeSource}
            />
          </div>
          {mentorEnabled && studentEnabled ? (
            <div id="filterByTaskSource">
              <DropdownSelect
                ariaLabel={t("review.taskSourceLabel", {}, {
                  default: "Task & survey source",
                })}
                value={taskSource}
                options={taskSourceOptions}
                triggerStyle={FILTER_TRIGGER_STYLE}
                icon={DROPDOWN_GLYPH}
                onChange={(next) => setTaskSource(next)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="p16_500">{filterSortMessage}</div>

      <div className="cardsArea">
        {filteredProjects.map((project) => (
          <Card
            stage={selector}
            project={project}
            status={status}
            isOpenForCommentsQuery={isOpenForCommentsQuery}
            milestones={milestones}
            matchedTasks={activeTaskIds
              .filter((id) => tasksByProject.get(project.id)?.has(id))
              .map((id) => ({ id, title: taskTitles.get(id) || id }))}
            studentTasks={(studentTasksByProject.get(project.id) || []).map(
              (task) => ({ id: task.id, title: taskTitles.get(task.id) || task.title })
            )}
            studentNames={
              isOnTeachingTeamOf(user, project?.usedInClass?.id)
                ? projectStudentNames(project)
                : []
            }
            key={project?.id}
            onClick={() =>
              navigateToProject({ id: project.id, stage: selector })
            }
            style={{ cursor: "pointer"}}
          />
        ))}
      </div>
    </div>
  );
}
