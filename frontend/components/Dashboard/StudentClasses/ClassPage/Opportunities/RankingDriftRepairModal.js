import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import Modal from "../../../../DesignSystem/Modal";

/**
 * One-time repair when a draft ranking contains opportunities no longer favorited.
 */
export default function RankingDriftRepairModal({
  open,
  driftCount = 0,
  onRestoreFavorites,
  onRemoveFromDraft,
  loading = false,
}) {
  const { t } = useTranslation("classes");

  return (
    <Modal
      open={open}
      onClose={() => {}}
      title={t(
        "opportunities.studentView.rankForm.driftRepair.title",
        {},
        { default: "Ranking out of sync with favorites" },
      )}
      maxWidth={520}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onRemoveFromDraft}
            disabled={loading}
          >
            {t(
              "opportunities.studentView.rankForm.driftRepair.removeFromDraft",
              {},
              { default: "Remove from draft ranking" },
            )}
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={onRestoreFavorites}
            disabled={loading}
          >
            {t(
              "opportunities.studentView.rankForm.driftRepair.restoreFavorites",
              {},
              { default: "Restore favorites" },
            )}
          </Button>
        </>
      }
    >
      <p>
        {t(
          "opportunities.studentView.rankForm.driftRepair.body",
          { count: driftCount },
          {
            default:
              "{{count}} opportunities in your draft ranking are no longer starred. Restore them as favorites or remove them from your draft ranking.",
          },
        )}
      </p>
    </Modal>
  );
}
