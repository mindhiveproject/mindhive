import { useEffect, useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../../../../../DesignSystem/Button";
import Chip from "../../../../../../../../DesignSystem/Chip";
import ResourcesTooltipResourceButtons from "../../../_shared/ResourcesHelpLinks";
import SectionHeader from "../../../_shared/SectionHeader";
import SelectOne from "../Fields/SelectOne";

const G_COMMON = "dataJournal.statTest.axes.common";
const G_T = "dataJournal.statTest.axes.tTest";

export default function AxesTtest({
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

  const dataLayoutPanelId = `stat-test-ttest-data-layout-${sectionId}`;

  useEffect(() => {
    setSelectedDataFormat(selectors?.dataFormat || "long");
  }, [selectors?.dataFormat]);

  const dataFormatMenu = useMemo(
    () => [
      {
        key: "long",
        value: "long",
        chipLabel: t(`${G_COMMON}.dataFormat.chipLong`, {}, { default: "Long" }),
        title: t(`${G_T}.dataFormat.long.title`, {}, {
          default: "Switch to using a label column to sort rows of a value column",
        }),
        description: t(`${G_T}.dataFormat.long.description`, {}, {
          default:
            "In the example above, we would select the column 'attrib' as a grouping column. This grouping is performed on the 'value' column which contains values for both conditions",
        }),
        img: "/assets/icons/visualize/dataTtestLong.svg",
      },
      {
        key: "wide",
        value: "wide",
        chipLabel: t(`${G_COMMON}.dataFormat.chipWide`, {}, { default: "Wide" }),
        title: t(`${G_T}.dataFormat.wide.title`, {}, {
          default: "Switch to performing a T-Test between two columns",
        }),
        description: t(`${G_T}.dataFormat.wide.description`, {}, {
          default:
            "In the example above, we would select the columns c1 and c2 to perform a t-test on them.",
        }),
        img: "/assets/icons/visualize/dataTtest.svg",
      },
    ],
    [t],
  );

  const resourcesList = useMemo(
    () => [
      {
        title: t(`${G_T}.resources.scribbrLinkTitle`, {}, {
          default: "Independent samples t-test",
        }),
        alt: t(`${G_T}.resources.scribbrLinkAlt`, {}, { default: "External link" }),
        img: "/assets/icons/visualize/externalNewTab.svg",
        link: "https://www.scribbr.com/statistics/t-test/",
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
  const currentlyPerforming = t(`${G_T}.dataFormat.currentlyPerforming`, {}, {
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
            "Learn more about this component with the resources below.",
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
              {t(`${G_T}.dataFormat.summaryWide.prefix`, {}, { default: "T-Test " })}
              <strong>{t(`${G_T}.dataFormat.summaryWide.between`, {}, { default: "between" })}</strong>
              {t(`${G_T}.dataFormat.summaryWide.columns`, {}, { default: " two columns." })}
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>{currentlyPerforming}</strong>{" "}
              {t(`${G_T}.dataFormat.summaryLong.main`, {}, {
                default:
                  "T-Test on a column containing values using a grouping column containing labels for each row",
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
              <h3 className="barPlotDataFormat__title">{currentFormatOption.title}</h3>
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
            title={t(`${G_T}.quantitativeColumn`, {}, { default: "Quantitative Column" })}
            parameter="valCol"
          />
          <SelectOne
            sectionId={sectionId}
            options={options}
            selectors={selectors}
            onSelectorChange={onSelectorChange}
            title={t(`${G_T}.groupingColumn`, {}, { default: "Grouping Column" })}
            parameter="groupcol"
          />
        </div>
      ) : (
        <div className="selectorsTestStats">
          <SelectOne
            sectionId={sectionId}
            options={options}
            selectors={selectors}
            onSelectorChange={onSelectorChange}
            title={t(`${G_T}.col1`, {}, { default: "1st column" })}
            parameter="col1"
          />
          <SelectOne
            sectionId={sectionId}
            options={options}
            selectors={selectors}
            onSelectorChange={onSelectorChange}
            title={t(`${G_T}.col2`, {}, { default: "2nd column" })}
            parameter="col2"
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
