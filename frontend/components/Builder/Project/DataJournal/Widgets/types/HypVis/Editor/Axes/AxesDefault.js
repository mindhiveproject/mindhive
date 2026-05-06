import useTranslation from "next-translate/useTranslation";

import SectionHeader from "../../../_shared/SectionHeader";
import SelectOne from "../Fields/SelectOne";

const G_D = "dataJournal.hypVis.axes.default";

export default function Axes({
  variables,
  code,
  pyodide,
  runCode,
  sectionId,
  selectors,
  handleContentChange,
}) {
  const { t } = useTranslation("builder");

  const connectSelectorsCode = `# get relevant html elements
html_output = js.document.getElementById('figure-${sectionId}')
X = js.document.getElementById("xVariable-${sectionId}").value
Y = js.document.getElementById("yVariable-${sectionId}").value
Group = js.document.getElementById("groupVariable-${sectionId}").value`;

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.displayName || variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const updateCode = async ({ code: codeArg }) => {
    await pyodide.runPythonAsync(connectSelectorsCode);
    runCode({ code: codeArg });
  };

  const onSelectorChange = ({ target }) => {
    handleContentChange({
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
    updateCode({ code });
  };

  return (
    <div className="selectors">
      <SectionHeader
        title={t(`${G_D}.header.title`, {}, { default: "Axes" })}
        iconSrc="/assets/icons/visualize/axes.svg"
        iconAlt={t(`${G_D}.header.iconAlt`, {}, { default: "Axes" })}
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G_D}.xAxis`, {}, { default: "X-Axis" })}
        parameter="xVariable"
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G_D}.yAxis`, {}, { default: "Y-Axis" })}
        parameter="yVariable"
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title={t(`${G_D}.group`, {}, { default: "Group" })}
        parameter="groupVariable"
      />
    </div>
  );
}
