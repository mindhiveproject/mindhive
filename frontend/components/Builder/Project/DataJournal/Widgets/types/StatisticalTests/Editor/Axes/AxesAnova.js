import { useEffect, useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../../../../../DesignSystem/Button";
import Chip from "../../../../../../../../DesignSystem/Chip";
import ResourcesTooltipResourceButtons from "../../../_shared/ResourcesHelpLinks";
import SectionHeader from "../../../_shared/SectionHeader";
import TruncatedTooltipText from "../../../_shared/TruncatedTooltipText";
import SelectMultiple from "../Fields/SelectMultiple";
import SelectOne from "../Fields/SelectOne";

const G_COMMON = "dataJournal.statTest.axes.common";
const G_A = "dataJournal.statTest.axes.anova";

export default function AxesAnova({
  variables,
  sectionId,
  selectors,
  onChange,
}) {
  const { t } = useTranslation("builder");

  const [selectedDataFormat, setSelectedDataFormat] = useState(
    selectors?.dataFormat || "long",
  );
  const [dataLayoutPanelOpen, setDataLayoutPanelOpen] = useState(false);

  const dataLayoutPanelId = `stat-test-anova-data-layout-${sectionId}`;

  useEffect(() => {
    setSelectedDataFormat(selectors?.dataFormat || "long");
  }, [selectors?.dataFormat]);

  const dataFormatMenu = useMemo(
    () => [
      {
        key: "long",
        value: "long",
        chipLabel: t(`${G_COMMON}.dataFormat.chipLong`, {}, { default: "Long" }),
        title: t(`${G_A}.dataFormat.long.title`, {}, {
          default: "Switch to using a label column to sort rows of a value column",
        }),
        description: t(`${G_A}.dataFormat.long.description`, {}, {
          default:
            "In the example above, we would select the column 'attrib' as a grouping column. This grouping is performed on the 'value' column which contains values for the conditions c1, c2, and c3.",
        }),
        img: "/assets/icons/visualize/dataAnovaLong.svg",
      },
      {
        key: "wide",
        value: "wide",
        chipLabel: t(`${G_COMMON}.dataFormat.chipWide`, {}, { default: "Wide" }),
        title: t(`${G_A}.dataFormat.wide.title`, {}, {
          default: "Switch to performing a One-Way Anova between three or more columns",
        }),
        description: t(`${G_A}.dataFormat.wide.description`, {}, {
          default:
            "In the example above, we would select the columns c1, c2, and c3 to perform a One-Way Anova on them.",
        }),
        img: "/assets/icons/visualize/dataOneWayAnova.svg",
      },
    ],
    [t],
  );

  const resourcesList = useMemo(
    () => [
      {
        title: t(`${G_A}.resources.scribbrLinkTitle`, {}, {
          default: "What is a One-way ANOVA?",
        }),
        alt: t(`${G_A}.resources.scribbrLinkAlt`, {}, { default: "External link" }),
        img: "/assets/icons/visualize/externalNewTab.svg",
        link: "https://www.scribbr.com/statistics/one-way-anova/",
      },
    ],
    [t],
  );

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const onSelectorChoice = (option) => {
    setSelectedDataFormat(option.value);
    onSelectorChange({ target: { name: "dataFormat", value: option?.value } });
  };

  const onSelectorChange = ({ target }) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
  };

  const sectionLabel = t(`${G_COMMON}.dataFormat.sectionLabel`, {}, {
    default: "Data layout",
  });
  const toggleTitle = t(`${G_COMMON}.dataFormat.toggleAriaLabel`, {}, {
    default: "Show or hide data layout options",
  });
  const panelAria = t(`${G_COMMON}.dataFormat.panelRegionAriaLabel`, {}, {
    default: "Data layout: diagram for the selected format",
  });
  const currentlyPerforming = t(`${G_A}.dataFormat.currentlyPerforming`, {}, {
    default: "Currently performing:",
  });
  const openLinkLabel = t(`${G_COMMON}.resources.openLinkHint`, {}, {
    default: "Click here to access the resource",
  });
  const noLinkHint = t(`${G_COMMON}.resources.noLink`, {}, { default: "No external link" });

  const helpContent = useMemo(
    () => (
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#625B71" }}>
        {t(`${G_COMMON}.help.resourcesIntro`, {}, {
          default:
            "Use the buttons below to open a reference in a new tab when a link is available.",
        })}
      </p>
    ),
    [t],
  );
  const helpAction = useMemo(
    () => (
      <ResourcesTooltipResourceButtons
        items={resourcesList}
        openLinkLabel={openLinkLabel}
        noLinkHint={noLinkHint}
      />
    ),
    [resourcesList, openLinkLabel, noLinkHint],
  );

  const currentFormatOption = useMemo(
    () => dataFormatMenu.find((o) => o.value === selectedDataFormat) || dataFormatMenu[0],
    [dataFormatMenu, selectedDataFormat],
  );

  return (
    <div className="selectorsStats">
      <SectionHeader
        title={t(`${G_COMMON}.header.title`, {}, { default: "Axes" })}
        iconSrc="/assets/icons/visualize/axes.svg"
        iconAlt={t(`${G_COMMON}.header.iconAlt`, {}, { default: "Axes" })}
        helpContent={helpContent}
        helpAction={helpAction}
        helpAriaLabel={t(`${G_COMMON}.help.ariaLabel`, {}, { default: "Resources and help" })}
      />
      <div className="statTestDataFormatSummary">
        {selectedDataFormat === "wide" ? (
          <>
            <p>
              <strong>{currentlyPerforming}</strong>{" "}
              {t(`${G_A}.dataFormat.summaryWide.prefix`, {}, { default: "One-Way ANOVA " })}
              <strong>{t(`${G_A}.dataFormat.summaryWide.between`, {}, { default: "between" })}</strong>
              {t(`${G_A}.dataFormat.summaryWide.columns`, {}, { default: " three or more columns." })}
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>{currentlyPerforming}</strong>{" "}
              {t(`${G_A}.dataFormat.summaryLong.main`, {}, {
                default:
                  "One-Way ANOVA on a column containing values using a grouping column containing the group's labels on each row",
              })}
            </p>
          </>
        )}
      </div>
      <div className="barPlotDataFormat">
        <Button
          type="button"
          variant="outline"
          onClick={() => setDataLayoutPanelOpen((open) => !open)}
          aria-expanded={dataLayoutPanelOpen}
          aria-controls={dataLayoutPanelId}
          title={toggleTitle}
          style={{ backgroundColor: "#F3F3F3", color: "#6A6A6A", border: "2px solid #E6E6E6" }}
        >
          {sectionLabel}
        </Button>
        {dataLayoutPanelOpen && currentFormatOption && (
          <div
            id={dataLayoutPanelId}
            role="region"
            aria-label={panelAria}
            className="barPlotDataFormat__panel"
          >
            <div className="barPlotDataFormat__chips customTabs">
              {dataFormatMenu.map((option) => (
                <Chip
                  key={option.key}
                  label={option.chipLabel}
                  selected={selectedDataFormat === option.value}
                  onClick={() => onSelectorChoice(option)}
                  shape="square"
                  ariaLabel={option.title}
                  style={
                    selectedDataFormat === option.value
                      ? { backgroundColor: "#FDF2D0" }
                      : { border: "1px solid #F3F3F3" }
                  }
                />
              ))}
            </div>
            <div className="barPlotDataFormat__card">
              <div className="barPlotDataFormat__figureWrap">
                <img
                  className="barPlotDataFormat__figure"
                  src={currentFormatOption.img}
                  alt={currentFormatOption.title}
                  decoding="async"
                />
              </div>
              <TruncatedTooltipText
                as="h3"
                className="barPlotDataFormat__title"
                text={currentFormatOption.title}
              />
              <p className="barPlotDataFormat__desc">{currentFormatOption.description}</p>
            </div>
          </div>
        )}
      </div>

      {selectedDataFormat === "long" ? (
        <div className="selectorsTestStats">
          <SelectOne
            sectionId={sectionId}
            options={options}
            selectors={selectors}
            onSelectorChange={onSelectorChange}
            title={t(`${G_A}.quantitativeColumn`, {}, { default: "Quantitative Column" })}
            parameter="valCol"
          />
          <SelectOne
            sectionId={sectionId}
            options={options}
            selectors={selectors}
            onSelectorChange={onSelectorChange}
            title={t(`${G_A}.groupingColumn`, {}, { default: "Grouping Column" })}
            parameter="groupcol"
          />
        </div>
      ) : (
        <div className="selectorsTestStats">
          <SelectMultiple
            sectionId={sectionId}
            options={options}
            selectors={selectors}
            onSelectorChange={onSelectorChange}
            title={t(`${G_A}.columnsToAnova`, {}, {
              default: "Column(s) to include in ANOVA",
            })}
            parameter="colToAnalyse"
          />
        </div>
      )}

      <input
        type="hidden"
        id={`dataFormat-${sectionId}`}
        value={selectedDataFormat}
      />
    </div>
  );
}
