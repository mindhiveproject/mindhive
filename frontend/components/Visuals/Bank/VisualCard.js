import Link from "next/link";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Card from "../../DesignSystem/Card";
import Chip from "../../DesignSystem/Chip";
import DropdownMenu from "../../DesignSystem/DropdownMenu";
import FavoriteButton from "../../DesignSystem/FavoriteButton";
import { MoreVertIcon } from "../../DesignSystem/Icons";
import { getProfileImageUrl } from "../../../lib/profileStudyImageUrls";

const COVER_STYLE = {
  height: 230,
  flexShrink: 0,
  background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
};

const AvatarImage = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  flex-shrink: 0;
`;

const AVATAR_STYLE = {
  width: 24,
  height: 24,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

/**
 * Visuals bank card (Figma Design System node 5098:1116): cover, a type chip,
 * title with the favorite star and an optional actions menu, description, the
 * author, then a divider and trailing actions. Same anatomy as the Connect
 * cards, with a cover on top like the task card.
 *
 * The card is a static container — its buttons are the only navigation.
 *
 * @param {object} visual - A row from MY_VISUALS.
 * @param {string} viewHref - Where "View" goes.
 * @param {string} [editHref] - Where "Edit" goes (visuals you can edit).
 * @param {() => void} [onCopy] - "Copy & Edit" handler (visuals you can't edit).
 *   The outline button is Edit when `editHref` is set, Copy & Edit when `onCopy`
 *   is, and hidden when neither is.
 * @param {boolean} [isFavorite] - Whether the signed-in user starred it.
 * @param {() => void} [onToggleFavorite] - Star handler; the star is hidden when unset.
 * @param {Array} [menuItems] - DropdownMenu items; the menu is hidden when empty.
 */
export default function VisualCard({
  visual,
  viewHref,
  editHref,
  onCopy,
  isFavorite = false,
  onToggleFavorite,
  menuItems = [],
}) {
  const { t } = useTranslation("visuals");
  const author =
    [visual.author?.firstName, visual.author?.lastName]
      .filter(Boolean)
      .join(" ") || visual.author?.username;
  const authorImage = getProfileImageUrl(visual.author);

  return (
    <Card padding={0}>
      <div
        style={{
          ...COVER_STYLE,
          backgroundImage: visual.cover?.url
            ? `url(${visual.cover.url})`
            : undefined,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 16,
          flex: "1 1 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flex: "1 1 auto",
          }}
        >
          <Chip
            variant="static"
            tone="accent"
            label={t("visual", "Visual")}
            style={{ alignSelf: "flex-start" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              className="MH-Type-Title-Large"
              style={{
                flex: "1 1 auto",
                minWidth: 0,
                color: "var(--MH-Theme-Neutrals-Black, #171717)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {visual.title}
            </span>
            {onToggleFavorite ? (
              <FavoriteButton
                active={isFavorite}
                onToggle={onToggleFavorite}
                addLabel={t("common:favorite.add", {}, { default: "Add to favorites" })}
                removeLabel={t(
                  "common:favorite.remove",
                  {},
                  { default: "Remove from favorites" }
                )}
                data-card-action
              />
            ) : null}
            {menuItems.length > 0 ? (
              <DropdownMenu
                trigger={<MoreVertIcon />}
                ariaLabel={t("visualActions", "Visual actions")}
                items={menuItems}
              />
            ) : null}
          </div>
          {visual.description ? (
            <p
              className="MH-Type-Title-Base"
              style={{
                margin: 0,
                color: "var(--MH-Theme-Neutrals-Black, #171717)",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {visual.description}
            </p>
          ) : null}
        </div>

        {author ? (
          <Chip
            variant="static"
            tone="neutral"
            avatar
            label={author}
            style={{ alignSelf: "flex-start" }}
            leading={
              authorImage ? (
                <AvatarImage src={authorImage} alt="" />
              ) : (
                <span
                  aria-hidden
                  className="MH-Type-Label-Base"
                  style={AVATAR_STYLE}
                >
                  {author.charAt(0).toUpperCase()}
                </span>
              )
            }
          />
        ) : null}

        <hr
          style={{
            margin: 0,
            width: "100%",
            height: 0,
            flexShrink: 0,
            border: "none",
            borderTop: "1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6)",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {editHref ? (
            <Link href={editHref}>
              <Button variant="outline" tone="accent">
                {t("edit", "Edit")}
              </Button>
            </Link>
          ) : onCopy ? (
            <Button variant="outline" tone="accent" onClick={onCopy}>
              {t("copyAndEdit", "Copy & Edit")}
            </Button>
          ) : null}
          <Link href={viewHref}>
            <Button variant="filled" tone="accent">
              {t("view", "View")}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
