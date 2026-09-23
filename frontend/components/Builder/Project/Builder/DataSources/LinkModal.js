"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Modal from "../../../../DesignSystem/Modal";
import Button from "../../../../DesignSystem/Button";
import IconButton from "../../../../DesignSystem/IconButton";
import Chip from "../../../../DesignSystem/Chip";
import Input from "../../../../DesignSystem/Input";
import FavoriteButton from "../../../../DesignSystem/FavoriteButton";
import {
  CloseIcon,
  LinkIcon,
  LinkOffIcon,
  SearchIcon,
  SettingsIcon,
} from "../../../../DesignSystem/Icons";

import { DATA_SOURCE_BLOCKS } from "../../../../Queries/DataSourceBlock";
import { MANAGE_FAVORITE_DATA_SOURCE_BLOCKS } from "../../../../Mutations/User";
import { channelKey } from "../../../../../lib/yqOutputs";

const HEADER_ROW_STYLE = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const TITLE_STYLE = {
  margin: 0,
  // Figma draws this Semibold; MH-Type-Title-Large is Medium (500).
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const BODY_TEXT_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const WARNING_BOX_STYLE = {
  display: "flex",
  padding: "12px 16px",
  borderRadius: 8,
  background: "var(--MH-Theme-Accent-Light, #FDF2D0)",
};

const WARNING_TEXT_STYLE = {
  margin: 0,
  flex: 1,
  color: "var(--MH-Theme-Warning-Dark, #8F1F14)",
};

const SECTION_LABEL_STYLE = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 500,
  fontSize: 16,
  lineHeight: "24px",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const SECTION_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  width: "100%",
};

const ROW_STYLE = (background, border) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 12,
  background,
  border,
});

const ROW_HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "12px 16px",
};

const ROW_TITLE_STYLE = {
  margin: 0,
  // Figma draws these Semibold; MH-Type-Title-Base is Medium (500).
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const ROW_SUBTITLE_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const ROW_ACTIONS_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

const OUTPUTS_ROW_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  padding: "0 16px 12px",
};

const EMPTY_NOTE_STYLE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const FILTERS_ROW_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
};

const SEARCH_WRAPPER_STYLE = {
  position: "relative",
  width: "100%",
};

const SEARCH_ICON_STYLE = {
  position: "absolute",
  right: 12,
  top: 8,
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
  pointerEvents: "none",
};

// Every terminal channel a block produces, flattened out of its per-stream
// shape into the flat pill list the catalog's "Show Outputs" toggle displays.
function flattenOutputs(block) {
  const channels = [];
  (block?.outputs || []).forEach((stream) => {
    (stream?.channels || []).forEach((channel) => {
      channels.push({
        key: channelKey(stream, channel.index),
        label: channel.label,
      });
    });
  });
  return channels;
}

function isFavoritedBy(block, userId) {
  return (block?.favoritedBy || []).some((profile) => profile.id === userId);
}

/**
 * The data-linking flow (Figma nodes 445-2936 and 445-4145): a warning note
 * gates a larger panel listing the sources already linked into the study,
 * plus the full catalog to link more from. Clicking a linked source's
 * settings gear hands off to `onOpenSettings` and closes this modal — editing
 * an instance's settings happens back in the study builder's sidebar, not here.
 */
export default function LinkDataSourceModal({
  open,
  user,
  sources,
  selectedSourceId,
  onClose,
  onAddSource,
  onRemoveSource,
  onOpenSettings,
}) {
  const { t } = useTranslation("builder");
  const [step, setStep] = useState("warning");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(() => new Set());
  const [showOutputs, setShowOutputs] = useState(false);

  // Every open starts back at the warning note — this is a "know what you're
  // doing" gate, not a one-time dismissal.
  useEffect(() => {
    if (open) {
      setStep("warning");
      setSearch("");
      setFilters(new Set());
      setShowOutputs(false);
    }
  }, [open]);

  const { data } = useQuery(DATA_SOURCE_BLOCKS, { skip: !open });
  const blocks = data?.dataSourceBlocks || [];

  const [manageFavorite] = useMutation(MANAGE_FAVORITE_DATA_SOURCE_BLOCKS, {
    refetchQueries: [{ query: DATA_SOURCE_BLOCKS }],
    awaitRefetchQueries: true,
  });

  const toggleFavorite = (block) => {
    if (!user?.id) return;
    const active = isFavoritedBy(block, user.id);
    manageFavorite({
      variables: {
        id: user.id,
        dataSourceBlockAction: {
          [active ? "disconnect" : "connect"]: { id: block.id },
        },
      },
    });
  };

  const toggleFilter = (key) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredBlocks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const byOfficial = filters.has("official");
    const byMine = filters.has("mine");
    return blocks.filter((block) => {
      if (query && !block.title?.toLowerCase().includes(query)) return false;
      if (byOfficial || byMine) {
        const matchesOfficial = byOfficial && block.isOfficial;
        const matchesMine = byMine && block.author?.id === user?.id;
        if (!matchesOfficial && !matchesMine) return false;
      }
      return true;
    });
  }, [blocks, search, filters, user]);

  if (!open) return null;

  const title = t("dataSources.linkModal.title", {}, { default: "Link a Data Source" });
  const settingsLabel = t("dataSources.settingsLabel", {}, { default: "Settings" });
  const unlinkLabel = t("dataSources.unlinkLabel", {}, { default: "Unlink" });
  const linkLabel = t("dataSources.linkLabel", {}, { default: "Link" });
  const closeLabel = t("dataSources.linkModal.close", {}, { default: "Close" });
  const favoriteAddLabel = t("dataSources.favoriteAddLabel", {}, {
    default: "Add to favorites",
  });
  const favoriteRemoveLabel = t("dataSources.favoriteRemoveLabel", {}, {
    default: "Remove from favorites",
  });

  const headerRow = (
    <div style={HEADER_ROW_STYLE}>
      <h2 className="MH-Type-Title-Large" style={TITLE_STYLE}>
        {title}
      </h2>
      <IconButton
        variant="neutral"
        icon={<CloseIcon />}
        ariaLabel={closeLabel}
        title={closeLabel}
        onClick={onClose}
      />
    </div>
  );

  if (step === "warning") {
    return (
      <Modal open={open} onClose={onClose} title={null}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {headerRow}
          <p className="MH-Type-Body-Base" style={BODY_TEXT_STYLE}>
            {t("dataSources.linkModal.description", {}, {
              default:
                "Add external data sources to collect physiological data while a study is happening.",
            })}
          </p>
          <div style={WARNING_BOX_STYLE}>
            <p className="MH-Type-Body-Base" style={WARNING_TEXT_STYLE}>
              {t("dataSources.linkModal.warning", {}, {
                default:
                  "Proceed only if you know what you're doing or if you need external data sources in your study.",
              })}
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="filled" tone="tertiary" onClick={() => setStep("browse")}>
              {t("dataSources.linkModal.continue", {}, { default: "Continue" })}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={null} size="large">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {headerRow}
        <p className="MH-Type-Body-Base" style={BODY_TEXT_STYLE}>
          {t("dataSources.linkModal.description", {}, {
            default:
              "Add external data sources to collect physiological data while a study is happening.",
          })}
        </p>

        <div style={SECTION_STYLE}>
          <p className="MH-Type-Body-Base" style={SECTION_LABEL_STYLE}>
            {t("dataSources.linkModal.linkedHeading", {}, {
              default: "Linked Data Sources",
            })}
          </p>
          {sources.length === 0 ? (
            <p className="MH-Type-Body-Base" style={EMPTY_NOTE_STYLE}>
              {t("dataSources.linkModal.noneLinkedYet", {}, {
                default: "You haven't linked any data sources yet.",
              })}
            </p>
          ) : (
            sources.map((source) => (
              <div
                key={source.id}
                style={ROW_STYLE(
                  source.id === selectedSourceId
                    ? "var(--MH-Theme-Neutrals-Light-Green, #F6F9F8)"
                    : "var(--MH-Theme-Neutrals-White, #FFFFFF)",
                  "1px solid var(--MH-Theme-Neutrals-Lighter, #F3F3F3)"
                )}
              >
                <div style={ROW_HEADER_STYLE}>
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <p className="MH-Type-Title-Base" style={ROW_TITLE_STYLE}>
                      {source.label || source.block?.title}
                    </p>
                    <p className="MH-Type-Body-Base" style={ROW_SUBTITLE_STYLE}>
                      {source.block?.requirementLabel || source.block?.title}
                    </p>
                  </div>
                  <div style={ROW_ACTIONS_STYLE}>
                    <FavoriteButton
                      active={isFavoritedBy(source.block, user?.id)}
                      onToggle={() => toggleFavorite(source.block)}
                      addLabel={favoriteAddLabel}
                      removeLabel={favoriteRemoveLabel}
                    />
                    <IconButton
                      variant="neutral"
                      icon={<SettingsIcon />}
                      ariaLabel={settingsLabel}
                      title={settingsLabel}
                      onClick={() => onOpenSettings(source.id)}
                    />
                    <IconButton
                      variant="filled"
                      tone="tertiary"
                      icon={<LinkOffIcon />}
                      ariaLabel={unlinkLabel}
                      title={unlinkLabel}
                      onClick={() => onRemoveSource(source)}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={SECTION_STYLE}>
          <p className="MH-Type-Body-Base" style={SECTION_LABEL_STYLE}>
            {t("dataSources.linkModal.catalogHeading", {}, { default: "All Data Sources" })}
          </p>
          <div style={SEARCH_WRAPPER_STYLE}>
            <Input
              value={search}
              onChange={setSearch}
              placeholder={t("dataSources.linkModal.searchPlaceholder", {}, {
                default: "Search for data sources",
              })}
              style={{ paddingRight: 40 }}
              aria-label={t("dataSources.linkModal.searchPlaceholder", {}, {
                default: "Search for data sources",
              })}
            />
            <span style={SEARCH_ICON_STYLE} aria-hidden>
              <SearchIcon />
            </span>
          </div>
          <div style={FILTERS_ROW_STYLE}>
            <Chip
              label={t("dataSources.linkModal.filterOfficial", {}, {
                default: "Created by MindHive",
              })}
              selected={filters.has("official")}
              onClick={() => toggleFilter("official")}
              onClose={filters.has("official") ? () => toggleFilter("official") : undefined}
            />
            <Chip
              label={t("dataSources.linkModal.filterMine", {}, { default: "Created by you" })}
              selected={filters.has("mine")}
              onClick={() => toggleFilter("mine")}
              onClose={filters.has("mine") ? () => toggleFilter("mine") : undefined}
            />
            <Chip
              label={t("dataSources.linkModal.filterShowOutputs", {}, {
                default: "Show Outputs",
              })}
              selected={showOutputs}
              onClick={() => setShowOutputs((prev) => !prev)}
              onClose={showOutputs ? () => setShowOutputs(false) : undefined}
            />
          </div>
        </div>

        <div style={SECTION_STYLE}>
          {filteredBlocks.length === 0 ? (
            <p className="MH-Type-Body-Base" style={EMPTY_NOTE_STYLE}>
              {t("dataSources.linkModal.catalogEmpty", {}, {
                default: "No data sources match your search.",
              })}
            </p>
          ) : (
            filteredBlocks.map((block) => (
              <div
                key={block.id}
                style={ROW_STYLE(
                  "var(--MH-Theme-Neutrals-White, #FFFFFF)",
                  "1px solid var(--MH-Theme-Neutrals-Lighter, #F3F3F3)"
                )}
              >
                <div style={ROW_HEADER_STYLE}>
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <p className="MH-Type-Title-Base" style={ROW_TITLE_STYLE}>
                      {block.title}
                    </p>
                    <p className="MH-Type-Body-Base" style={ROW_SUBTITLE_STYLE}>
                      {block.requirementLabel || block.description}
                    </p>
                  </div>
                  <div style={ROW_ACTIONS_STYLE}>
                    <FavoriteButton
                      active={isFavoritedBy(block, user?.id)}
                      onToggle={() => toggleFavorite(block)}
                      addLabel={favoriteAddLabel}
                      removeLabel={favoriteRemoveLabel}
                    />
                    <IconButton
                      variant="filled"
                      tone="tertiary"
                      icon={<LinkIcon />}
                      ariaLabel={linkLabel}
                      title={linkLabel}
                      onClick={() => onAddSource(block.id)}
                    />
                  </div>
                </div>
                {showOutputs && flattenOutputs(block).length > 0 && (
                  <div style={OUTPUTS_ROW_STYLE}>
                    {flattenOutputs(block).map((channel) => (
                      <Chip
                        key={channel.key}
                        label={channel.label}
                        variant="static"
                        tone="neutral"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
