import { useCallback, useEffect, useMemo, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import useTranslation from "next-translate/useTranslation";
import { jsonToCSV } from "react-papaparse";

import Button from "../../../../DesignSystem/Button";
import Modal from "../../../../DesignSystem/Modal";
import { OPPORTUNITIES_FOR_CSV_EXPORT } from "../../../../Queries/Opportunity";
import { MEDIA_ASSETS_BY_IDS } from "../../../../Mutations/MediaAsset";
import {
  EXPORT_COLUMN_GROUPS,
  ALL_EXPORT_COLUMN_IDS,
  buildExportRows,
  buildOpportunityExportFilename,
  collectMediaAssetIdsFromOpportunities,
  collectOpportunityMediaDownloads,
  getDefaultSelectedColumnIds,
} from "./opportunityExportUtils";

const HINT_STYLE = { margin: "0 0 12px" };
const TOOLBAR_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px 8px",
  marginBottom: 12,
};
const GROUPS_STYLE = {
  display: "grid",
  gap: 14,
  maxHeight: "min(52vh, 420px)",
  overflow: "auto",
  paddingRight: 4,
};
const GROUP_STYLE = {
  margin: 0,
  padding: "10px 12px 12px",
  border: "1px solid #ece9e6",
  borderRadius: 8,
  minWidth: 0,
};
const LEGEND_STYLE = {
  padding: "0 4px",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Black, #1a1a1a)",
};
const COLUMNS_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "6px 12px",
  marginTop: 8,
};
const CHECK_LABEL_STYLE = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  fontSize: 13,
  lineHeight: "18px",
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
  cursor: "pointer",
};
const ERROR_STYLE = {
  margin: "12px 0 0",
  color: "#a94442",
  fontSize: 13,
};

async function fetchMediaBuffer(url) {
  const response = await fetch(url, {
    mode: "cors",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.arrayBuffer();
}

/**
 * Column-picker modal + ZIP download (CSV + per-opportunity media folders).
 */
export default function OpportunityExportModal({
  open,
  onClose,
  listOpportunities,
  selectedOpportunityIds,
  roundId,
  roundTitle,
  networkTitle,
}) {
  const { t } = useTranslation("classes");
  const [selectedColumnIds, setSelectedColumnIds] = useState(
    getDefaultSelectedColumnIds,
  );
  const [exportError, setExportError] = useState(null);
  const [exportProgress, setExportProgress] = useState(null);

  const [fetchDetails, { loading }] = useLazyQuery(OPPORTUNITIES_FOR_CSV_EXPORT, {
    fetchPolicy: "network-only",
  });
  const [fetchMediaAssets] = useLazyQuery(MEDIA_ASSETS_BY_IDS, {
    fetchPolicy: "network-only",
  });

  const exporting = Boolean(exportProgress) || loading;

  useEffect(() => {
    if (open) {
      setSelectedColumnIds(getDefaultSelectedColumnIds());
      setExportError(null);
      setExportProgress(null);
    }
  }, [open]);

  const selectedSet = useMemo(
    () => new Set(selectedColumnIds),
    [selectedColumnIds],
  );

  const opportunityCount = listOpportunities?.length || 0;
  const canExport =
    opportunityCount > 0 && selectedColumnIds.length > 0 && !exporting;

  const toggleColumn = useCallback((columnId) => {
    setSelectedColumnIds((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      }
      return ALL_EXPORT_COLUMN_IDS.filter(
        (id) => id === columnId || prev.includes(id),
      );
    });
  }, []);

  const toggleGroup = useCallback((group) => {
    const groupIds = group.columns.map((column) => column.id);
    setSelectedColumnIds((prev) => {
      const prevSet = new Set(prev);
      const allOn = groupIds.every((id) => prevSet.has(id));
      if (allOn) {
        return prev.filter((id) => !groupIds.includes(id));
      }
      const next = new Set(prev);
      groupIds.forEach((id) => next.add(id));
      return ALL_EXPORT_COLUMN_IDS.filter((id) => next.has(id));
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedColumnIds(getDefaultSelectedColumnIds());
  }, []);

  const clearAll = useCallback(() => {
    setSelectedColumnIds([]);
  }, []);

  const handleExport = useCallback(async () => {
    if (!canExport) return;
    setExportError(null);
    setExportProgress({ type: "loading" });
    try {
      const ids = (listOpportunities || []).map((opportunity) => opportunity.id);
      const { data, error } = await fetchDetails({ variables: { ids } });
      if (error) throw error;

      const detailById = new Map(
        (data?.opportunities || []).map((opportunity) => [
          opportunity.id,
          opportunity,
        ]),
      );

      const assetIds = collectMediaAssetIdsFromOpportunities(
        listOpportunities,
        detailById,
      );
      let assetById = new Map();
      if (assetIds.length > 0) {
        const { data: assetData, error: assetError } = await fetchMediaAssets({
          variables: { ids: assetIds },
        });
        if (assetError) throw assetError;
        assetById = new Map(
          (assetData?.mediaAssets || []).map((asset) => [asset.id, asset]),
        );
      }

      const rows = buildExportRows({
        listOpportunities,
        detailById,
        selectedOpportunityIds,
        roundId,
        selectedColumnIds,
        t,
        assetById,
      });

      if (!rows.length) {
        setExportError(
          t("opportunities.matchingRound.export.empty", {}, {
            default: "No opportunities to export.",
          }),
        );
        return;
      }

      const csv = jsonToCSV(rows);
      const csvFilename = buildOpportunityExportFilename({
        networkTitle,
        roundTitle,
        extension: "csv",
      });
      const zipFilename = buildOpportunityExportFilename({
        networkTitle,
        roundTitle,
        extension: "zip",
      });

      const zip = new JSZip();
      zip.file(csvFilename, csv);

      const mediaDownloads = collectOpportunityMediaDownloads(
        listOpportunities,
        detailById,
        assetById,
      );
      const total = mediaDownloads.length;
      for (let index = 0; index < total; index += 1) {
        const item = mediaDownloads[index];
        setExportProgress({
          type: "media",
          current: index + 1,
          total,
        });
        try {
          const buffer = await fetchMediaBuffer(item.url);
          zip.file(item.zipPath, buffer);
        } catch (mediaErr) {
          console.error(
            `Failed to include ${item.zipPath} in opportunity export`,
            mediaErr,
          );
        }
      }

      setExportProgress({ type: "zip" });
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, zipFilename);
      onClose?.();
    } catch (err) {
      console.error("Failed to export opportunities ZIP", err);
      setExportError(
        t("opportunities.matchingRound.export.failed", {}, {
          default: "Could not export opportunities. Please try again.",
        }),
      );
    } finally {
      setExportProgress(null);
    }
  }, [
    canExport,
    fetchDetails,
    fetchMediaAssets,
    listOpportunities,
    networkTitle,
    onClose,
    roundId,
    roundTitle,
    selectedColumnIds,
    selectedOpportunityIds,
    t,
  ]);

  return (
    <Modal
      open={open}
      onClose={exporting ? undefined : onClose}
      maxWidth={560}
      title={t("opportunities.matchingRound.export.title", {}, {
        default: "Export opportunities",
      })}
      actions={
        <>
          <Button
            variant="text"
            type="button"
            onClick={onClose}
            disabled={exporting}
          >
            {t("opportunities.matchingRound.export.cancel", {}, {
              default: "Cancel",
            })}
          </Button>
          <Button
            variant="filled"
            type="button"
            onClick={handleExport}
            disabled={!canExport}
          >
            {exportProgress?.type === "media"
              ? t(
                  "opportunities.matchingRound.export.downloadingMedia",
                  {
                    current: exportProgress.current,
                    total: exportProgress.total,
                  },
                  { default: "Downloading media {{current}} of {{total}}…" },
                )
              : exportProgress?.type === "zip"
                ? t("opportunities.matchingRound.export.buildingZip", {}, {
                    default: "Building zip…",
                  })
                : exporting
                  ? t("opportunities.matchingRound.export.exporting", {}, {
                      default: "Exporting…",
                    })
                  : t("opportunities.matchingRound.export.download", {}, {
                      default: "Download ZIP",
                    })}
          </Button>
        </>
      }
    >
      <p style={HINT_STYLE}>
        {t("opportunities.matchingRound.export.hint", { count: opportunityCount }, {
          default:
            "Choose which columns to include. {{count}} opportunities from this network will be exported as a ZIP with the CSV and a folder per opportunity (intro video, cover illustration, and follow-up images, PDFs, and documents).",
        })}
      </p>
      <div style={TOOLBAR_STYLE}>
        <Button variant="text" type="button" onClick={selectAll} disabled={exporting}>
          {t("opportunities.matchingRound.export.selectAll", {}, {
            default: "Select all",
          })}
        </Button>
        <Button variant="text" type="button" onClick={clearAll} disabled={exporting}>
          {t("opportunities.matchingRound.export.clearAll", {}, {
            default: "Clear all",
          })}
        </Button>
      </div>
      <div style={GROUPS_STYLE}>
        {EXPORT_COLUMN_GROUPS.map((group) => {
          const groupIds = group.columns.map((column) => column.id);
          const checkedCount = groupIds.filter((id) => selectedSet.has(id)).length;
          const allChecked = checkedCount === groupIds.length;
          const someChecked = checkedCount > 0 && !allChecked;
          return (
            <fieldset key={group.id} style={GROUP_STYLE}>
              <legend style={LEGEND_STYLE}>
                <label style={CHECK_LABEL_STYLE}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked;
                    }}
                    onChange={() => toggleGroup(group)}
                    disabled={exporting}
                  />
                  <span>
                    {t(group.labelKey, {}, { default: group.labelDefault })}
                  </span>
                </label>
              </legend>
              <div style={COLUMNS_STYLE}>
                {group.columns.map((column) => (
                  <label key={column.id} style={CHECK_LABEL_STYLE}>
                    <input
                      type="checkbox"
                      checked={selectedSet.has(column.id)}
                      onChange={() => toggleColumn(column.id)}
                      disabled={exporting}
                    />
                    <span>
                      {t(column.headerKey, {}, {
                        default: column.headerDefault,
                      })}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
      {exportError ? (
        <p style={ERROR_STYLE} role="alert">
          {exportError}
        </p>
      ) : null}
    </Modal>
  );
}
