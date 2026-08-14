import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { RESOLVE_MILESTONES_FOR_BOARD } from "../components/Queries/Milestone";
import { resolveMilestonesFromQuery } from "./milestones";

export function useBoardMilestones(boardId, options = {}) {
  const { data, loading, error, refetch } = useQuery(
    RESOLVE_MILESTONES_FOR_BOARD,
    {
      variables: { boardId },
      skip: !boardId,
      ...options,
    }
  );

  const milestones = useMemo(
    () => resolveMilestonesFromQuery(data),
    [data]
  );

  return { milestones, loading, error, refetch };
}
