import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Card from "../../DesignSystem/Card";
import Chip from "../../DesignSystem/Chip";
import FavoriteButton from "../../DesignSystem/FavoriteButton";
import ManageFavorite from "../../User/ManageFavorite";
import {
  getTaskTypeColor,
  getTaskTypeLabelColors,
} from "../../../lib/taskTypeColors";

export default function TaskCard({ user, task, url, id, name, domain }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { locale } = router;

  const title = task?.i18nContent?.[locale]?.title || task?.title;
  const subtitle =
    task?.i18nContent?.[locale]?.settings?.addInfo || task?.settings?.addInfo;

  const typeColor = getTaskTypeColor(task?.taskType);
  const labelColors = getTaskTypeLabelColors(task?.taskType);
  const typeLabel = task?.taskType
    ? task.taskType.charAt(0) + task.taskType.slice(1).toLowerCase()
    : null;

  return (
    <Card
      variant="elevated"
      href={{ pathname: url, query: { [name]: task[id] } }}
      padding={0}
      ariaLabel={title}
    >
      <div
        style={{
          height: 8,
          width: "100%",
          background: typeColor,
          flexShrink: 0,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "12px 16px 16px",
        }}
      >
        {typeLabel && (
          <Chip
            variant="static"
            label={typeLabel}
            style={{
              alignSelf: "flex-start",
              background: labelColors.bg,
              backgroundColor: labelColors.bg,
              color: labelColors.fg,
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <span
            className="MH-Type-Title-Base"
            style={{
              flex: 1,
              minWidth: 0,
              color: "#171717",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </span>

          {user && (
            <ManageFavorite
              user={user}
              id={task?.id}
              render={({ isFavorite, onToggle }) => (
                <FavoriteButton
                  active={isFavorite}
                  onToggle={onToggle}
                  addLabel={t(
                    "favorite.add",
                    {},
                    { default: "Add to favorites" }
                  )}
                  removeLabel={t(
                    "favorite.remove",
                    {},
                    { default: "Remove from favorites" }
                  )}
                  data-card-action
                />
              )}
            />
          )}
        </div>

        {domain === "discover" && subtitle && (
          <span className="MH-Type-Body-Base" style={{ color: "#A1A1A1" }}>
            {subtitle}
          </span>
        )}
      </div>
    </Card>
  );
}
