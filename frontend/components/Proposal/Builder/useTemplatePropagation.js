import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";

import { APPLY_TEMPLATE_BOARD_CHANGES } from "../../Mutations/Proposal";
import {
  PROPOSAL_QUERY,
  OVERVIEW_PROPOSAL_BOARD_QUERY,
} from "../../Queries/Proposal";

export const TEMPLATE_AUTO_UPDATE_KEY = "proposalTemplateAutoUpdate";

/**
 * Shared hook for managing class template → clone propagation orchestration.
 *
 * Responsibilities:
 * - Persisting the auto-update setting per template board (localStorage).
 * - Exposing a propagateToClones helper around APPLY_TEMPLATE_BOARD_CHANGES.
 * - Tracking whether there are unpropagated template changes.
 */
export default function useTemplatePropagation({
  proposalId,
  refetchQueries,
} = {}) {
  const [autoUpdateStudentBoards, setAutoUpdateStudentBoards] =
    useState(true);
  const [hasUnpropagatedChanges, setHasUnpropagatedChanges] =
    useState(false);

  const markUnpropagatedChange = useCallback(
    () => setHasUnpropagatedChanges(true),
    []
  );

  const clearUnpropagatedChange = useCallback(
    () => setHasUnpropagatedChanges(false),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined" || !proposalId) return;

    try {
      const stored = window.localStorage.getItem(
        `${TEMPLATE_AUTO_UPDATE_KEY}_${proposalId}`
      );
      // Default ON: only turn off when user explicitly set "false"
      setAutoUpdateStudentBoards(stored !== "false");
    } catch (_error) {
      // Ignore storage errors and keep default value
    }
  }, [proposalId]);

  const handleAutoUpdateChange = useCallback(
    (checked) => {
      setAutoUpdateStudentBoards(checked);

      if (typeof window !== "undefined" && proposalId) {
        try {
          window.localStorage.setItem(
            `${TEMPLATE_AUTO_UPDATE_KEY}_${proposalId}`,
            String(checked)
          );
        } catch (_error) {
          // Ignore storage errors
        }
      }
    },
    [proposalId]
  );

  const [applyTemplateChanges, { loading: propagateLoading }] = useMutation(
    APPLY_TEMPLATE_BOARD_CHANGES,
    {
      refetchQueries: [
        { query: OVERVIEW_PROPOSAL_BOARD_QUERY, variables: { id: proposalId } },
        { query: PROPOSAL_QUERY, variables: { id: proposalId } },
        ...(refetchQueries || []),
      ],
      onCompleted: () => clearUnpropagatedChange(),
    }
  );

  const propagateToClones = useCallback(
    async (options) => {
      if (!proposalId) return null;

      const res = await applyTemplateChanges({
        variables: {
          templateBoardId: proposalId,
          cardIdsWithContentUpdate: options?.contentChangedCardIds ?? null,
        },
      });

      return res?.data?.applyTemplateBoardChanges ?? null;
    },
    [proposalId, applyTemplateChanges]
  );

  return {
    autoUpdateStudentBoards,
    handleAutoUpdateChange,
    hasUnpropagatedChanges,
    markUnpropagatedChange,
    clearUnpropagatedChange,
    propagateToClones,
    propagateLoading,
  };
}

