"use client";

import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Modal from "../../DesignSystem/Modal";
import MatchingAlgorithmInfoContent from "./MatchingAlgorithmInfoContent";

/**
 * Full modal explaining ballot workflow (optional) and matching algorithms.
 */
export default function MatchingAlgorithmInfoModal({
  open,
  onClose,
  matchingAlgorithm,
  showBallotWorkflow = false,
}) {
  const { t } = useTranslation("classes");

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="large"
      maxWidth={760}
      maxHeight="90vh"
      hideScrollbar
      title={t(
        "opportunities.matchingRound.matchingInfo.infoTitle",
        {},
        { default: "How student matching works" },
      )}
      actions={
        <Button variant="text" type="button" onClick={onClose}>
          {t(
            "opportunities.matchingRound.matchingInfo.close",
            {},
            { default: "Close" },
          )}
        </Button>
      }
      bodyStyle={{
        color: "var(--MH-Theme-Neutrals-Black, #171717)",
      }}
    >
      <MatchingAlgorithmInfoContent
        matchingAlgorithm={matchingAlgorithm}
        showBallotWorkflow={showBallotWorkflow}
      />
    </Modal>
  );
}
