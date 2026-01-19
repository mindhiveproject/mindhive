// components/DataJournal/Widgets/types/Graph/Editor/GraphEditor.js
import { useState, useEffect } from "react";
import {
  MessageHeader,
  MessageContent,
  Message,
  Icon,
  AccordionTitle,
  AccordionContent,
  Accordion,
  Tab,
} from "semantic-ui-react";

import { useDataJournal } from "../../../../Context/DataJournalContext";
import { runCode } from "../../../../Helpers/PyodideUtils";

import CodeEditor from "./CodeEditor";
import TemplateSelector from "./TemplateSelector";

import OptionsDefault from "./Options/OptionsDefault";
import OptionsScatterPlot from "./Options/OptionsScatterPlot";
import OptionsBarPlot from "./Options/OptionsBarPlot";
import OptionsHistogram from "./Options/OptionsHistogram";

import AxesDefault from "./Axes/AxesDefault";
import AxesScatterPlot from "./Axes/AxesScatterPlot";
import AxesBarPlot from "./Axes/AxesBarPlot";
import AxesHistogram from "./Axes/AxesHistogram";

const defaultCode = ``;

// Centralized prepareCanvasCode (move to PyodideUtils.js if shared)
const getPrepareCanvasCode = (sectionId) => `
# get relevant html elements
html_output = js.document.getElementById('figure-${sectionId}')

Xmultiple = js.document.getElementById("xVariableMultiple-${sectionId}")

X     = None if js.document.getElementById("xVariable-${sectionId}")     == None else js.document.getElementById("xVariable-${sectionId}").value
Y     = None if js.document.getElementById("yVariable-${sectionId}")     == None else js.document.getElementById("yVariable-${sectionId}").value
Group = None if js.document.getElementById("groupVariable-${sectionId}") == None else js.document.getElementById("groupVariable-${sectionId}").value

graphTitle = None if js.document.getElementById('graphTitle-${sectionId}') == None else js.document.getElementById('graphTitle-${sectionId}').value

legend_title = None if js.document.getElementById('legend_title-${sectionId}') == None else js.document.getElementById('legend_title-${sectionId}').value
legend_title_text = None if js.document.getElementById('legend_title_text-${sectionId}') == None else js.document.getElementById('legend_title_text-${sectionId}').value
x_labels = None if js.document.getElementById('x_labels-${sectionId}') == None else js.document.getElementById('x_labels-${sectionId}').value
xLabel = None if js.document.getElementById('xLabel-${sectionId}') == None else js.document.getElementById('xLabel-${sectionId}').value
xRangeMin = None if js.document.getElementById('xRangeMin-${sectionId}') == None else js.document.getElementById('xRangeMin-${sectionId}').value
xRangeMax = None if js.document.getElementById('xRangeMax-${sectionId}') == None else js.document.getElementById('xRangeMax-${sectionId}').value
yLabel = None if js.document.getElementById('yLabel-${sectionId}') == None else js.document.getElementById('yLabel-${sectionId}').value
yRangeMin = None if js.document.getElementById('yRangeMin-${sectionId}') == None else js.document.getElementById('yRangeMin-${sectionId}').value
yRangeMax = None if js.document.getElementById('yRangeMax-${sectionId}') == None else js.document.getElementById('yRangeMax-${sectionId}').value
color = None if js.document.getElementById('color-${sectionId}') == None else js.document.getElementById('color-${sectionId}').value
marginalPlot = None if js.document.getElementById('marginalPlot-${sectionId}') == None else js.document.getElementById('marginalPlot-${sectionId}').value
trendline = None if js.document.getElementById('trendline-${sectionId}') == None else js.document.getElementById('trendline-${sectionId}').value
dataFormat = None if js.document.getElementById('dataFormat-${sectionId}') == None else js.document.getElementById('dataFormat-${sectionId}').value
errBar = None if js.document.getElementById('errBar-${sectionId}') == None else js.document.getElementById('errBar-${sectionId}').value

isWide = dataFormat == 'wide'
if isWide:
    columns = Xmultiple.value.split(',') if Xmultiple is not None else None
else:
    qualCol = None if js.document.getElementById("qualCol-${sectionId}") == None else js.document.getElementById("qualCol-${sectionId}").value
    quantCol = None if js.document.getElementById("quantCol-${sectionId}") == None else js.document.getElementById("quantCol-${sectionId}").value

# clear the html output
if html_output is not None:
    while html_output.firstChild:
        html_output.removeChild(html_output.firstChild)
`;

export default function GraphEditor({ content, onChange, sectionId }) {
  const { pyodide, data, variables } = useDataJournal();

  const handleContentChange = onChange; // Rename for internal consistency

  const [activeTab, setActiveTab] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");

  // state of the python code
  const code = content?.code || defaultCode;
  const type = content?.type || undefined;
  const selectors = content?.selectors || {};
  const variablesToDisplay = variables.filter((column) => !column?.hide);

  const handleTabChange = (e, { activeIndex }) => setActiveTab(activeIndex);

  const handleClick = (e, { index }) => {
    setActiveIndex(activeIndex === index ? -1 : index);
  };

  const runGraphCode = async () => {
    setIsRunning(true);
    const prepareCode = getPrepareCanvasCode(sectionId);
    const fullCode = prepareCode + "\n" + code;
    try {
      const res = await runCode(pyodide, fullCode);
      setOutput(res || "");
    } catch (err) {
      setOutput(String(err));
    } finally {
      setIsRunning(false);
    }
  };

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
            handleContentChange={handleContentChange}
            type={type}
            variables={variablesToDisplay}
            code={code}
            pyodide={pyodide}
            runCode={runGraphCode}
            sectionId={sectionId}
            selectors={selectors}
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
              handleContentChange={handleContentChange}
              code={code}
              pyodide={pyodide}
              runCode={runGraphCode}
              sectionId={sectionId}
              selectors={selectors}
            />
          </div>
        </div>
      ),
    },
    {
      menuItem: "Code editor",
      render: () => (
        <div className="tabContent">
          <CodeEditor
            code={code}
            handleContentChange={handleContentChange}
            runCode={runGraphCode}
          />
          <Accordion>
            <AccordionTitle
              active={activeIndex === 0}
              index={0}
              onClick={handleClick}
            >
              <Icon name="dropdown" />
              Console
            </AccordionTitle>
            <AccordionContent active={activeIndex === 0}>
              <textarea
                className="outputArea"
                id="output"
                value={output}
                rows={12}
                disabled
              />
            </AccordionContent>
          </Accordion>
        </div>
      ),
    },
  ];

  return (
    <div className="graph">
      {isRunning && (
        <Message icon>
          <Icon name="circle notched" loading />
          <MessageContent>
            <MessageHeader>Just one second</MessageHeader>
            The code is running.
          </MessageContent>
        </Message>
      )}
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
        <TemplateSelector
          handleContentChange={handleContentChange}
          runCode={runGraphCode}
          sectionId={sectionId}
        />
      )}
    </div>
  );
}
