import { useMemo } from "react";
import { useQuery } from "@apollo/client";

import { GET_LINKABLE_RESOURCES } from "../components/Queries/Resource";
import { GET_LINKABLE_ASSIGNMENTS } from "../components/Queries/Assignment";
import { getBoardTemplateClassIds } from "./classTemplateBoards";

// What a board card's Linked Items picker may offer: items in the board's
// classes, the teacher's own items, and public ones. Each item carries
// `sources` ("class" | "mine" | "public") so the picker can group or filter.
//
// TODO(class-networks): add a "network" source for resources and assignments
// shared through the class's networks once networks can share them.

/** The board's own class plus the classes it is a template for. */
export function getBoardClassIds(board) {
  const ids = [board?.usedInClass?.id, ...getBoardTemplateClassIds(board)];
  return [...new Set(ids.filter(Boolean))];
}

function isMine(item, userId) {
  return (
    item?.author?.id === userId ||
    Boolean(item?.collaborators?.some((c) => c?.id === userId))
  );
}

export function getLinkableItemSources(item, type, { userId, classIds }) {
  const sources = [];
  if ((item?.classes || []).some((c) => classIds.includes(c?.id))) {
    sources.push("class");
  }
  if (isMine(item, userId)) sources.push("mine");
  const isPublic = type === "assignment" ? item?.isTemplate : item?.isPublic;
  if (isPublic) sources.push("public");
  return sources;
}

export function useLinkableItems(board, user) {
  const userId = user?.id;
  const classIds = getBoardClassIds(board);
  const variables = { userId, classIds };
  const skip = !userId;

  const resourcesQuery = useQuery(GET_LINKABLE_RESOURCES, { variables, skip });
  const assignmentsQuery = useQuery(GET_LINKABLE_ASSIGNMENTS, { variables, skip });

  const classKey = classIds.join(",");
  const resources = useMemo(
    () =>
      (resourcesQuery.data?.resources || []).map((item) => ({
        ...item,
        sources: getLinkableItemSources(item, "resource", { userId, classIds }),
      })),
    // classIds is rebuilt every render; classKey stands in for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resourcesQuery.data, userId, classKey]
  );
  const assignments = useMemo(
    () =>
      (assignmentsQuery.data?.assignments || []).map((item) => ({
        ...item,
        sources: getLinkableItemSources(item, "assignment", { userId, classIds }),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assignmentsQuery.data, userId, classKey]
  );

  return {
    classIds,
    resources,
    assignments,
    resourcesLoading: resourcesQuery.loading,
    assignmentsLoading: assignmentsQuery.loading,
    refetchResources: resourcesQuery.refetch,
    refetchAssignments: assignmentsQuery.refetch,
  };
}
