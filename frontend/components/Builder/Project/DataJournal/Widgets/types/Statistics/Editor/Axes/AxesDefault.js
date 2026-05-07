import { useState, useEffect, useMemo } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../../../../../DesignSystem/Button";
import Chip from "../../../../../../../../DesignSystem/Chip";
import ResourcesTooltipResourceButtons from "../../../_shared/ResourcesHelpLinks";
import SectionHeader from "../../../_shared/SectionHeader";
import SelectMultiple from "../Fields/SelectMultiple";
import SelectOne from "../Fields/SelectOne";
import TruncatedTooltipText from "../../../_shared/TruncatedTooltipText";

const G_STAT = "dataJournal.statistics.axes.default";
const G_COMMON = "dataJournal.statTest.axes.common";

function resolveDataLayout(selectors) {
  const v = selectors?.dataLayout;
  if (v === "long" || v === "wide") return v;
  return "wide";
}

function resolveValueMode(selectors) {
  const vm = selectors?.valueMode;
  if (vm === "quant" || vm === "qual") return vm;
  const legacy = selectors?.dataFormat;
  if (legacy === "quant" || legacy === "qual") return legacy;
  const dt = selectors?.dataType;
  if (dt === "quant" || dt === "qual") return dt;
  return "quant";
}

export default function Axes({ variables, sectionId, selectors, onChange }) {
  const { t } = useTranslation("builder");

  const [selectedDataLayout, setSelectedDataLayout] = useState(() =>
    resolveDataLayout(selectors),
  );
  const [selectedValueMode, setSelectedValueMode] = useState(() =>
    resolveValueMode(selectors),
  );
  // const [dataLayoutPanelOpen, setDataLayoutPanelOpen] = useState(false);
  const [valueModePanelOpen, setValueModePanelOpen] = useState(false);

  // const dataLayoutPanelId = `summary-data-layout-${sectionId}`;
  const valueModePanelId = `summary-value-mode-${sectionId}`;

  useEffect(() => {
    setSelectedDataLayout(resolveDataLayout(selectors));
  }, [selectors?.dataLayout]);

  useEffect(() => {
    setSelectedValueMode(resolveValueMode(selectors));
  }, [selectors?.valueMode, selectors?.dataFormat, selectors?.dataType]);

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.displayName || variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const onSelectorChange = ({ target }) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
  };

  // const onLayoutChoice = (option) => {
  //   const v = option.value;
  //   setSelectedDataLayout(v);
  //   const next = {
  //     ...selectors,
  //     dataLayout: v,
  //     ...(v === "long" ? { colMultiple: [] } : { valCol: "" }),
  //   };
  //   if (next.dataFormat === "long" || next.dataFormat === "wide") {
  //     delete next.dataFormat;
  //   }
  //   onChange({
  //     componentId: sectionId,
  //     newContent: { selectors: next },
  //   });
  // };

  const onValueModeChoice = (option) => {
    setSelectedValueMode(option.value);
    const next = { ...selectors, valueMode: option.value };
    if (next.dataFormat === "quant" || next.dataFormat === "qual") {
      delete next.dataFormat;
    }
    onChange({
      componentId: sectionId,
      newContent: { selectors: next },
    });
  };

  const valueModePanelMenu = useMemo(
    () => [
      {
        key: "quant",
        value: "quant",
        chipLabel: t(`${G_STAT}.valueMode.quantLabel`, {}, { default: "Quantitative" }),
        title: t(`${G_STAT}.quantOption.panelTitle`, {}, { default: "Quantitative data" }),
        description: t(`${G_STAT}.quantOption.description`, {}, {
          default:
            "Quantitative data is represented in a column filled with numerical values. For example, the age of the participant or their score in a survey.",
        }),
        img: "/assets/icons/visualize/dataStructWide.svg",
        link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
      },
      {
        key: "qual",
        value: "qual",
        chipLabel: t(`${G_STAT}.valueMode.qualLabel`, {}, { default: "Qualitative" }),
        title: t(`${G_STAT}.qualOption.panelTitle`, {}, { default: "Qualitative data" }),
        description: t(`${G_STAT}.qualOption.description`, {}, {
          default:
            "Qualitative data is represented in a column filled with labels. For example, which experimental condition a subject belongs to, or their answer to a multiple choice question.",
        }),
        img: "/assets/icons/visualize/dataTypeQual.svg",
        link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
      },
    ],
    [t],
  );

  // const dataLayoutMenu = useMemo(
  //   () => [
  //     {
  //       key: "long",
  //       value: "long",
  //       chipLabel: t(`${G_COMMON}.dataFormat.chipLong`, {}, { default: "Long" }),
  //       title: t(`${G_STAT}.dataLayout.long.title`, {}, { default: "Long data layout" }),
  //       description: t(`${G_STAT}.dataLayout.long.description`, {}, {
  //         default:
  //           "Each observation is a row. Choose one column of values to summarize and optionally a column that defines groups.",
  //       }),
  //       img: "/assets/icons/visualize/dataStructLongDetailed.svg",
  //       link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
  //     },
  //     {
  //       key: "wide",
  //       value: "wide",
  //       chipLabel: t(`${G_COMMON}.dataFormat.chipWide`, {}, { default: "Wide" }),
  //       title: t(`${G_STAT}.dataLayout.wide.title`, {}, { default: "Wide data layout" }),
  //       description: t(`${G_STAT}.dataLayout.wide.description`, {}, {
  //         default:
  //           "Each variable to summarize is its own column. Pick one or more columns and optionally a grouping variable.",
  //       }),
  //       img: "/assets/icons/visualize/dataStructWideDetailed.svg",
  //       link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
  //     },
  //   ],
  //   [t],
  // );

  const resourcesList = useMemo(
    () => [
      {
        title: t(`${G_STAT}.resources.tableWhatTitle`, {}, { default: "What is a table?" }),
        alt: t(`${G_STAT}.resources.tableWhatAlt`, {}, { default: "External link" }),
        img: "/assets/icons/visualize/externalNewTab.svg",
        link: "https://datavizproject.com/data-type/table-chart/#",
      },
    ],
    [t],
  );

  const groupingTitle = t(`${G_STAT}.groupingVariable`, {}, { default: "Grouping variable" });

  const quantLabel = t(`${G_STAT}.valueMode.quantLabel`, {}, { default: "Quantitative" });
  const qualLabel = t(`${G_STAT}.valueMode.qualLabel`, {}, { default: "Qualitative" });
  const valueModeTriggerPrefix = t(`${G_STAT}.valueMode.triggerPrefix`, {}, {
    default: "Column value type:",
  });
  const valueModeTriggerSuffix = t(`${G_STAT}.valueMode.triggerSuffix`, {}, {
    default: " (click here to change)",
  });

  const summaryMethodSectionLabel = t(`${G_STAT}.summaryMethod.sectionLabel`, {}, {
    default: "Data type",
  });
  const summaryMethodToggleTitle = t(`${G_STAT}.summaryMethod.toggleAriaLabel`, {}, {
    default: "Show or hide data type options",
  });
  const summaryMethodPanelAria = t(`${G_STAT}.summaryMethod.panelAriaLabel`, {}, {
    default: "Data type: quantitative or qualitative column values",
  });

  const valColTitle =
    selectedValueMode === "quant"
      ? t(`${G_STAT}.columnToSummarizeQuant`, {}, { default: "Quantitative column to summarize" })
      : t(`${G_STAT}.columnToSummarizeQual`, {}, { default: "Qualitative column to summarize" });

  const slidesLinkText = t(`${G_STAT}.resources.slidesLink`, {}, { default: "Click here to see the lecture slides" });
  const googleSlidesAlt = t(`${G_STAT}.resources.googleSlidesAlt`, {}, { default: "Google Slides" });

  // const sectionLabel = t(`${G_COMMON}.dataFormat.sectionLabel`, {}, { default: "Data layout" });
  // const toggleTitle = t(`${G_COMMON}.dataFormat.toggleAriaLabel`, {}, {
  //   default: "Show or hide data layout options",
  // });
  // const panelAria = t(`${G_COMMON}.dataFormat.panelRegionAriaLabel`, {}, {
  //   default: "Data layout: diagram for the selected format",
  // });
  // const currentlyPerforming = t(`${G_STAT}.dataLayout.currentlyPerforming`, {}, {
  //   default: "Currently summarizing:",
  // });

  const openLinkLabel = t(`${G_COMMON}.resources.openLinkHint`, {}, {
    default: "Click here to access the resource",
  });
  const noLinkHint = t(`${G_COMMON}.resources.noLink`, {}, { default: "No external link" });

  const helpContent = useMemo(
    () => (
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#625B71" }}>
        {t(`${G_COMMON}.help.resourcesIntro`, {}, {
          default: "Learn more about this component with the resources below.",
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

  // const currentLayoutOption = useMemo(
  //   () => dataLayoutMenu.find((o) => o.value === selectedDataLayout) || dataLayoutMenu[0],
  //   [dataLayoutMenu, selectedDataLayout],
  // );

  const currentValueModeOption = useMemo(
    () =>
      valueModePanelMenu.find((o) => o.value === selectedValueMode) || valueModePanelMenu[0],
    [valueModePanelMenu, selectedValueMode],
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
        {/* Data layout summary (wide vs long) — hidden while data layout control is commented out
        {selectedDataLayout === "wide" ? (
          <p>
            <strong>{currentlyPerforming}</strong>{" "}
            {t(`${G_STAT}.dataLayout.summaryWide.prefix`, {}, { default: "" })}
            <strong>{t(`${G_STAT}.dataLayout.summaryWide.between`, {}, { default: "Multiple" })}</strong>
            {t(`${G_STAT}.dataLayout.summaryWide.columns`, {}, {
              default: " columns in wide format (one variable per column).",
            })}
          </p>
        ) : (
          <p>
            <strong>{currentlyPerforming}</strong>{" "}
            {t(`${G_STAT}.dataLayout.summaryLong.main`, {}, {
              default:
                "One column of values per row with an optional grouping column (long format).",
            })}
          </p>
        )}
        */}
        <p>
          {valueModeTriggerPrefix}{" "}
          <strong>{selectedValueMode === "quant" ? quantLabel : qualLabel}</strong>
          {valueModeTriggerSuffix}
        </p>
      </div>

      <div className="statisticsAxesFormatControls">
        <div className="barPlotDataFormat barPlotDataFormat--buttonOnly">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValueModePanelOpen((open) => !open);
            }}
            aria-expanded={valueModePanelOpen}
            aria-controls={valueModePanelId}
            title={summaryMethodToggleTitle}
            style={{ backgroundColor: "#F3F3F3", color: "#6A6A6A", border: "2px solid #E6E6E6" }}
          >
            {summaryMethodSectionLabel}
          </Button>
        </div>
        {/* Data layout button + panel (long / wide) — commented out
        <div className="barPlotDataFormat barPlotDataFormat--buttonOnly">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDataLayoutPanelOpen((open) => {
                const next = !open;
                if (next) setValueModePanelOpen(false);
                return next;
              });
            }}
            aria-expanded={dataLayoutPanelOpen}
            aria-controls={dataLayoutPanelId}
            title={toggleTitle}
            style={{ backgroundColor: "#F3F3F3", color: "#6A6A6A", border: "2px solid #E6E6E6" }}
          >
            {sectionLabel}
          </Button>
        </div>
        */}
      </div>

      {/* {dataLayoutPanelOpen && currentLayoutOption && (
        <div className="barPlotDataFormat">
          <div
            id={dataLayoutPanelId}
            role="region"
            aria-label={panelAria}
            className="barPlotDataFormat__panel"
          >
            <div className="barPlotDataFormat__chips customTabs">
              {dataLayoutMenu.map((option) => (
                <Chip
                  key={option.key}
                  label={option.chipLabel}
                  selected={selectedDataLayout === option.value}
                  onClick={() => onLayoutChoice(option)}
                  shape="square"
                  ariaLabel={option.title}
                  style={
                    selectedDataLayout === option.value
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
                  src={currentLayoutOption.img}
                  alt={currentLayoutOption.title}
                  decoding="async"
                />
              </div>
              <TruncatedTooltipText
                as="h3"
                className="barPlotDataFormat__title"
                text={currentLayoutOption.title}
              />
              <p className="barPlotDataFormat__desc">{currentLayoutOption.description}</p>
              <div className="barPlotDataFormat__slides">
                <img src="/assets/icons/visualize/googleSlides.svg" alt={googleSlidesAlt} width={20} height={20} decoding="async" />
                <a href={currentLayoutOption.link} target="_blank" rel="noopener noreferrer">
                  {slidesLinkText}
                </a>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {valueModePanelOpen && currentValueModeOption && (
        <div className="barPlotDataFormat">
          <div
            id={valueModePanelId}
            role="region"
            aria-label={summaryMethodPanelAria}
            className="barPlotDataFormat__panel"
          >
            <div className="barPlotDataFormat__chips customTabs">
              {valueModePanelMenu.map((option) => (
                <Chip
                  key={option.key}
                  label={option.chipLabel}
                  selected={selectedValueMode === option.value}
                  onClick={() => onValueModeChoice(option)}
                  shape="square"
                  ariaLabel={option.title}
                  style={
                    selectedValueMode === option.value
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
                  src={currentValueModeOption.img}
                  alt={currentValueModeOption.title}
                  decoding="async"
                />
              </div>
              <TruncatedTooltipText
                as="h3"
                className="barPlotDataFormat__title"
                text={currentValueModeOption.title}
              />
              <p className="barPlotDataFormat__desc">{currentValueModeOption.description}</p>
              <div className="barPlotDataFormat__slides">
                <img
                  src="/assets/icons/visualize/googleSlides.svg"
                  alt={googleSlidesAlt}
                  width={20}
                  height={20}
                  decoding="async"
                />
                <a href={currentValueModeOption.link} target="_blank" rel="noopener noreferrer">
                  {slidesLinkText}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDataLayout === "long" ? (
        <div className="selectorsTestStats">
          <SelectOne
            sectionId={sectionId}
            options={options}
            selectors={selectors}
            onSelectorChange={onSelectorChange}
            title={valColTitle}
            parameter="valCol"
          />
          <SelectOne
            sectionId={sectionId}
            options={options}
            selectors={selectors}
            onSelectorChange={onSelectorChange}
            title={groupingTitle}
            parameter="groupVariable"
          />
        </div>
      ) : (
        <div className="selectorsTestStats">
          <SelectMultiple
            sectionId={sectionId}
            options={options}
            selectors={selectors}
            onSelectorChange={onSelectorChange}
            parameter="colMultiple"
            valueMode={selectedValueMode}
          />
          <SelectOne
            sectionId={sectionId}
            options={options}
            selectors={selectors}
            onSelectorChange={onSelectorChange}
            title={groupingTitle}
            parameter="groupVariable"
          />
        </div>
      )}

      <input type="hidden" id={`dataLayout-${sectionId}`} value={selectedDataLayout} readOnly />
      <input type="hidden" id={`dataType-${sectionId}`} value={selectedValueMode} readOnly />
    </div>
  );
}
