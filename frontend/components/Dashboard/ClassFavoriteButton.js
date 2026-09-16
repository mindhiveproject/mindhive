import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import IconButton from "../DesignSystem/IconButton";
import { StarFilledIcon, StarIcon } from "../DesignSystem/Icons";
import { MANAGE_FAVORITE_CLASSES } from "../Mutations/User";
import { CURRENT_USER_QUERY } from "../Queries/User";

export function getFavoriteClassIds(user) {
  return new Set(
    (user?.favoriteClasses || []).map((cls) => cls?.id).filter(Boolean)
  );
}

export function compareClassesByFavoriteThenDate(
  a,
  b,
  favoriteIds,
  dateSortOrder = "newest"
) {
  const fa = favoriteIds.has(a?.id) ? 1 : 0;
  const fb = favoriteIds.has(b?.id) ? 1 : 0;
  if (fa !== fb) return fb - fa;
  const ta = new Date(a?.createdAt).getTime();
  const tb = new Date(b?.createdAt).getTime();
  return dateSortOrder === "newest" ? tb - ta : ta - tb;
}

export default function ClassFavoriteButton({ user, classId }) {
  const { t } = useTranslation("classes");
  const isFavorite = getFavoriteClassIds(user).has(classId);
  const [manageFavorite, { loading }] = useMutation(MANAGE_FAVORITE_CLASSES, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const label = isFavorite
    ? t("classesList.unfavoriteClass", {}, {
        default: "Remove class from favorites",
      })
    : t("classesList.favoriteClass", {}, {
        default: "Add class to favorites",
      });

  return (
    <div
      className="classListRowFavorite"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <IconButton
        variant="text"
        elevated={false}
        disabled={loading || !user?.id || !classId}
        icon={
          isFavorite ? (
            <StarFilledIcon />
          ) : (
            <StarIcon style={{ color: "#6A6A6A" }} />
          )
        }
   
        ariaLabel={label}
        title={label}
        aria-pressed={isFavorite}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!user?.id || !classId) return;
          await manageFavorite({
            variables: {
              id: user.id,
              action: {
                [isFavorite ? "disconnect" : "connect"]: { id: classId },
              },
            },
          });
        }}
      />
    </div>
  );
}
