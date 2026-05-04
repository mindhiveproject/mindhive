import { useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import ResourcesTooltipResourceButtons from "../../../_shared/ResourcesHelpLinks";
import SectionHeader from "../../../_shared/SectionHeader";
import SelectOne from "../Fields/SelectOne";

const G_COMMON = "dataJournal.statTest.axes.common";
const G_P = "dataJournal.statTest.axes.pearson";

export default function AxesPearsonCorr({
  variables,
  sectionId,
  selectors,
  onChange,
}) {
  const { t } = useTranslation("builder");
  const [selectedDataFormat] = useState("wide");

  const resourcesList = useMemo(
    () => [
      {
        title: t(`${G_P}.resources.scribbrLinkTitle`, {}, {
          default: "What's a Pearson's correlation",
        }),
        alt: t(`${G_P}.resources.scribbrLinkAlt`, {}, { default: "External link" }),
        img: "/assets/icons/visualize/externalNewTab.svg",
        link: "https://www.scribbr.com/statistics/pearson-correlation-coefficient/",
      },
    ],
    [t],
  );

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

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.field,
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
      <div className="selectorsTestStats">
        <SelectOne
          sectionId={sectionId}
          options={options}
          selectors={selectors}
          onSelectorChange={onSelectorChange}
          title={t(`${G_P}.predictorColumn`, {}, { default: "Predictor Column" })}
          parameter="col1"
        />
        <SelectOne
          sectionId={sectionId}
          options={options}
          selectors={selectors}
          onSelectorChange={onSelectorChange}
          title={t(`${G_P}.predictedColumn`, {}, { default: "Predicted Column" })}
          parameter="col2"
        />
      </div>
      <input
        type="hidden"
        id={`dataFormat-${sectionId}`}
        value={selectedDataFormat}
      />
    </div>
  );
}
