import { useState, useCallback } from "react";

import {
  MessageHeader,
  MessageContent,
  Message,
  Icon,
  AccordionTitle,
  AccordionContent,
  Accordion,
  Button,
} from "semantic-ui-react";

import Render from "./Render";
import CodeEditor from "./Controller/CodeEditor";
import TemplateSelector from "./Controller/Templates";

import OptionsDefault from "./Controller/Options/OptionsDefault";
import OptionsABDesign from "./Controller/Options/OptionsABDesign";
import OptionsCorrAnalysis from "./Controller/Options/OptionsCorrAnalysis";

import AxesDefault from "./Controller/Axes/AxesDefault";
import AxesABDesign from "./Controller/Axes/AxesABDesign";
import AxesCorrAnalysis from "./Controller/Axes/AxesCorrAnalysis";

const defaultCode = ``;

export default function StateManager({
  content,
  handleContentChange,
  pyodide,
  sectionId,
  data,
  variables,
  user,
  studyId,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [runCodeCallback, setRunCodeCallback] = useState(null);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
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

  const handleContentChangeWrapper = ({ newContent }) => {
    if (newContent.code !== undefined) {
      handleContentChange({ newContent });
    }
    if (newContent.selectors !== undefined) {
      handleContentChange({ newContent });
    }
    if (newContent.type !== undefined) {
      handleContentChange({ newContent });
    }
  };

  const registerRunCodeCallback = useCallback((callback) => {
    setRunCodeCallback(() => callback);
  }, []);

  // Define different templates or components for each type of graph
  const AxisTemplateMap = {
    ABDesign: AxesABDesign,
    CorrAnalysis: AxesCorrAnalysis,
  };

  const OptionsTemplateMap = {
    ABDesign: OptionsABDesign,
    CorrAnalysis: OptionsCorrAnalysis,
  };

  // Conditionally render the appropriate template or component based on the selected graph type

  const AxesComponent = AxisTemplateMap[type] || AxesDefault;
  const OptionsComponent = OptionsTemplateMap[type] || OptionsDefault;

  // Commenting out the copy to clipboard functionality becuase it has
  // been implemented in the child components
  
  // const copyToClipboard = async () => {
  //   try {
  //     // Retrieve the variable from Pyodide
  //     try {
  //       const variableValue = await pyodide.runPythonAsync("fig_html");
  //       // Copy the variable value to the clipboard
  //       await navigator.clipboard.writeText(variableValue);
  //       alert("Copied to clipboard!");
  //     } catch (error) {
  //       console.error("Failed to retrieve variable: ", error);
  //     }
  //   } catch (error) {
  //     console.error("Failed to copy: ", error);
  //   }
  // };

  return (
    <div className="graph">
      {!code && pyodide && (
        <TemplateSelector
          handleContentChange={handleContentChange}
          runCode={runCode}
          sectionId={sectionId}
        />
      )}

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
        <>
          <div className="graphContainer">
            <Render
              data={data}
              code={code}
              pyodide={pyodide}
              runCode={runCode}
              sectionId={sectionId}
            />
            {/* <button onClick={copyToClipboard}>
              Click here to copy this plot to you clipboard and paste it in your
              Project Board
            </button> */}
          </div>
          <div className="graphRenderContainer">
            <AxesComponent
              type={type}
              variables={variablesToDisplay}
              user={user}
              code={code}
              pyodide={pyodide}
              runCode={runCodeCallback}
              studyId={studyId}
              sectionId={sectionId}
              selectors={selectors}
              handleContentChange={handleContentChangeWrapper}
            />
            {/* <div className="dashboardContainer">
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
            </div> */}
          </div>
          {code && pyodide && (
            <CodeEditor
              code={code}
              handleContentChange={handleContentChange}
              runCode={runCode}
            />
          )}
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
        </>
      )}
    </div>
  );
}
