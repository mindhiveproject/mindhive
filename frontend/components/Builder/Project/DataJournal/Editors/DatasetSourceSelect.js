import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { getEffectiveDatasourceId } from "../Helpers/resolveDatasourceSlice";

const DATA_COMPONENT_TYPES = new Set([
  "GRAPH",
  "STATISTICS",
  "HYPVIS",
  "STATTEST",
  "CODE",
  "TABLE",
]);

export { DATA_COMPONENT_TYPES };

export default function DatasetSourceSelect({
  journalDatasources,
  content,
  onChangeId,
}) {
  const { t } = useTranslation("builder");
  const list = Array.isArray(journalDatasources) ? journalDatasources : [];
  if (list.length <= 1) return null;

  const optionLabel = (d) => {
    const titleTrim = String(d?.title || "").trim();
    if (titleTrim) return titleTrim;
    const origin = d?.dataOrigin != null ? String(d.dataOrigin).trim() : "";
    const idSuffix = String(d?.id || "").slice(-6);
    if (origin && idSuffix) {
      return t(
        "dataJournal.componentEditor.datasetSource.optionFallback",
        { origin, idSuffix },
        { default: "{{origin}} · {{idSuffix}}" },
      );
    }
    return d?.id || "";
  };

  const options = list.map((d) => ({
    value: d.id,
    label: optionLabel(d),
  }));

  const value = getEffectiveDatasourceId(content, list) || "";

  return (
    <div style={{ padding: "0 12px 12px", boxSizing: "border-box" }}>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#5D5763",
          marginBottom: "6px",
        }}
      >
        {t(
          "dataJournal.componentEditor.datasetSource.label",
          {},
          { default: "Dataset" },
        )}
      </div>
      <DropdownSelect
        value={value}
        onChange={(next) => onChangeId(String(next))}
        options={options}
        ariaLabel={t(
          "dataJournal.componentEditor.datasetSource.ariaLabel",
          {},
          { default: "Choose dataset" },
        )}
        placeholder={t(
          "dataJournal.componentEditor.datasetSource.placeholder",
          {},
          { default: "Select a dataset" },
        )}
      />
    </div>
  );
}
