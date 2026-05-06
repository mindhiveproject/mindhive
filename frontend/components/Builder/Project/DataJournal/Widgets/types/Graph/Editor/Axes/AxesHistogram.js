import { useMemo } from "react";
import useTranslation from "next-translate/useTranslation";

import SectionHeader from "../../../_shared/SectionHeader";
import ResourcesTooltipResourceButtons from "../../../_shared/ResourcesHelpLinks";
import SelectMultiple from "../Fields/SelectMultiple";
import SelectOne from "../Fields/SelectOne";

const G = "dataJournal.graph";

export default function AxesHistogram({
  variables,
  sectionId,
  selectors,
  onChange,
}) {
  const { t } = useTranslation("builder");

  const marginalPlotsOptions = useMemo(
    () => [
      {
        value: "",
        text: t(`${G}.axes.histogram.marginalNone`, {}, { default: "None" }),
      },
      {
        value: "rug",
        text: t(`${G}.axes.histogram.marginalRug`, {}, { default: "Rug plot" }),
      },
      {
        value: "box",
        text: t(`${G}.axes.histogram.marginalBox`, {}, { default: "Box plot" }),
      },
    ],
    [t],
  );

  const resourcesItems = [
    {
      title: t(`${G}.axes.histogram.resources.histogramTitle`, {}, { default: "What is a Histogram?" }),
      alt: t(`${G}.axes.histogram.resources.histogramAlt`, {}, { default: "External link" }),
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://datavizcatalogue.com/methods/histogram.html",
    },
  ];

  const openLinkLabel = t(`${G}.common.resources.openLink`, {}, {
    default: "Click here to access the resource",
  });
  const noLinkHint = t(`${G}.common.resources.noLink`, {}, { default: "No external link" });

  const helpContent = (
    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#625B71" }}>
      {t(`${G}.axes.help.resourcesIntro`, {}, {
        default: "Click on the resources below to learn more about this component",
      })}
    </p>
  );
  const helpAction = (
    <ResourcesTooltipResourceButtons
      items={resourcesItems}
      openLinkLabel={openLinkLabel}
      noLinkHint={noLinkHint}
    />
  );

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.displayName || variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const onSelectorChange = ({ target }) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [target.name]: target.value },
      },
    });
  };

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

      <SelectMultiple
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G}.axes.histogram.columnsToObserve`, {}, { default: "Column(s) to observe" })}
        parameter="X"
      />

      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G}.axes.histogram.groupByOptional`, {}, {
          default: "Group by (optional — color by category)",
        })}
        parameter="Group"
      />

      <SelectOne
        sectionId={sectionId}
        options={marginalPlotsOptions}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G}.axes.histogram.marginalPlot`, {}, { default: "Marginal plot" })}
        parameter="marginalPlot"
      />
    </div>
  );
}
