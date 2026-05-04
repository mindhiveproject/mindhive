import useTranslation from "next-translate/useTranslation";

import FieldRow from "../_shared/FieldRow";
import SectionHeader from "../_shared/SectionHeader";

const G = "dataJournal.graph";

export default function OptionsHistogram({ sectionId, selectors, onChange }) {
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
          title={t(`${G}.options.histogram.header.title`, {}, { default: "Options" })}
          iconSrc="/assets/icons/visualize/chat_add_on.svg"
          iconAlt={t(`${G}.options.histogram.header.iconAlt`, {}, { default: "Options" })}
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
            value={selectors.xLabel ?? ""}
            onChange={({ target }) => patchSelectors({ xLabel: target.value })}
          />
        </FieldRow>

        <FieldRow label={t(`${G}.common.range.label`, {}, { default: "Range" })}>
          <div className="ranges">
            <input
              id={`xRangeMin-${sectionId}`}
              type="number"
              name="xRangeMin"
              value={selectors.xRangeMin ?? ""}
              placeholder={t(`${G}.common.range.min`, {}, { default: "Min" })}
              onChange={({ target }) => patchSelectors({ xRangeMin: target.value })}
            />
            <input
              id={`xRangeMax-${sectionId}`}
              type="number"
              name="xRangeMax"
              value={selectors.xRangeMax ?? ""}
              placeholder={t(`${G}.common.range.max`, {}, { default: "Max" })}
              onChange={({ target }) => patchSelectors({ xRangeMax: target.value })}
            />
          </div>
        </FieldRow>
      </div>

      <div className="subheader">
        {t(`${G}.options.histogram.yAxis`, {}, { default: "Y-Axis" })}
      </div>
      <div className="subsection">
        <FieldRow label={t(`${G}.common.label`, {}, { default: "Label" })}>
          <input
            id={`yLabel-${sectionId}`}
            type="text"
            name="yLabel"
            value={selectors.yLabel ?? ""}
            onChange={({ target }) => patchSelectors({ yLabel: target.value })}
          />
        </FieldRow>

        <FieldRow label={t(`${G}.common.range.label`, {}, { default: "Range" })}>
          <div className="ranges">
            <input
              id={`yRangeMin-${sectionId}`}
              type="number"
              name="yRangeMin"
              value={selectors.yRangeMin ?? ""}
              placeholder={t(`${G}.common.range.min`, {}, { default: "Min" })}
              onChange={({ target }) => patchSelectors({ yRangeMin: target.value })}
            />
            <input
              id={`yRangeMax-${sectionId}`}
              type="number"
              name="yRangeMax"
              value={selectors.yRangeMax ?? ""}
              placeholder={t(`${G}.common.range.max`, {}, { default: "Max" })}
              onChange={({ target }) => patchSelectors({ yRangeMax: target.value })}
            />
          </div>
        </FieldRow>
      </div>

      <div className="subheader">
        {t(`${G}.options.histogram.legendSection`, {}, { default: "Legend" })}
      </div>
      <div className="subsection">
        <FieldRow label={t(`${G}.options.histogram.legendTitleCombined`, {}, {
          default: "Legend title (leave empty if not needed)",
        })}>
          <input
            id={`legend_title_text-${sectionId}`}
            type="text"
            name="legend_title_text"
            value={selectors.legend_title_text ?? ""}
            onChange={({ target }) =>
              patchSelectors({ legend_title_text: target.value })
            }
          />
        </FieldRow>
      </div>
    </div>
  );
}
