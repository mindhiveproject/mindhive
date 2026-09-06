import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Modal from "../../DesignSystem/Modal";

/**
 * Confirms unfavoriting an opportunity that appears in a draft ranking.
 */
export default function FavoriteDraftConflictModal({
  open,
  onKeepFavorite,
  onConfirmRemove,
  loading = false,
}) {
  const { t } = useTranslation("connect");

  return (
    <Modal
      open={open}
      onClose={onKeepFavorite}
      title={t(
        "favoriteDraftConflict.title",
        {},
        { default: "Remove from favorites?" },
      )}
      maxWidth={480}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onKeepFavorite}
            disabled={loading}
          >
            {t(
              "favoriteDraftConflict.keepFavorite",
              {},
              { default: "Keep favorite" },
            )}
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={onConfirmRemove}
            disabled={loading}
          >
            {t(
              "favoriteDraftConflict.confirmRemove",
              {},
              { default: "Unfavorite and remove from draft ranking" },
            )}
          </Button>
        </>
      }
    >
      <p>
        {t(
          "favoriteDraftConflict.body",
          {},
          {
            default:
              "This opportunity is in your draft ranking. Removing it from favorites will also remove it from your draft ranking list.",
          },
        )}
      </p>
    </Modal>
  );
}
