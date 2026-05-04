import { useEffect, useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
} from "semantic-ui-react";

import Button from "../../../../../../../../DesignSystem/Button";
import Chip from "../../../../../../../../DesignSystem/Chip";
import SelectMultiple from "../Fields/SelectMultiple";
import SelectOne from "../Fields/SelectOne";

const G_COMMON = "dataJournal.statTest.axes.common";
const G_A = "dataJournal.statTest.axes.anova";

const ACCORDION_CHEVRON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
  </svg>
);

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
  const [activeIndex, setActiveIndex] = useState(-1);

  const dataLayoutPanelId = `stat-test-anova-data-layout-${sectionId}`;

  useEffect(() => {
    setSelectedDataFormat(selectors?.dataFormat || "long");
  }, [selectors?.dataFormat]);

  const handleAccordionClick = (e, titleProps) => {
    const { index } = titleProps;
    setActiveIndex(activeIndex === index ? -1 : index);
  };

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
  const resourcesSectionTitle = t(`${G_COMMON}.resources.sectionTitle`, {}, {
    default: "Resources",
  });
  const resourcesOpenHint = t(`${G_COMMON}.resources.openLinkHint`, {}, {
    default: "Click here to access the resource",
  });

  const currentFormatOption = useMemo(
    () => dataFormatMenu.find((o) => o.value === selectedDataFormat) || dataFormatMenu[0],
    [dataFormatMenu, selectedDataFormat],
  );

  return (
    <div className="selectorsStats">
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
            <p>
              {t(`${G_A}.dataFormat.summaryLong.hint`, {}, {
                default:
                  "(Click here if you want to switch to comparing values in different columns)",
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

      <Accordion>
        <AccordionTitle
          active={activeIndex === 0}
          index={0}
          onClick={handleAccordionClick}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                transform: activeIndex === 0 ? "rotate(180deg)" : "none",
                transition: "transform 0.2s ease",
              }}
            >
              {ACCORDION_CHEVRON}
            </span>
            {resourcesSectionTitle}
          </span>
        </AccordionTitle>
        <AccordionContent active={activeIndex === 0}>
          {resourcesList.map((option) => (
            <a
              className="resourcesCard"
              href={option.link}
              target="_blank"
              rel="noopener noreferrer"
              key={option.link}
            >
              <img
                className="resourcesCardImage"
                src={option.img}
                alt={option.alt}
              />
              <div>
                <div className="resourcesCardTitle">{option.title}</div>
                <div className="resourcesCardLink">{resourcesOpenHint}</div>
              </div>
            </a>
          ))}
        </AccordionContent>
      </Accordion>
    </div>
  );
}
