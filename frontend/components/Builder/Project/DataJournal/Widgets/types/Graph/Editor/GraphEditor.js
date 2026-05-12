// components/DataJournal/Widgets/types/Graph/Editor/GraphEditor.js
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import { useDataJournal } from "../../../../Context/DataJournalContext";
import useResolvedJournalSlice from "../../../../Hooks/useResolvedJournalSlice";
import Chip from "../../../../../../../DesignSystem/Chip";

import CodeEditor from "./CodeEditor";

import OptionsDefault from "./Options/OptionsDefault"; // TODO - TO UPDATE
import OptionsScatterPlot from "./Options/OptionsScatterPlot";
import OptionsBarPlot from "./Options/OptionsBarPlot";
import OptionsHistogram from "./Options/OptionsHistogram";

import AxesDefault from "./Axes/AxesDefault"; // UPDATED - TO UPDATE
import AxesScatterPlot from "./Axes/AxesScatterPlot";
import AxesBarPlot from "./Axes/AxesBarPlot";
import AxesHistogram from "./Axes/AxesHistogram";

const defaultCode = ``;

export default function GraphEditor({ content, onChange, sectionId }) {
  const { t } = useTranslation("builder");
  const { pyodide } = useDataJournal();
  const { slice, sliceReady } = useResolvedJournalSlice(content);
  const variables = sliceReady && slice ? slice.variables || [] : [];

  const [activeTab, setActiveTab] = useState(0);

  // state of the python code
  const code = content?.code || defaultCode;
  const type = content?.type || undefined;
  const selectors = content?.selectors || {};
  const variablesToDisplay = variables.filter((column) => !column?.hide);

  const handleTabChange = (index) => setActiveTab(index);

  const iconStyle = { width: 16, height: 16, display: "block" };

  // Define different templates or components for each type of graph
  const AxisTemplateMap = {
    histogram: AxesHistogram,
    barGraph: AxesBarPlot,
    scatterPlot: AxesScatterPlot,
  };

  const OptionsTemplateMap = {
    histogram: OptionsHistogram,
    barGraph: OptionsBarPlot,
    scatterPlot: OptionsScatterPlot,
  };

  // Conditionally render the appropriate template or component based on the selected graph type
  const AxesComponent = AxisTemplateMap[type] || AxesDefault;
  const OptionsComponent = OptionsTemplateMap[type] || OptionsDefault;

  const tabItems = [
    {
      label: t("dataJournal.graph.editor.tabs.axes", {}, { default: "Axes" }),
      icon: <img src="/assets/icons/settingsViz.svg" alt="" aria-hidden style={iconStyle} />,
      content: (
        <div className="tabContent">
          <AxesComponent
            variables={variablesToDisplay}
            sectionId={sectionId}
            selectors={selectors}
            onChange={onChange}
          />
        </div>
      ),
    },
    {
      label: t("dataJournal.graph.editor.tabs.styleLayout", {}, { default: "Style & Layout" }),
      icon: <img src="/assets/icons/stylesLayout.svg" alt="" aria-hidden style={iconStyle} />,
      content: (
        <div className="tabContent">
          <div className="styleLayoutContainer">
            <OptionsComponent
              sectionId={sectionId}
              selectors={selectors}
              onChange={onChange}
              slice={slice}
              sliceReady={sliceReady}
              variables={variablesToDisplay}
            />
          </div>
        </div>
      ),
    },
    {
      label: t("dataJournal.graph.editor.tabs.codeEditor", {}, { default: "Code editor" }),
      icon: <img src="/assets/icons/code.svg" alt="" aria-hidden style={iconStyle} />,
      content: (
        <div className="tabContent">
          <CodeEditor sectionId={sectionId} code={code} onChange={onChange} />
        </div>
      ),
    },
  ];

  return (
    <div className="graph">
      {code && pyodide && (
        <div className="tabs">
          <div className="customTabs">
            {tabItems.map((item, index) => (
              <Chip
                key={item.label}
                label={item.label}
                leading={item.icon}
                selected={activeTab === index}
                onClick={() => handleTabChange(index)}
                shape="square"
                style={activeTab === index ? { backgroundColor: "#FDF2D0" } : {border: "1px solid #F3F3F3"}}

              />
            ))}
          </div>
          {tabItems[activeTab]?.content}
        </div>
      )}
    </div>
  );
}
