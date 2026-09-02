import { useCallback, useState } from "react";
import { useMutation } from "@apollo/client";

import { TOGGLE_FAVORITE_OPPORTUNITY_GUARDED } from "../../Mutations/Opportunity";
import { CURRENT_USER_QUERY } from "../../Queries/User";
import FavoriteDraftConflictModal from "./FavoriteDraftConflictModal";

/**
 * Guarded opportunity favorite toggle with draft-ranking confirmation.
 */
export default function useToggleFavoriteOpportunity({
  opportunityId,
  isFavorite,
  hasDraftRanking = false,
  refetchQueries = [],
  onAfterToggle,
} = {}) {
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [toggleFavorite, { loading }] = useMutation(
    TOGGLE_FAVORITE_OPPORTUNITY_GUARDED,
    {
      refetchQueries: [{ query: CURRENT_USER_QUERY }, ...refetchQueries],
      awaitRefetchQueries: true,
    },
  );

  const runToggle = useCallback(
    async (confirmRemoveFromDraftRanking = false) => {
      if (!opportunityId) return null;

      const { data } = await toggleFavorite({
        variables: {
          opportunityId,
          confirmRemoveFromDraftRanking,
        },
      });

      const result = data?.toggleFavoriteOpportunity;
      if (
        result?.requiresConfirmation &&
        !confirmRemoveFromDraftRanking
      ) {
        setPendingConfirm(true);
        return result;
      }

      setPendingConfirm(false);
      if (typeof onAfterToggle === "function") {
        await onAfterToggle(result);
      }
      return result;
    },
    [opportunityId, toggleFavorite, onAfterToggle],
  );

  const handleToggle = useCallback(async () => {
    if (!opportunityId) return;
    if (!isFavorite) {
      await runToggle(false);
      return;
    }

    // Prompt before mutating when browse data already knows this opp is draft-ranked.
    if (hasDraftRanking) {
      setPendingConfirm(true);
      return;
    }

    await runToggle(false);
  }, [hasDraftRanking, isFavorite, opportunityId, runToggle]);

  const handleKeepFavorite = useCallback(() => {
    setPendingConfirm(false);
  }, []);

  const handleConfirmRemove = useCallback(async () => {
    await runToggle(true);
  }, [runToggle]);

  const conflictModal = (
    <FavoriteDraftConflictModal
      open={pendingConfirm}
      onKeepFavorite={handleKeepFavorite}
      onConfirmRemove={handleConfirmRemove}
      loading={loading}
    />
  );

  return {
    toggleFavorite: handleToggle,
    loading,
    conflictModal,
    pendingConfirm,
  };
}
