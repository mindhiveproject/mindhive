// components/DataJournal/Widgets/types/Graph/Editor/Axes/AxesBarPlot.js
import { useEffect, useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../../../../../DesignSystem/Button";
import SectionHeader from "../_shared/SectionHeader";
import ResourcesTooltipResourceButtons from "../_shared/ResourcesHelpLinks";
import SelectMultiple from "../Fields/SelectMultiple";
import SelectOne from "../Fields/SelectOne";

const G = "dataJournal.graph";

export default function AxesBarPlot({
  variables,
  sectionId,
  selectors,
  onChange,
}) {
  const { t } = useTranslation("builder");

  const [selectedDataFormat, setSelectedDataFormat] = useState(
    selectors["dataFormat"] || "long",
  );

  useEffect(() => {
    const next = selectors?.dataFormat || "long";
    setSelectedDataFormat(next);
  }, [selectors?.dataFormat]);

  const errBarsOptions = useMemo(
    () => [
      {
        value: "stdErr",
        text: t(`${G}.axes.barPlot.errBarStdErr`, {}, { default: "Standard error" }),
      },
      {
        value: "95pi",
        text: t(`${G}.axes.barPlot.errBar95`, {}, { default: "95% confidence interval" }),
      },
      {
        value: "99pi",
        text: t(`${G}.axes.barPlot.errBar99`, {}, { default: "99% confidence interval" }),
      },
    ],
    [t],
  );

  const resourcesItems = useMemo(
    () => [
      {
        title: t(`${G}.axes.barPlot.resources.barPlotTitle`, {}, { default: "What is a Bar Plot?" }),
        alt: t(`${G}.axes.barPlot.resources.barPlotAlt`, {}, { default: "External link" }),
        img: "/assets/icons/visualize/externalNewTab.svg",
        link: "https://datavizcatalogue.com/methods/bar_chart.html",
      },
      {
        title: t(`${G}.axes.barPlot.resources.standardErrorTitle`, {}, {
          default: "More about the standard error",
        }),
        alt: t(`${G}.axes.barPlot.resources.standardErrorAlt`, {}, { default: "External link" }),
        img: "/assets/icons/visualize/externalNewTab.svg",
        link: "https://www.scribbr.com/statistics/standard-error/",
      },
      {
        title: t(`${G}.axes.barPlot.resources.confidenceIntervalsTitle`, {}, {
          default: "Confidence intervals — what are they?",
        }),
        alt: t(`${G}.axes.barPlot.resources.confidenceIntervalsAlt`, {}, { default: "External link" }),
        img: "/assets/icons/visualize/externalNewTab.svg",
        link: "https://www.scribbr.com/statistics/confidence-interval/",
      },
    ],
    [t],
  );

  const openLinkLabel = t(`${G}.common.resources.openLink`, {}, {
    default: "Click here to access the resource",
  });
  const noLinkHint = t(`${G}.common.resources.noLink`, {}, { default: "No external link" });

  const helpContent = useMemo(
    () => (
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#625B71" }}>
        {t(`${G}.axes.help.resourcesIntro`, {}, {
          default: "Use the buttons below to open a reference in a new tab when a link is available.",
        })}
      </p>
    ),
    [t],
  );
  const helpAction = useMemo(
    () => (
      <ResourcesTooltipResourceButtons
        items={resourcesItems}
        openLinkLabel={openLinkLabel}
        noLinkHint={noLinkHint}
      />
    ),
    [resourcesItems, openLinkLabel, noLinkHint],
  );

  const dataFormatMenu = useMemo(
    () => [
      {
        key: "long",
        value: "long",
        title: t(`${G}.axes.barPlot.dataFormat.longTitle`, {}, { default: "Long Data Format" }),
        description: t(`${G}.axes.barPlot.dataFormat.longDescription`, {}, {
          default:
            "Data organized with each observation (like a student's test score) appearing on its own row, often with a column indicating categories (like subjects). This format is useful for detailed analysis across categories.",
        }),
        img: "/assets/icons/visualize/dataStructLongDetailed.svg",
        link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
      },
      {
        key: "wide",
        value: "wide",
        title: t(`${G}.axes.barPlot.dataFormat.wideTitle`, {}, { default: "Wide Data Format" }),
        description: t(`${G}.axes.barPlot.dataFormat.wideDescription`, {}, {
          default:
            "Data organized with each category (like subjects) appearing as its own column, often with rows representing observations (like students). This format is simpler for quick comparisons within categories.",
        }),
        img: "/assets/icons/visualize/dataStructWideDetailed.svg",
        link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
      },
    ],
    [t],
  );

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.displayName || variable?.field,
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

  const slidesLinkText = t(`${G}.axes.barPlot.dataFormat.slidesLink`, {}, {
    default: "Click here to see the lecture slides",
  });
  const googleSlidesAlt = t(`${G}.axes.barPlot.dataFormat.googleSlidesAlt`, {}, {
    default: "Google Slides",
  });

  const dataFormatSectionLabel = t(`${G}.axes.barPlot.dataFormat.sectionLabel`, {}, {
    default: "Data layout",
  });
  const switchToWideLabel = t(`${G}.axes.barPlot.dataFormat.switchToWide`, {}, {
    default: "Switch to wide format",
  });
  const switchToLongLabel = t(`${G}.axes.barPlot.dataFormat.switchToLong`, {}, {
    default: "Switch to long format",
  });

  const currentFormatOption = useMemo(
    () => dataFormatMenu.find((o) => o.value === selectedDataFormat) || dataFormatMenu[0],
    [dataFormatMenu, selectedDataFormat],
  );
  const alternateFormatOption = useMemo(
    () => dataFormatMenu.find((o) => o.value !== selectedDataFormat),
    [dataFormatMenu, selectedDataFormat],
  );

  return (
    <div className="selectors">
      <SectionHeader
        title={t(`${G}.axes.header.title`, {}, { default: "Axes" })}
        iconSrc="/assets/icons/visualize/axes.svg"
        iconAlt={t(`${G}.axes.header.iconAlt`, {}, { default: "Axes" })}
        helpContent={helpContent}
        helpAction={helpAction}
        helpAriaLabel={t(`${G}.axes.help.ariaLabel`, {}, { default: "Resources and help" })}
      />
      {selectedDataFormat && currentFormatOption && (
        <div className="barPlotDataFormat">
          <div className="barPlotDataFormat__sectionLabel">{dataFormatSectionLabel}</div>
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
            <div className="barPlotDataFormat__slides">
              <img
                src="/assets/icons/visualize/googleSlides.svg"
                alt={googleSlidesAlt}
                width={20}
                height={20}
                decoding="async"
              />
              <a href={currentFormatOption.link} target="_blank" rel="noopener noreferrer">
                {slidesLinkText}
              </a>
            </div>
            {alternateFormatOption && (
              <div className="barPlotDataFormat__actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSelectorChoice(alternateFormatOption)}
                  style={{ width: "100%" }}
                  aria-label={
                    alternateFormatOption.value === "wide"
                      ? switchToWideLabel
                      : switchToLongLabel
                  }
                >
                  {alternateFormatOption.value === "wide"
                    ? switchToWideLabel
                    : switchToLongLabel}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedDataFormat &&
        (selectedDataFormat === "long" ? (
          <div className="graphEditorNestedFields">
            <SelectOne
              sectionId={sectionId}
              options={options}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title={t(`${G}.axes.barPlot.qualitativeColumn`, {}, { default: "Qualitative Column" })}
              parameter="qualCol"
            />
            <SelectOne
              sectionId={sectionId}
              options={options}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title={t(`${G}.axes.barPlot.quantitativeColumn`, {}, { default: "Quantitative Column" })}
              parameter="quantCol"
            />
            <SelectOne
              sectionId={sectionId}
              options={errBarsOptions}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title={t(`${G}.axes.barPlot.errorBar`, {}, { default: "Error bar" })}
              parameter="errBar"
            />
          </div>
        ) : (
          <div className="graphEditorNestedFields">
            <SelectMultiple
              sectionId={sectionId}
              options={options}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title={t(`${G}.axes.barPlot.columnsToPlot`, {}, { default: "Column(s) to plot" })}
              parameter="colToPlot"
            />
            <SelectOne
              sectionId={sectionId}
              options={errBarsOptions}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title={t(`${G}.axes.barPlot.errorBarWide`, {}, { default: "Error Bar" })}
              parameter="errBar"
            />
          </div>
        ))}
      <input
        type="hidden"
        id={`dataFormat-${sectionId}`}
        value={selectedDataFormat}
      />
    </div>
  );
}
