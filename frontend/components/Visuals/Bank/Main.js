"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../DesignSystem/Chip";
import Input from "../../DesignSystem/Input";
import VisualCard from "./VisualCard";

import { MY_VISUALS } from "../../Queries/YQVisual";
import {
  COPY_VISUAL,
  DELETE_VISUAL,
  TOGGLE_VISUAL_LIKE,
} from "../../Mutations/YQVisual";

const HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 16,
};

const TITLE_STYLE = {
  margin: 0,
  flex: "1 1 auto",
  font: "var(--MH-Type-Title-Large)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

// Same fluid tracks as the task and survey banks: 300px minimum, columns
// stretch to share the row.
const GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
  gap: 16,
};

const EMPTY_STYLE = {
  padding: "48px 24px",
  textAlign: "center",
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

// Same three views as the task and survey banks, with "favorited" the default
// since the bank is mostly for getting back to what you've starred.
const FILTERS = [
  { key: "favorited", labelKey: "filterFavorited", default: "Favorited" },
  { key: "public", labelKey: "filterPublic", default: "Public" },
  { key: "mine", labelKey: "filterCreatedByMe", default: "Created by me" },
];

function whereFor(filter, userId) {
  if (filter === "favorited")
    return { likes: { some: { id: { equals: userId } } } };
  // Public here is what an admin has published, the same gate the study
  // builder uses.
  if (filter === "public") return { published: { equals: true } };
  return {
    OR: [
      { author: { id: { equals: userId } } },
      { collaborators: { some: { id: { equals: userId } } } },
      { viewers: { some: { id: { equals: userId } } } },
    ],
  };
}

/**
 * The visuals bank at `/dashboard/develop/visuals`.
 *
 * Each chip asks for the narrower set rather than relying on the Visual list's
 * access filter alone, which would otherwise return every public visual on the
 * platform.
 */
export default function VisualsBank({ user }) {
  const { t } = useTranslation("visuals");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("favorited");

  const { data, loading, refetch } = useQuery(MY_VISUALS, {
    variables: { where: whereFor(filter, user?.id) },
    skip: !user?.id,
    fetchPolicy: "cache-and-network",
  });

  const [deleteVisual] = useMutation(DELETE_VISUAL);
  const [copyVisual] = useMutation(COPY_VISUAL);
  const [toggleLike] = useMutation(TOGGLE_VISUAL_LIKE);

  const visuals = (data?.visuals || []).filter((visual) =>
    search.trim()
      ? visual.title?.toLowerCase().includes(search.trim().toLowerCase())
      : true
  );

  async function onDelete(visual) {
    if (
      !window.confirm(
        t("confirmDeleteNamed", "Delete “{{title}}” permanently?").replace(
          "{{title}}",
          visual.title
        )
      )
    )
      return;
    await deleteVisual({ variables: { id: visual.id } });
    refetch();
  }

  async function onCopy(visual) {
    const result = await copyVisual({ variables: { id: visual.id } });
    const id = result.data?.copyVisual?.id;
    if (id) router.push(`/builder/visuals/${id}`);
  }

  function onToggleFavorite(visual, isFavorite) {
    toggleLike({
      variables: {
        id: visual.id,
        likes: { [isFavorite ? "disconnect" : "connect"]: [{ id: user.id }] },
      },
    });
  }

  return (
    <div className="Visuals-Bank">
      <div style={HEADER_STYLE}>
        <h1 style={TITLE_STYLE}>{t("myVisuals", "My Visuals")}</h1>
        <div style={{ width: 280 }}>
          <Input
            placeholder={t("searchVisuals", "Search visuals")}
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}
      >
        {FILTERS.map((f) => {
          const isSelected = filter === f.key;
          return (
            <Chip
              key={f.key}
              label={t(f.labelKey, {}, { default: f.default })}
              selected={isSelected}
              onClick={() => setFilter(f.key)}
              // The active non-default chip clears back to the default view.
              onClose={
                isSelected && f.key !== "favorited"
                  ? () => setFilter("favorited")
                  : undefined
              }
            />
          );
        })}
      </div>

      {loading && !data ? (
        <p style={EMPTY_STYLE}>{t("loading", "Loading…")}</p>
      ) : visuals.length === 0 ? (
        <p style={EMPTY_STYLE}>
          {t("noVisuals", "No visuals to show.")}
        </p>
      ) : (
        <div style={GRID_STYLE}>
          {visuals.map((visual) => {
            const isOwner = visual.author?.id === user?.id;
            const canEdit =
              isOwner ||
              visual.collaborators?.some((c) => c.id === user?.id);
            const isFavorite = !!visual.likes?.some((p) => p.id === user?.id);
            return (
              <VisualCard
                key={visual.id}
                visual={visual}
                viewHref={`/preview/visual/${visual.id}`}
                editHref={canEdit ? `/builder/visuals/${visual.id}` : undefined}
                onCopy={canEdit ? undefined : () => onCopy(visual)}
                isFavorite={isFavorite}
                onToggleFavorite={() => onToggleFavorite(visual, isFavorite)}
                menuItems={
                  isOwner
                    ? [
                        {
                          key: "delete",
                          label: t("delete", "Delete"),
                          danger: true,
                          onClick: () => onDelete(visual),
                        },
                      ]
                    : []
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
