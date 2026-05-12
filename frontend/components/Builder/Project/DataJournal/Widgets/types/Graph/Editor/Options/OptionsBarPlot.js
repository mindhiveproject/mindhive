import useTranslation from "next-translate/useTranslation";

import FieldRow from "../../../_shared/FieldRow";
import SectionHeader from "../../../_shared/SectionHeader";
import GraphColorHexRow from "../_shared/GraphColorHexRow";
import { rowsForGraphColorKeys } from "../_shared/graphColorSliceRows";
import {
  barLongCategoryKeys,
  barWideCategoryKeys,
} from "../_shared/graphColorUtils";

const G = "dataJournal.graph";

export default function OptionsBarPlot({
  sectionId,
  selectors,
  onChange,
  slice = null,
  sliceReady = false,
  variables = [],
}) {
  const { t } = useTranslation("builder");

  const patchSelectors = (partial) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, ...partial },
      },
    });
  };

  const patchGraphColors = (mutator) => {
    const prev =
      selectors.graphColors && typeof selectors.graphColors === "object"
        ? { ...selectors.graphColors }
        : { version: 1 };
    const graphColors = mutator(prev);
    patchSelectors({ graphColors });
  };

  const dataFormatStr = String(selectors.dataFormat || "")
    .trim()
    .toLowerCase();
  const isWide = dataFormatStr === "wide";
  const rows = sliceReady && slice ? rowsForGraphColorKeys(slice) : [];
  const barKeys = isWide
    ? barWideCategoryKeys(selectors.colToPlot, variables)
    : barLongCategoryKeys(rows, selectors.qualCol, variables);
  const barGc = selectors.graphColors?.bar || {};

  const resetBarColors = () => {
    const prev = selectors.graphColors && typeof selectors.graphColors === "object"
      ? { ...selectors.graphColors }
      : {};
    delete prev.bar;
    const restKeys = Object.keys(prev).filter((k) => k !== "version");
    if (restKeys.length === 0) {
      const { graphColors: _omit, ...sel } = selectors;
      patchSelectors(sel);
    } else {
      patchSelectors({ graphColors: { ...prev, version: 1 } });
    }
  };

  return (
    <div className="graphDashboard">
      <div className="subsection">
        <SectionHeader
          title={t(`${G}.options.barPlot.header.title`, {}, { default: "Options" })}
          iconSrc="/assets/icons/visualize/chat_add_on.svg"
          iconAlt={t(`${G}.options.barPlot.header.iconAlt`, {}, { default: "Options" })}
        />
        <FieldRow label={t(`${G}.common.graphTitle`, {}, { default: "Graph Title" })}>
          <input
            id={`graphTitle-${sectionId}`}
            type="text"
            name="graphTitle"
            value={selectors.graphTitle ?? ""}
            onChange={({ target }) => patchSelectors({ graphTitle: target.value })}
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
            onChange={({ target }) => patchSelectors({ xLabel: target.value })}
          />
        </FieldRow>
      </div>

      <div className="subheader">
        {t(`${G}.options.barPlot.yAxis`, {}, { default: "Y-Axis" })}
      </div>

      <div className="subsection">
        <FieldRow label={t(`${G}.common.label`, {}, { default: "Label" })}>
          <input
            id={`yLabel-${sectionId}`}
            type="text"
            name="yLabel"
            value={selectors["yLabel"] ?? ""}
            onChange={({ target }) => patchSelectors({ yLabel: target.value })}
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
              onChange={({ target }) => patchSelectors({ yRangeMin: target.value })}
            />
            <input
              id={`yRangeMax-${sectionId}`}
              type="number"
              name="yRangeMax"
              value={selectors["yRangeMax"] ?? ""}
              placeholder={t(`${G}.common.range.max`, {}, { default: "Max" })}
              onChange={({ target }) => patchSelectors({ yRangeMax: target.value })}
            />
          </div>
        </FieldRow>
      </div>

      <div className="subheader">
        {t(`${G}.options.barPlot.legendAndXAxisSection`, {}, {
          default: "X-axis labels and legend title",
        })}
      </div>

      <div className="subsection">
        <FieldRow label={t(`${G}.common.legendTitle`, {}, { default: "Legend title" })}>
          <input
            id={`legend_title-${sectionId}`}
            type="text"
            name="legend_title"
            value={selectors["legend_title"] ?? ""}
            onChange={({ target }) => patchSelectors({ legend_title: target.value })}
          />
        </FieldRow>
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
        {barKeys.length === 0 && sliceReady && (
          <p className="graphColorHint">
            {t(`${G}.options.colors.barNoCategories`, {}, {
              default: "Configure axes to see one color slot per bar.",
            })}
          </p>
        )}
        {barKeys.map((cat) => (
          <GraphColorHexRow
            key={String(cat)}
            sectionId={sectionId}
            rowId={`bar-cat-${sectionId}-${String(cat)}`}
            label={t(`${G}.options.colors.bar.categorySwatch`, { category: String(cat) }, {
              default: "Bar: {{category}}",
            })}
            value={barGc.byCategory?.[String(cat)]}
            disabled={!sliceReady}
            onChange={(hex) => {
              patchGraphColors((prev) => {
                const bar = { ...(prev.bar || {}) };
                const byCategory = { ...(bar.byCategory || {}) };
                const k = String(cat);
                if (hex == null) delete byCategory[k];
                else byCategory[k] = hex;
                bar.byCategory = byCategory;
                return { ...prev, version: 1, bar };
              });
            }}
          />
        ))}
        {barGc.byCategory && Object.keys(barGc.byCategory).length > 0 && (
          <button type="button" className="graphColorResetAll" onClick={resetBarColors}>
            {t(`${G}.options.colors.resetBar`, {}, { default: "Reset bar colors" })}
          </button>
        )}
      </div>
    </div>
  );
}
