// components/DataJournal/Widgets/types/Graph/Editor/GraphEditor.js
import { useState } from "react";
import { Tab } from "semantic-ui-react";

import { useDataJournal } from "../../../../Context/DataJournalContext";

import CodeEditor from "./CodeEditor";
import TemplateSelector from "./TemplateSelector";

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
  const { pyodide, data, variables } = useDataJournal();

  const [activeTab, setActiveTab] = useState(0);

  // state of the python code
  const code = content?.code || defaultCode;
  const type = content?.type || undefined;
  const selectors = content?.selectors || {};
  const variablesToDisplay = variables.filter((column) => !column?.hide);

  const handleTabChange = (e, { activeIndex }) => setActiveTab(activeIndex);

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

  const panes = [
    {
      menuItem: "Axes",
      render: () => (
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
      menuItem: "Style & Layout",
      render: () => (
        <div className="tabContent">
          <div className="styleLayoutContainer">
            <h3>Style & Layout Options</h3>
            <p>Customize the appearance and layout of the graph.</p>
            <OptionsComponent
              sectionId={sectionId}
              selectors={selectors}
              onChange={onChange}
            />
          </div>
        </div>
      ),
    },
    {
      menuItem: "Code editor",
      render: () => (
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
          <Tab
            panes={panes}
            activeIndex={activeTab}
            onTabChange={handleTabChange}
            className="customTabs"
          />
        </div>
      )}
      {!code && pyodide && (
        <TemplateSelector sectionId={sectionId} onChange={onChange} />
      )}
    </div>
  );
}
