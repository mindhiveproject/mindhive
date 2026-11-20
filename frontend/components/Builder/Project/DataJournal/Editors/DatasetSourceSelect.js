import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import {
  DATA_COMPONENT_TYPES as DATA_TYPES,
  componentDatasourceStatus,
} from "../../../../../lib/componentDatasource";

const DATA_COMPONENT_TYPES = new Set(DATA_TYPES);

export { DATA_COMPONENT_TYPES };

export default function DatasetSourceSelect({
  journalDatasources,
  content,
  onChangeId,
}) {
  const { t } = useTranslation("builder");
  const list = Array.isArray(journalDatasources) ? journalDatasources : [];
  const { status, datasourceId } = componentDatasourceStatus(content, list);
  const needsChoice = status === "missing" || status === "unassigned";
  // One dataset and already chosen: nothing to pick.
  if (!list.length || (list.length === 1 && !needsChoice)) return null;

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

  const value = status === "ok" ? datasourceId : "";

  return (
    <div className="datasetSourceSelect">
      <div
        className="MH-Type-Label-Base"
        style={{
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
      {needsChoice ? (
        <div
          role="alert"
          className="MH-Type-Body-Small"
          style={{ color: "#8A5A00", marginBottom: "6px" }}
        >
          {status === "missing"
            ? t(
                "dataJournal.componentEditor.datasetSource.missingHint",
                {},
                {
                  default:
                    "The dataset this component used is no longer in the journal. Choose one to show it again.",
                },
              )
            : t(
                "dataJournal.componentEditor.datasetSource.unassignedHint",
                {},
                { default: "Choose which dataset this component reads." },
              )}
        </div>
      ) : null}
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
