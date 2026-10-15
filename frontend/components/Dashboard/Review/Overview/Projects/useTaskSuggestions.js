import { useEffect, useMemo, useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client";
import { useRouter } from "next/router";

import {
  CLASS_REVIEW_FORM_SCOPE,
  CLASS_REVIEW_TASK_SUGGESTIONS,
} from "../../../../Queries/Review";
import {
  FORM_DEFINITION_BY_ID,
  RESOLVE_FORM_DEFINITION,
} from "../../../../Queries/FormDefinition";
import { ALL_PUBLIC_TASKS } from "../../../../Queries/Task";
import { resolveReviewFormKey } from "../../../../../lib/milestones";
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

/**
 * Task & survey suggestions mentors made on a class's proposals at one
 * milestone, for the Feedback Center task filter.
 *
 * `enabled` is true only when the milestone's review form has a
 * task_selector field: the milestone's own linked form when it has one
 * (teacher-customised forms), otherwise the form its key resolves to for
 * each curriculum type in play.
 */
export default function useTaskSuggestions({
  classId,
  milestone,
  status,
  projects,
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

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!milestone || !theClass) {
      setEnabled(false);
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
        if (!cancelled) setEnabled(definitions.some(hasTaskSelectorField));
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
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
    skip: !enabled || !classId || !stages.length,
  });
  const { data: tasksData } = useQuery(ALL_PUBLIC_TASKS, { skip: !enabled });

  const tasksByProject = useMemo(() => {
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
    for (const task of tasksData?.tasks || []) {
      titles.set(
        task.id,
        task?.i18nContent?.[locale]?.title || task?.title || ""
      );
    }
    return titles;
  }, [tasksData, locale]);

  // Tasks suggested to at least one proposal in this tab, most suggested
  // first; `count` is the number of proposals each was suggested to.
  const suggestedTasks = useMemo(() => {
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
  }, [projects, tasksByProject, taskTitles]);

  return { enabled, suggestedTasks, tasksByProject, taskTitles };
}
