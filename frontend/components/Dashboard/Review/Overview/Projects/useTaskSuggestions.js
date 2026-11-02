import { useEffect, useMemo, useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client";
import { useRouter } from "next/router";

import {
  CLASS_REVIEW_FORM_SCOPE,
  CLASS_REVIEW_TASK_SUGGESTIONS,
  PROJECT_CARDS_STUDENT_TASKS,
} from "../../../../Queries/Review";
import {
  FORM_DEFINITION_BY_ID,
  RESOLVE_FORM_DEFINITION,
} from "../../../../Queries/FormDefinition";
import { ALL_PUBLIC_TASKS } from "../../../../Queries/Task";
import {
  cardIncludedInReviewStep,
  resolveReviewFormKey,
} from "../../../../../lib/milestones";
import { getStudentPickedTasks } from "../../../../../lib/studentTaskSelection";
import { getLocalizedField } from "../../../../../lib/i18nContent";
import {
  getClassCurriculumTypes,
  getCurriculumType,
} from "../../../../../lib/curriculumTypes";

function hasTaskSelectorField(definition) {
  return (definition?.cards || []).some((card) =>
    (card?.fields || []).some((field) => field?.fieldType === "task_selector")
  );
}

// Task ids a review suggested through its task & survey selector answers.
function suggestedTaskIds(review) {
  const content = Array.isArray(review?.content) ? review.content : [];
  return content
    .filter(
      (item) =>
        item?.responseType === "taskSelector" && Array.isArray(item?.answer)
    )
    .flatMap((item) => item.answer);
}

export const TASK_SOURCES = {
  ALL: "all",
  MENTOR: "mentor",
  STUDENT: "student",
};

// Ranks the tasks found on at least one of `projects`, most frequent first;
// `count` is the number of proposals each is on.
function rankTasks(projects, tasksByProject, taskTitles) {
  const counts = new Map();
  for (const project of projects) {
    for (const taskId of tasksByProject.get(project.id) || []) {
      counts.set(taskId, (counts.get(taskId) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([id]) => taskTitles.has(id))
    .map(([id, count]) => ({ id, title: taskTitles.get(id), count }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
}

/**
 * Tasks & surveys tied to the proposals at one milestone, for the Feedback
 * Center task filter, from two sources:
 *
 * - mentor: suggestions mentors made in their reviews of a class's
 *   proposals. Available only when the milestone's review form has a
 *   task_selector field: the milestone's own linked form when it has one
 *   (teacher-customised forms), otherwise the form its key resolves to for
 *   each curriculum type in play.
 * - student: tasks students picked on the cards they submit with the
 *   milestone (settings.studentTaskIds). Tasks the teacher linked on the
 *   template card don't count. Available when any proposal has one.
 *
 * `source` picks which of them `suggestedTasks` and `tasksByProject` cover
 * when both are available; `activeSource` is the one in effect.
 * `studentTasksByProject` (project id → picked tasks) feeds the card chips.
 */
export default function useTaskSuggestions({
  classId,
  milestone,
  milestones = [],
  status,
  projects,
  source = TASK_SOURCES.ALL,
}) {
  const client = useApolloClient();
  const { locale } = useRouter();

  const { data: classData } = useQuery(CLASS_REVIEW_FORM_SCOPE, {
    variables: { classId },
    skip: !classId,
  });
  const theClass = classData?.class;
  const classNetworkId = theClass?.networks?.[0]?.id || null;

  // Joined into a string so a new `projects` array each render doesn't
  // re-run the form lookup.
  const curriculumTypesKey = useMemo(() => {
    if (!theClass) return "";
    const types = new Set(getClassCurriculumTypes(theClass.settings));
    for (const project of projects) {
      types.add(
        getCurriculumType({
          settings: project?.settings,
          usedInClass: { settings: theClass.settings },
        })
      );
    }
    return [...types].filter(Boolean).sort().join(",");
  }, [theClass, projects]);

  const [mentorEnabled, setMentorEnabled] = useState(false);

  useEffect(() => {
    if (!milestone || !theClass) {
      setMentorEnabled(false);
      return undefined;
    }
    let cancelled = false;
    const linkedFormId = milestone.formDefinition?.id;
    const requests = linkedFormId
      ? [
          client
            .query({
              query: FORM_DEFINITION_BY_ID,
              variables: { id: linkedFormId },
            })
            .then(({ data }) => data?.formDefinition),
        ]
      : curriculumTypesKey.split(",").map((curriculumType) =>
          client
            .query({
              query: RESOLVE_FORM_DEFINITION,
              variables: {
                key: resolveReviewFormKey(milestone, curriculumType),
                organizationId: null,
                classNetworkId,
                proposalBoardId: null,
                classId,
              },
            })
            .then(({ data }) => data?.resolveFormDefinition)
        );

    Promise.all(requests)
      .then((definitions) => {
        if (!cancelled) setMentorEnabled(definitions.some(hasTaskSelectorField));
      })
      .catch(() => {
        if (!cancelled) setMentorEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, milestone, theClass, curriculumTypesKey, classId, classNetworkId]);

  // Review.stage holds the milestone key in either case (legacy UPPERCASE,
  // seeded lowercase); see getMilestoneByKey.
  const stages = useMemo(
    () =>
      status
        ? [...new Set([status, status.toLowerCase(), status.toUpperCase()])]
        : [],
    [status]
  );

  const { data: reviewsData } = useQuery(CLASS_REVIEW_TASK_SUGGESTIONS, {
    variables: { classId, stages },
    skip: !mentorEnabled || !classId || !stages.length,
  });
  const { data: tasksData } = useQuery(ALL_PUBLIC_TASKS, {
    skip: !mentorEnabled,
  });

  // Joined so a new `projects` array each render doesn't refetch.
  const projectIdsKey = projects
    .map((project) => project.id)
    .sort()
    .join(",");
  const { data: studentCardsData } = useQuery(PROJECT_CARDS_STUDENT_TASKS, {
    variables: { projectIds: projectIdsKey.split(",") },
    skip: !projectIdsKey || !status,
  });

  // Project id → tasks students picked on the cards submitted with this
  // milestone.
  const studentTasksByProject = useMemo(() => {
    const map = new Map();
    for (const card of studentCardsData?.proposalCards || []) {
      const projectId = card?.section?.board?.id;
      if (!projectId) continue;
      if (!cardIncludedInReviewStep(card, status, milestones)) continue;
      const picked = getStudentPickedTasks(card);
      if (!picked.length) continue;
      if (!map.has(projectId)) map.set(projectId, new Map());
      const tasks = map.get(projectId);
      picked.forEach((task) => tasks.set(task.id, task));
    }
    return new Map(
      [...map.entries()].map(([projectId, tasks]) => [
        projectId,
        [...tasks.values()],
      ])
    );
  }, [studentCardsData, status, milestones]);
  const studentEnabled = projects.some(
    (project) => studentTasksByProject.get(project.id)?.length
  );
  // The requested source when both are available, else the available one.
  let activeSource = TASK_SOURCES.STUDENT;
  if (mentorEnabled && studentEnabled) activeSource = source;
  else if (mentorEnabled) activeSource = TASK_SOURCES.MENTOR;

  const mentorTasksByProject = useMemo(() => {
    const map = new Map();
    for (const review of reviewsData?.reviews || []) {
      const projectId = review?.proposal?.id;
      if (!projectId) continue;
      if (!map.has(projectId)) map.set(projectId, new Set());
      const ids = map.get(projectId);
      suggestedTaskIds(review).forEach((id) => ids.add(id));
    }
    return map;
  }, [reviewsData]);

  const taskTitles = useMemo(() => {
    const titles = new Map();
    const pickedTasks = [...studentTasksByProject.values()].flat();
    for (const task of [...(tasksData?.tasks || []), ...pickedTasks]) {
      titles.set(task.id, getLocalizedField(task, "title", locale) || "");
    }
    return titles;
  }, [tasksData, studentTasksByProject, locale]);

  // Project id → Set of task ids, for the chosen source.
  const tasksByProject = useMemo(() => {
    const studentIds = new Map(
      [...studentTasksByProject.entries()].map(([projectId, tasks]) => [
        projectId,
        new Set(tasks.map((task) => task.id)),
      ])
    );
    const useMentor = mentorEnabled && activeSource !== TASK_SOURCES.STUDENT;
    const useStudent = activeSource !== TASK_SOURCES.MENTOR;
    const map = new Map();
    const add = (byProject) => {
      for (const [projectId, ids] of byProject) {
        if (!map.has(projectId)) map.set(projectId, new Set());
        ids.forEach((id) => map.get(projectId).add(id));
      }
    };
    if (useMentor) add(mentorTasksByProject);
    if (useStudent) add(studentIds);
    return map;
  }, [mentorEnabled, activeSource, mentorTasksByProject, studentTasksByProject]);

  // Tasks on at least one proposal in this tab, for the chosen source.
  const suggestedTasks = useMemo(
    () => rankTasks(projects, tasksByProject, taskTitles),
    [projects, tasksByProject, taskTitles]
  );

  return {
    enabled: mentorEnabled || studentEnabled,
    mentorEnabled,
    studentEnabled,
    activeSource,
    suggestedTasks,
    tasksByProject,
    studentTasksByProject,
    taskTitles,
  };
}
