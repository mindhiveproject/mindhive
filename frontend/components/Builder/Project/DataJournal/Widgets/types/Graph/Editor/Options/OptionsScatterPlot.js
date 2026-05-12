import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../../../../../DesignSystem/DropdownSelect";
import FieldRow from "../../../_shared/FieldRow";
import SectionHeader from "../../../_shared/SectionHeader";
import GraphColorHexRow from "../_shared/GraphColorHexRow";
import { rowsForGraphColorKeys } from "../_shared/graphColorSliceRows";
import {
  normalizeHex,
  SCATTER_GROUP_NO_LABEL_KEY,
  scatterGroupKeys,
} from "../_shared/graphColorUtils";

const G = "dataJournal.graph";

export default function OptionsScatterPlot({
  sectionId,
  selectors,
  onChange,
  slice = null,
  sliceReady = false,
  variables = [],
}) {
  const { t } = useTranslation("builder");

  const onSelectorChange = ({ name, value }) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [name]: value },
      },
    });
  };

  const patchGraphColors = (mutator) => {
    const prev =
      selectors.graphColors && typeof selectors.graphColors === "object"
        ? { ...selectors.graphColors }
        : { version: 1 };
    const graphColors = mutator(prev);
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, graphColors },
      },
    });
  };

  const marginalOptions = [
    {
      value: "",
      label: t(`${G}.axes.histogram.marginalNone`, {}, { default: "None" }),
    },
    {
      value: "box",
      label: t(`${G}.options.scatterPlot.marginal.boxplot`, {}, { default: "Boxplot" }),
    },
    {
      value: "rug",
      label: t(`${G}.options.scatterPlot.marginal.rug`, {}, { default: "Rug" }),
    },
  ];

  const marginalValue = selectors["marginalPlot"] ?? "";

  const legendHint = t(`${G}.common.legendTitleHint`, {}, {
    default: "(leave empty if not needed)",
  });

  const rows = sliceReady && slice ? rowsForGraphColorKeys(slice) : [];
  const groupKeys = scatterGroupKeys(rows, selectors.groupVariable, variables);
  const hasGroup = groupKeys.length > 0;
  const scatterGc = selectors.graphColors?.scatter || {};
  const resetAllScatterColors = () => {
    const prev = selectors.graphColors && typeof selectors.graphColors === "object"
      ? { ...selectors.graphColors }
      : {};
    delete prev.scatter;
    const restKeys = Object.keys(prev).filter((k) => k !== "version");
    if (restKeys.length === 0) {
      const { graphColors: _omit, ...sel } = selectors;
      onChange({ componentId: sectionId, newContent: { selectors: sel } });
    } else {
      onChange({
        componentId: sectionId,
        newContent: {
          selectors: { ...selectors, graphColors: { ...prev, version: 1 } },
        },
      });
    }
  };

  return (
    <div className="graphDashboard">
      <div className="subsection">
        <SectionHeader
          title={t(`${G}.options.scatterPlot.header.title`, {}, { default: "Options" })}
          iconSrc="/assets/icons/visualize/chat_add_on.svg"
          iconAlt={t(`${G}.options.scatterPlot.header.iconAlt`, {}, { default: "Options" })}
        />
        <FieldRow label={t(`${G}.common.graphTitle`, {}, { default: "Graph Title" })}>
          <input
            id={`graphTitle-${sectionId}`}
            type="text"
            name="graphTitle"
            value={selectors.graphTitle ?? ""}
            onChange={({ target }) =>
              onSelectorChange({ name: "graphTitle", value: target?.value })
            }
          />
        </FieldRow>
      </div>

      <div className="subheader">
        {t(`${G}.common.axisSection.x`, {}, { default: "X-Axis" })}
      </div>

      <div className="subsection">
        <FieldRow label={t(`${G}.common.label`, {}, { default: "Label" })}>
          <input
            id={`xLabel-${sectionId}`}
            type="text"
            name="xLabel"
            value={selectors["xLabel"] ?? ""}
            onChange={({ target }) =>
              onSelectorChange({ name: "xLabel", value: target?.value })
            }
          />
        </FieldRow>

        <FieldRow label={t(`${G}.common.range.label`, {}, { default: "Range" })}>
          <div className="ranges">
            <input
              id={`xRangeMin-${sectionId}`}
              type="number"
              name="xRangeMin"
              value={selectors["xRangeMin"] ?? ""}
              placeholder={t(`${G}.common.range.min`, {}, { default: "Min" })}
              onChange={({ target }) =>
                onSelectorChange({ name: "xRangeMin", value: target?.value })
              }
            />
            <input
              id={`xRangeMax-${sectionId}`}
              type="number"
              name="xRangeMax"
              value={selectors["xRangeMax"] ?? ""}
              placeholder={t(`${G}.common.range.max`, {}, { default: "Max" })}
              onChange={({ target }) =>
                onSelectorChange({ name: "xRangeMax", value: target?.value })
              }
            />
          </div>
        </FieldRow>
      </div>

      <div className="subheader">
        {t(`${G}.options.scatterPlot.yAxis`, {}, { default: "Y-Axis" })}
      </div>

      <div className="subsection">
        <FieldRow label={t(`${G}.common.label`, {}, { default: "Label" })}>
          <input
            id={`yLabel-${sectionId}`}
            type="text"
            name="yLabel"
            value={selectors["yLabel"] ?? ""}
            onChange={({ target }) =>
              onSelectorChange({ name: "yLabel", value: target?.value })
            }
          />
        </FieldRow>

        <FieldRow label={t(`${G}.common.range.label`, {}, { default: "Range" })}>
          <div className="ranges">
            <input
              id={`yRangeMin-${sectionId}`}
              type="number"
              name="yRangeMin"
              value={selectors["yRangeMin"] ?? ""}
              placeholder={t(`${G}.common.range.min`, {}, { default: "Min" })}
              onChange={({ target }) =>
                onSelectorChange({ name: "yRangeMin", value: target?.value })
              }
            />
            <input
              id={`yRangeMax-${sectionId}`}
              type="number"
              name="yRangeMax"
              value={selectors["yRangeMax"] ?? ""}
              placeholder={t(`${G}.common.range.max`, {}, { default: "Max" })}
              onChange={({ target }) =>
                onSelectorChange({ name: "yRangeMax", value: target?.value })
              }
            />
          </div>
        </FieldRow>
      </div>

      <div className="subheader">
        {t(`${G}.common.marginalPlot`, {}, { default: "Marginal plot" })}
      </div>

      <div className="subsection">
        <DropdownSelect
          ariaLabel={t(`${G}.common.marginalPlot`, {}, { default: "Marginal plot" })}
          value={marginalValue}
          onChange={(v) => onSelectorChange({ name: "marginalPlot", value: v })}
          options={marginalOptions}
          searchableSingle
        />
        <input
          type="hidden"
          id={`marginalPlot-${sectionId}`}
          name="marginalPlot"
          value={marginalValue}
          readOnly
        />
      </div>

      <div className="subheader">
        {t(`${G}.options.colors.sectionTitle`, {}, { default: "Colors" })}
      </div>
      <div className="subsection">
        {!sliceReady && (
          <p className="graphColorHint">
            {t(`${G}.options.colors.dataNotReady`, {}, {
              default: "Load data to pick colors for each group.",
            })}
          </p>
        )}
        {!hasGroup && (
          <GraphColorHexRow
            sectionId={sectionId}
            rowId={`scatter-marker-${sectionId}`}
            label={t(`${G}.options.colors.scatter.markerDots`, {}, { default: "Dots" })}
            value={scatterGc.markerDefault}
            disabled={!sliceReady}
            onChange={(hex) => {
              patchGraphColors((prev) => {
                const scatter = { ...(prev.scatter || {}) };
                if (hex == null) delete scatter.markerDefault;
                else scatter.markerDefault = hex;
                return { ...prev, version: 1, scatter };
              });
            }}
          />
        )}
        {selectors.trendLine && (
          <GraphColorHexRow
            sectionId={sectionId}
            rowId={`scatter-trend-${sectionId}`}
            label={t(`${G}.options.colors.scatter.trendline`, {}, { default: "Trendline" })}
            value={scatterGc.trendline}
            disabled={!sliceReady}
            onChange={(hex) => {
              patchGraphColors((prev) => {
                const scatter = { ...(prev.scatter || {}) };
                if (hex == null) delete scatter.trendline;
                else scatter.trendline = hex;
                return { ...prev, version: 1, scatter };
              });
            }}
          />
        )}
        {hasGroup &&
          groupKeys.map((gk) => (
            <GraphColorHexRow
              key={gk}
              sectionId={sectionId}
              rowId={`scatter-group-${sectionId}-${gk}`}
              label={
                gk === SCATTER_GROUP_NO_LABEL_KEY
                  ? t(`${G}.options.colors.scatter.noGroupLabel`, {}, {
                      default: "No group label",
                    })
                  : t(`${G}.options.colors.scatter.groupSwatch`, { group: gk }, {
                      default: "Group: {{group}}",
                    })
              }
              value={scatterGc.byGroup?.[gk]}
              disabled={!sliceReady}
              onChange={(hex) => {
                patchGraphColors((prev) => {
                  const scatter = { ...(prev.scatter || {}) };
                  const byGroup = { ...(scatter.byGroup || {}) };
                  if (hex == null) delete byGroup[gk];
                  else byGroup[gk] = hex;
                  scatter.byGroup = byGroup;
                  return { ...prev, version: 1, scatter };
                });
              }}
            />
          ))}
        {(normalizeHex(scatterGc.markerDefault) ||
          normalizeHex(scatterGc.trendline) ||
          (scatterGc.byGroup && Object.keys(scatterGc.byGroup).length > 0)) && (
          <button type="button" className="graphColorResetAll" onClick={resetAllScatterColors}>
            {t(`${G}.options.colors.resetScatter`, {}, { default: "Reset scatter colors" })}
          </button>
        )}
      </div>

      <div className="subheader">
        {t(`${G}.common.legendTitleSection`, {}, { default: "Legend title" })}
      </div>

      <div className="subsection">
        <FieldRow label={legendHint}>
          <input
            id={`legend_title_text-${sectionId}`}
            type="text"
            name="legend_title_text"
            value={selectors["legend_title_text"] ?? ""}
            onChange={({ target }) =>
              onSelectorChange({ name: "legend_title_text", value: target?.value })
            }
          />
        </FieldRow>
      </div>
    </div>
  );
}
