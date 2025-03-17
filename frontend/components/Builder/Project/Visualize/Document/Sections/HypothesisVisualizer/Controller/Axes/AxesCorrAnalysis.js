import React, { useState, useEffect } from "react";
import {  Popup } from "semantic-ui-react";

import AggregateVarSelector from "../Fields/AggregateVarSelector";

export default function Axes({
  type,
  variables,
  code,
  pyodide,
  runCode,
  sectionId,
  selectors,
  handleContentChange,
}) {

  const [activeIndex, setActiveIndex] = useState(-1);
  const [jsonObject, setJsonObject] = useState(selectors);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  const connectSelectorsCode = `
html_output = js.document.getElementById('figure-${sectionId}')
parameters = dict(json.loads('dashboardJSON'))
print("Py code parameters", parameters)
`;
  
  const popupStyle = {
    borderRadius: 8,
    opacity: 0.9,
    padding: '2em',
    fontSize: '15px',
  }

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.displayName || variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const updateCode = async ({ code, newJsonObject }) => {
    const updatedConnectSelectorsCode = connectSelectorsCode.replace('dashboardJSON', JSON.stringify(newJsonObject));
    await pyodide.runPythonAsync(updatedConnectSelectorsCode);
    await pyodide.runPythonAsync(code);
    if (runCode) {
      runCode({ code }); // Trigger the runCode function passed from StateManager
    }
  };

  // const copyToClipboard = () => {
  //   const fillInTheBlanksDiv = document.querySelector('.fill-in-the-blanks');
  //   // const textContent = fillInTheBlanksDiv.innerText;
  //   const textContent = Array.from(fillInTheBlanksDiv.childNodes)
  //   .map(node => node.innerText || node.textContent)
  //   .join(' ');
  //   navigator.clipboard.writeText(textContent).then(() => {
  //     alert('Text copied to clipboard: ' + textContent);
  //     console.log('Text copied to clipboard: ' + textContent);
  //   }).catch(err => {
  //     console.error('Error copying text: ', err);
  //   });
  // };
  
  const copyToClipboard = () => {
    const { ivDirectionality, independentVariable, dvDirectionality, dependentVariable } = selectors;
    const textContent = `I predict that ${ivDirectionality || ''} ${independentVariable || ''} will be related to ${dvDirectionality || ''} ${dependentVariable || ''}.`;
    
    navigator.clipboard.writeText(textContent).then(() => {
      alert('Text copied to clipboard: ' + textContent);
      console.log('Text copied to clipboard: ' + textContent);
    }).catch(err => {
      console.error('Error copying text: ', err);
    });
  }; 
  const copyFigToClipboard = async () => {
    try {
      // Retrieve the variable from Pyodide
      try {
        const variableValue = await pyodide.runPythonAsync("fig_html");
        // Copy the variable value to the clipboard
        await navigator.clipboard.writeText(variableValue);
        alert("Copied to clipboard!");
      } catch (error) {
        console.error("Failed to retrieve variable: ", error);
      }
    } catch (error) {
      console.error("Failed to copy: ", error);
    }
  };
  
  const handleAggregateVarChange = (name, value) => {
    // console.log('Handling aggregate var change:', selectors);
    handleContentChange({
      newContent: {
        selectors: { ...selectors, [name]: value },
      },
    });
  };

  // useEffect(() => {  
  //   const newJsonObject = { ...jsonObject };
  //   // iterate over selectors to build newJsonObject
  //   for (const key in selectors) {
  //     if (selectors.hasOwnProperty(key)) {
  //       newJsonObject[key] = selectors[key];
  //     }
  //   }
  //   // console.log('Setting jsonObject:', newJsonObject);
  //   setJsonObject(newJsonObject);
  //   updateCode({ code , newJsonObject});
  // }, [selectors]);

  useEffect(() => {  
    const newJsonObject = { ...selectors };
    setJsonObject(newJsonObject);
    updateCode({ code, newJsonObject });
  }, [selectors]);

  return (
    <>
      <div className="graph-dashboard">
        <div className="header">
          <img src={`/assets/icons/visualize/hypVis_corrAnalysis.svg`} />
          <div className="header-title">Correlational Hypothesis</div>
        </div>
        <div className="text-input">
          <label htmlFor="graphTitle" className="header-text">Title</label>
          <input
            className="input-box"
            id={`title-${sectionId}`}
            type="text"
            name="graphTitle"
            value={selectors.graphTitle || ""}
            onChange={({ target }) => handleContentChange({ newContent: { selectors: { ...selectors, graphTitle: target.value }, }, }) }
            />
        </div>
        <div className="parameter-panel">
          <div className="header">
            <div className="header-title">Your correlational hypothesis</div>
            <Popup 
              content={
              <div>
                <>Fill in the blanks to create your correlational hypothesis!</><br/>
                <>For instance</><br/>
                <q>It is predicted that higher anxiety will be related to lower % of trials gambled.</q>
              </div>
              } 
              trigger={<img src={`/assets/icons/visualize/question_mark.svg`} />} 
              inverted
              style={popupStyle}
            />
          </div>
          <div className="fill-in-the-blanks">

            <div className="text">I predict that </div>

            <AggregateVarSelector
              placeholder="directionality"
              isDirectionality={true}
              allowAdditions={false}
              value={selectors.ivDirectionality || ""}
              onChange={(e, { value }) => handleAggregateVarChange("ivDirectionality", value)}
            />
           <AggregateVarSelector
              placeholder={selectors[`independentVariable`] || "independant variable"}
              isDirectionality={false}
              allowAdditions={true}
              value={selectors[`independentVariable`] || ""}
              onChange={(e, { value }) => handleAggregateVarChange("independentVariable", value)}
            />
            <div className="text">will be related to</div>            
            <AggregateVarSelector
              placeholder="directionality"
              isDirectionality={true}
              allowAdditions={false}
              value={selectors.dvDirectionality || ""}
              onChange={(e, { value }) => handleAggregateVarChange("dvDirectionality", value)}
            />
           <AggregateVarSelector
              placeholder={selectors[`dependentVariable`] || "dependant variable"}
              isDirectionality={false}
              allowAdditions={true}
              value={selectors[`dependentVariable`] || ""}
              onChange={(e, { value }) => handleAggregateVarChange("dependentVariable", value)}
            />

            {/* <div className="text">.</div> */}

          </div>
        </div>
        <div className="button-panel">
          <div className="clipboard-copy-button" onClick={copyToClipboard}>
            <div>Copy hypothesis text to clipboard</div>
            <img src={`/assets/icons/visualize/clipboard-copy.svg`} />
          </div>
          <div className="clipboard-fig-copy-button" onClick={copyFigToClipboard}>
            <div>Copy graph to clipboard</div>
            <img src={`/assets/icons/visualize/clipboard-copy.svg`} />
          </div>
        </div>
      </div>
    </>
  );
}
//TODO: Add aggregate variables from study builder to the dropdowns