import { useEffect, useMemo } from "react";
import { getMilestonesForTemplateBoard } from "../../lib/templateBoardActionCards";
import { useBoardMilestones } from "../../lib/useBoardMilestones";

/**
 * Resolves one template board's milestones and reports them to the parent.
 * Render one per board when a class has several template boards (hooks
 * cannot be called in a loop). Reports loading until the board's card
 * inventory (sections) is available.
 */
export default function BoardMilestonesSync({ board, onMilestones }) {
  const { milestones, loading } = useBoardMilestones(board?.id);
  const hasCardInventory = Array.isArray(board?.sections);
  const listed = useMemo(
    () =>
      hasCardInventory
        ? getMilestonesForTemplateBoard(board, milestones)
        : [],
    [board, milestones, hasCardInventory]
  );

  useEffect(() => {
    onMilestones(board?.id, listed, loading || !hasCardInventory);
  }, [board?.id, listed, loading, hasCardInventory, onMilestones]);

  return null;
}
