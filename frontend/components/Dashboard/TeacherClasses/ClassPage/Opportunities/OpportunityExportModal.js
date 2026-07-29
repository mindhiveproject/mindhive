import { useCallback, useEffect, useMemo, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { saveAs } from "file-saver";
import useTranslation from "next-translate/useTranslation";
import { jsonToCSV } from "react-papaparse";

import Button from "../../../../DesignSystem/Button";
import Modal from "../../../../DesignSystem/Modal";
import { OPPORTUNITIES_FOR_CSV_EXPORT } from "../../../../Queries/Opportunity";
import {
  EXPORT_COLUMN_GROUPS,
  ALL_EXPORT_COLUMN_IDS,
  buildExportRows,
  buildOpportunityExportFilename,
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

/**
 * Column-picker modal + CSV download for matching-round network opportunities.
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

  const [fetchDetails, { loading }] = useLazyQuery(OPPORTUNITIES_FOR_CSV_EXPORT, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (open) {
      setSelectedColumnIds(getDefaultSelectedColumnIds());
      setExportError(null);
    }
  }, [open]);

  const selectedSet = useMemo(
    () => new Set(selectedColumnIds),
    [selectedColumnIds],
  );

  const opportunityCount = listOpportunities?.length || 0;
  const canExport =
    opportunityCount > 0 && selectedColumnIds.length > 0 && !loading;

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

      const rows = buildExportRows({
        listOpportunities,
        detailById,
        selectedOpportunityIds,
        roundId,
        selectedColumnIds,
        t,
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
      const filename = buildOpportunityExportFilename({
        networkTitle,
        roundTitle,
      });
      saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
      onClose?.();
    } catch (err) {
      console.error("Failed to export opportunities CSV", err);
      setExportError(
        t("opportunities.matchingRound.export.failed", {}, {
          default: "Could not export opportunities. Please try again.",
        }),
      );
    }
  }, [
    canExport,
    fetchDetails,
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
      onClose={loading ? undefined : onClose}
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
            disabled={loading}
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
            {loading
              ? t("opportunities.matchingRound.export.exporting", {}, {
                  default: "Exporting…",
                })
              : t("opportunities.matchingRound.export.download", {}, {
                  default: "Download CSV",
                })}
          </Button>
        </>
      }
    >
      <p style={HINT_STYLE}>
        {t("opportunities.matchingRound.export.hint", { count: opportunityCount }, {
          default:
            "Choose which columns to include. {{count}} opportunities from this network will be exported.",
        })}
      </p>
      <div style={TOOLBAR_STYLE}>
        <Button variant="text" type="button" onClick={selectAll} disabled={loading}>
          {t("opportunities.matchingRound.export.selectAll", {}, {
            default: "Select all",
          })}
        </Button>
        <Button variant="text" type="button" onClick={clearAll} disabled={loading}>
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
                    disabled={loading}
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
                      disabled={loading}
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
