import useTranslation from "next-translate/useTranslation";

import SectionHeader from "../../../_shared/SectionHeader";
import ResourcesTooltipResourceButtons from "../../../_shared/ResourcesHelpLinks";
import SelectOne from "../Fields/SelectOne";
import ToggleOne from "../Fields/ToggleOne";

const G = "dataJournal.graph";

export default function AxesScatterPlot({
  variables,
  sectionId,
  selectors,
  onChange,
}) {
  const { t } = useTranslation("builder");

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.displayName || variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const resourcesItems = [
    {
      title: t(`${G}.axes.scatterPlot.resources.scatterPlotTitle`, {}, { default: "Scatter Plot" }),
      alt: t(`${G}.axes.scatterPlot.resources.scatterPlotAlt`, {}, { default: "Scatter plot resource" }),
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://en.wikipedia.org/wiki/Scatter_plot",
    },
    {
      title: t(`${G}.axes.scatterPlot.resources.trendlineTitle`, {}, { default: "Trendline" }),
      alt: t(`${G}.axes.scatterPlot.resources.trendlineAlt`, {}, {
        default: "External link to trendline resource",
      }),
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://www.storytellingwithdata.com/blog/2020/10/20/thoughts-on-trendlines#:~:text=A%20trendline%20is%20a%20line,data%20(e.g.%20regression%20analysis)",
    },
  ];

  const openLinkLabel = t(`${G}.common.resources.openLink`, {}, {
    default: "Click here to access the resource",
  });
  const noLinkHint = t(`${G}.common.resources.noLink`, {}, { default: "No external link" });

  const helpAction = (
    <ResourcesTooltipResourceButtons
      items={resourcesItems}
      openLinkLabel={openLinkLabel}
      noLinkHint={noLinkHint}
    />
  );

  const onSelectorChange = ({ target }) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
  };

  return (
    <div className="selectors">
      <SectionHeader
        title={t(`${G}.axes.header.title`, {}, { default: "Axes" })}
        iconSrc="/assets/icons/visualize/axes.svg"
        iconAlt={t(`${G}.axes.header.iconAlt`, {}, { default: "Axes" })}
        helpContent={<></>}
        helpAction={helpAction}
        helpAriaLabel={t(`${G}.axes.help.ariaLabel`, {}, { default: "Resources and help" })}
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G}.axes.scatterPlot.xAxis`, {}, { default: "X-Axis" })}
        parameter="xVariable"
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G}.axes.scatterPlot.yAxis`, {}, { default: "Y-Axis" })}
        parameter="yVariable"
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G}.axes.scatterPlot.group`, {}, { default: "Group" })}
        parameter="groupVariable"
      />
      <ToggleOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G}.axes.scatterPlot.trendline`, {}, { default: "Trendline" })}
        parameter="trendLine"
      />
    </div>
  );
}
