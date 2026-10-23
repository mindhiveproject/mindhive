import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Card from "../../DesignSystem/Card";
import Chip from "../../DesignSystem/Chip";
import FavoriteButton from "../../DesignSystem/FavoriteButton";
import ManageFavorite from "../../User/ManageFavorite";
import BlockTags from "./BlockTags";
import {
  getTaskTypeColor,
  getTaskTypeLabelColors,
} from "../../../lib/taskTypeColors";
import { getLocalizedField } from "../../../lib/i18nContent";

/**
 * @param {object} [user] - Shows the favorite button when given.
 * @param {object} [viewer] - Whose "Created by you" / "Collaborator" tags to
 *   show on the Develop page, without turning favorites on.
 */
export default function TaskCard({
  user,
  viewer,
  task,
  url,
  id,
  name,
  domain,
}) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { locale } = router;

  const title = getLocalizedField(task, "title", locale);
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {typeLabel && (
            <Chip
              variant="static"
              label={typeLabel}
              style={{
                background: labelColors.bg,
                backgroundColor: labelColors.bg,
                color: labelColors.fg,
              }}
            />
          )}
          {domain === "develop" && (
            <BlockTags task={task} user={viewer || user} showRuntime />
          )}
        </div>

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
