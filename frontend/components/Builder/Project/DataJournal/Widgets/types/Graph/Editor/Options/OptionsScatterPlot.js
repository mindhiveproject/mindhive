import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../../../../../DesignSystem/DropdownSelect";
import FieldRow from "../_shared/FieldRow";
import SectionHeader from "../_shared/SectionHeader";

const G = "dataJournal.graph";

export default function OptionsScatterPlot({ sectionId, selectors, onChange }) {
  const { t } = useTranslation("builder");

  const onSelectorChange = ({ name, value }) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [name]: value },
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
