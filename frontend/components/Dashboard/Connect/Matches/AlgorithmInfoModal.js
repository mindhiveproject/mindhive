import MatchingAlgorithmInfoModal from "../../shared/MatchingAlgorithmInfoModal";

/**
 * Connect Matches page wrapper — reuses class-area matching info modal.
 * Descriptions are grounded in matchingAlgorithm.js; update shared content when algorithm changes.
 */
export default function AlgorithmInfoModal({
  open,
  onClose,
  matchingAlgorithm,
}) {
  return (
    <MatchingAlgorithmInfoModal
      open={open}
      onClose={onClose}
      matchingAlgorithm={matchingAlgorithm}
      showBallotWorkflow={false}
    />
  );
}
