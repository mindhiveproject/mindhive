import useTranslation from "next-translate/useTranslation";

import FieldRow from "../../../_shared/FieldRow";
import SectionHeader from "../../../_shared/SectionHeader";

const G = "dataJournal.graph";

export default function OptionsBarPlot({ sectionId, selectors, onChange }) {
  const { t } = useTranslation("builder");

  const patchSelectors = (partial) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, ...partial },
      },
    });
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
        {t(`${G}.options.barPlot.color.heading`, {}, { default: "Color" })}
      </div>
      <div className="subsection">
        <FieldRow label={t(`${G}.options.barPlot.color.intro`, {}, {
          default:
            "Give a base color for the bar (remove square brackets to use the examples below).",
        })}>
          <input
            id={`color-${sectionId}`}
            type="text"
            name="color"
            value={selectors["color"] ?? ""}
            onChange={({ target }) => patchSelectors({ color: target.value })}
          />
        </FieldRow>
        <div className="graphEditorOptionsHintStack">
          <p style={{ margin: "0.25rem 0 0", color: "#666666", fontSize: "14px", lineHeight: "150%" }}>
            {t(`${G}.options.barPlot.color.examplesNames`, {}, {
              default: "- Color names: [red], [pink]",
            })}
          </p>
          <p style={{ margin: "0.25rem 0 0", color: "#666666", fontSize: "14px", lineHeight: "150%" }}>
            {t(`${G}.options.barPlot.color.examplesRgb`, {}, {
              default: "- RGB value [100,255,0], [0,120,80]",
            })}
          </p>
          <p style={{ margin: "0.25rem 0 0", color: "#666666", fontSize: "14px", lineHeight: "150%" }}>
            {t(`${G}.options.barPlot.color.examplesHex`, {}, {
              default: "- HEX format [#28619E], [#D53533]",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
