import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { MANAGE_FAVORITE_TASKS } from "../Mutations/User";
import { CURRENT_USER_QUERY } from "../Queries/User";
import Chip from "../DesignSystem/Chip";
import { StarFilledIcon, StarIcon } from "../DesignSystem/Icons";
import { getLocalizedField } from "../../lib/i18nContent";

// A task or survey chip whose leading star adds it to (or removes it from)
// the user's favorite tasks. `onClose` shows the chip's remove button;
// `onClick` makes the label clickable.
export default function FavoriteTaskChip({
  task,
  user,
  disabled = false,
  onClose,
  onClick,
}) {
  const { t } = useTranslation("builder");
  const { locale } = useRouter();

  const [manageFavorite] = useMutation(MANAGE_FAVORITE_TASKS, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const isFavorite = (user?.favoriteTasks || []).some(
    (favorite) => favorite?.id === task?.id
  );
  const canToggle = !disabled && !!user?.id && !!task?.id;
  const favoriteLabel = isFavorite
    ? t("mainCard.studentTasks.favoriteRemove", {}, { default: "Remove from favorites" })
    : t("mainCard.studentTasks.favoriteAdd", {}, { default: "Add to favorites" });
  const StarGlyph = isFavorite ? StarFilledIcon : StarIcon;

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canToggle) return;
    manageFavorite({
      variables: {
        id: user.id,
        taskAction: {
          [isFavorite ? "disconnect" : "connect"]: { id: task.id },
        },
      },
    }).catch((error) => console.error("Failed to update favorites:", error));
  };

  return (
    <Chip
      label={getLocalizedField(task, "title", locale) || ""}
      leading={
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={!canToggle}
          aria-pressed={isFavorite}
          aria-label={favoriteLabel}
          title={favoriteLabel}
          style={{
            display: "flex",
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: canToggle ? "pointer" : "default",
            color: isFavorite ? "#F2BE42" : "#171717",
          }}
        >
          <StarGlyph width={18} height={18} />
        </button>
      }
      onClick={onClick}
      onClose={onClose}
    />
  );
}
