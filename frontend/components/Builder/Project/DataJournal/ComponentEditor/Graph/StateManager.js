import { useState } from "react";
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

import CodeEditor from "./Controller/CodeEditor";
import TemplateSelector from "./Controller/Templates";

import OptionsDefault from "./Controller/Options/OptionsDefault";
import OptionsScatterPlot from "./Controller/Options/OptionsScatterPlot";
import OptionsBarPlot from "./Controller/Options/OptionsBarPlot";
import OptionsHistogram from "./Controller/Options/OptionsHistogram";

import AxesDefault from "./Controller/Axes/AxesDefault";
import AxesScatterPlot from "./Controller/Axes/AxesScatterPlot";
import AxesBarPlot from "./Controller/Axes/AxesBarPlot";
import AxesHistogram from "./Controller/Axes/AxesHistogram";

const defaultCode = ``;

export default function StateManager({
  content,
  handleContentChange,
  pyodide,
  sectionId,
  data,
  variables,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState(0);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  const handleTabChange = (e, { activeIndex }) => {
    setActiveTab(activeIndex);
  };

  // state of the python code
  const code = content?.code || defaultCode;
  // state of the selectors
  const selectors = content?.selectors || {};
  // state of the graph type
  const type = content?.type || undefined;
  // get variable names
  const variablesToDisplay = variables.filter((column) => !column?.hide);

  const addToOutput = (s) => {
    if (typeof s === "undefined") {
      setOutput("");
    } else {
      setOutput(s);
    }
    setIsRunning(false);
  };

  const runCode = async ({ code }) => {
    if (pyodide) {
      try {
        setIsRunning(true);
        const res = await pyodide.runPythonAsync(code);
        addToOutput(res);
      } catch (err) {
        addToOutput(err);
      }
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
      menuItem: "Graph properties",
      render: () => (
        <div className="tabContent">
          <div className="graphRenderContainer">
            <AxesComponent
              type={type}
              variables={variablesToDisplay}
              code={code}
              pyodide={pyodide}
              runCode={runCode}
              sectionId={sectionId}
              selectors={selectors}
              handleContentChange={handleContentChange}
            />
            <div className="dashboardContainer">
              <OptionsComponent
                type={type}
                variables={variablesToDisplay}
                code={code}
                pyodide={pyodide}
                runCode={runCode}
                sectionId={sectionId}
                selectors={selectors}
                handleContentChange={handleContentChange}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      menuItem: "Style & Layout",
      render: () => (
        <div className="tabContent">
          <div className="styleLayoutContainer">
            <h3>Style & Layout Options</h3>
            <p>
              Customize the appearance and layout of the graph (to be
              implemented).
            </p>
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
            runCode={runCode}
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
          runCode={runCode}
          sectionId={sectionId}
        />
      )}
    </div>
  );
}
