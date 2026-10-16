// Add/useSimulationSource.js
import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";

import { GET_BLOCK_AGGVAR, GET_STUDY_FLOW } from "../../../../../Queries/Study";
import {
  collectFlowTaskNodes,
  parseTaskAggregateVariables,
} from "../../../../../../lib/simulateStudyDataset";

/** Study flow, lock status and each block's aggregate variables for the Simulated data source. */
export default function useSimulationSource({ studyId, skip }) {
  const { locale = "en-us" } = useRouter();

  const {
    data: studyData,
    loading: studyLoading,
    error: studyError,
  } = useQuery(GET_STUDY_FLOW, {
    variables: { where: { id: { equals: studyId } } },
    skip: skip || !studyId,
  });

  const study = studyData?.studies?.[0] || null;
  const flow = study?.flow || [];

  const taskIds = useMemo(
    () => [
      ...new Set(
        collectFlowTaskNodes(flow)
          .map((node) => node?.componentID)
          .filter(Boolean),
      ),
    ],
    [flow],
  );

  const {
    data: tasksData,
    loading: tasksLoading,
    error: tasksError,
  } = useQuery(GET_BLOCK_AGGVAR, {
    variables: { where: { id: { in: taskIds } } },
    skip: skip || taskIds.length === 0,
  });

  const variablesByTaskId = useMemo(
    () =>
      Object.fromEntries(
        (tasksData?.tasks || []).map((task) => [
          task.id,
          parseTaskAggregateVariables(task, locale),
        ]),
      ),
    [tasksData?.tasks, locale],
  );

  return {
    study,
    flow,
    isLocked: study?.dataCollectionStatus === "SUBMITTED",
    variablesByTaskId,
    loading: studyLoading || tasksLoading,
    error: studyError || tasksError,
  };
}
