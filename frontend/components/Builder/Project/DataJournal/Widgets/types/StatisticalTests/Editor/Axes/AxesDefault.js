import useTranslation from "next-translate/useTranslation";

import SectionHeader from "../../../_shared/SectionHeader";
import SelectOne from "../Fields/SelectOne";

const G_COMMON = "dataJournal.statTest.axes.common";
const G_D = "dataJournal.statTest.axes.default";

export default function AxesDefault({
  variables,
  sectionId,
  selectors,
  onChange,
}) {
  const { t } = useTranslation("builder");

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
    <div className="selectors">
      <SectionHeader
        title={t(`${G_COMMON}.header.title`, {}, { default: "Axes" })}
        iconSrc="/assets/icons/visualize/axes.svg"
        iconAlt={t(`${G_COMMON}.header.iconAlt`, {}, { default: "Axes" })}
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G_D}.column1`, {}, { default: "1st Column" })}
        parameter="xVariable"
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G_D}.column2`, {}, { default: "2nd Column" })}
        parameter="yVariable"
      />
    </div>
  );
}
