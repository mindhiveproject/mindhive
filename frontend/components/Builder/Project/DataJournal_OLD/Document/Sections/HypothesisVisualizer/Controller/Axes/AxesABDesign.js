import React, { useState, useEffect } from "react";
import { Popup, Rating } from "semantic-ui-react";

import AggregateVarSelector from "../Fields/AggregateVarSelector";
// import reformulateHypothesis from "./ReformulateHypothesis";

export default function Axes({
  type,
  variables,
  user,
  code,
  pyodide,
  runCode,
  sectionId,
  selectors,
  handleContentChange,
  studyId,
}) {

  const [groupNb, setGroupNb] = useState(selectors?.ivConditions || 2); // Default to 2 groups
  const [groupLabels, setGroupLabels] = useState({ group1: "", group2: "" });
  const [jsonObject, setJsonObject] = useState(selectors);
  const [ratings, setRatings] = useState({}); // Initialize ratings state

  // Handle rating change for each group
  const handleRatingChange = (e, group) => {
    const newRating = e.target.value;
    setRatings((prevRatings) => ({ ...prevRatings, [group]: newRating }));
    setGroupLabels((prevGroupLabels) => ({ ...prevGroupLabels, [group]: newRating }));
    // console.log('Handling new rating:', selectors);
    handleContentChange({ newContent: { selectors: { ...selectors, [group]: newRating }, }, });
  };

  const handleGroupNbChange = (e) => {
    const newGroupNb = parseInt(e.target.value, 10);
    setGroupNb(newGroupNb);

    // Update group labels state
    const newGroupLabels = {};
    for (let i = 1; i <= newGroupNb; i++) {
      newGroupLabels[`group${i}`] = groupLabels[`group${i}`] || "";
    }
    setGroupLabels(newGroupLabels);
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
  };

  const updateCode = async ({ code, newJsonObject }) => {
    const updatedConnectSelectorsCode = connectSelectorsCode.replace('dashboardJSON', JSON.stringify(newJsonObject));
    await pyodide.runPythonAsync(updatedConnectSelectorsCode);
    await pyodide.runPythonAsync(code);
    if (runCode) {
      runCode({ code }); // Trigger the runCode function passed from StateManager
    }
  };

  const copyToClipboard = () => {
    const { dependentVariable, independentVariable, ivConditions } = selectors;
    let textContent = `I predict that the ${dependentVariable || 'dependent variable'} will vary across the ${ivConditions || 'number of'} conditions of the ${independentVariable || 'independent variable'} as follows:\n`;
  
    for (let i = 1; i <= groupNb; i++) {
      const condition = selectors[`condition${i}`] || `condition ${i}`;
      const rank = selectors[`group${i}`] || 0;
      textContent += `- ${condition} will occupy rank #${rank}\n`;
    }
  
    navigator.clipboard.writeText(textContent).then(() => {
      alert('Text copied to clipboard: ' + textContent);
      console.log('Text copied to clipboard: ' + textContent);
    }).catch(err => {
      console.error('Error copying text: ', err);
    });
  };
  
  const copyAiToClipboard = () => {

    // UNFINISHED ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    if (selectors?.hypothesisPrompt === "") { 
      return alert("Please describe your hypothesis first");
    }
    
    // get the data from the selector
    const { dependentVariable, independentVariable, ivConditions } = selectors;


    let textContent = `I` // fill with the retun of the ai func
  
    navigator.clipboard.writeText(textContent).then(() => {
      alert('AI-reformulated hypothesis copied to clipboard: ' + textContent);
      console.log('Text copied to clipboard: ' + textContent);
    }).catch(err => {
      console.error('Error copying text: ', err);
    });
  };

  const copyFigToClipboard = async () => {
    try {
      const variableValue = await pyodide.runPythonAsync("fig_html");
      await navigator.clipboard.writeText(variableValue);
      alert("Copied to clipboard!");
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

  const handleIvConditionsChange = (e) => {
    handleContentChange({ newContent: { selectors: { ...selectors, ivConditions: e.target.value }, }, });
    handleGroupNbChange(e);
  };

  useEffect(() => {  
    const newJsonObject = { ...selectors };
    setJsonObject(newJsonObject);
    updateCode({ code, newJsonObject });
  }, [selectors]);

  return (
    <div className="graph-dashboard">
      <div className="header">
        <img src={`/assets/icons/visualize/hypVis_expeAnalysis.svg`} />
        <div className="header-title">Experimental Hypothesis</div>
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
        <div className="header-title">Your experimental hypothesis</div>
        <Popup 
          content={
            <div>
              <><strong>To build your experimental hypothesis, follow these steps:</strong></>
              <ol>
                <li>Name your IV and DV</li>
                <li>State how many conditions your IV has</li>
                <li>Predict the DV values for each condition of the IV</li>
              </ol>
            </div>
          } 
          trigger={<img src={`/assets/icons/visualize/question_mark.svg`} />} 
          inverted
          style={popupStyle}
        />
      </div>
      <div className="text-input">
        <label htmlFor="dependentVariable" className="header-text">What is the name of your Dependent Variable (DV)?</label>
        <input
          className="input-box"
          placeholder="Dependent variable"
          id={`dependentVariable-${sectionId}`}
          type="text"
          name="dependentVariable"
          value={selectors.dependentVariable || ""}
          onChange={({ target }) => handleContentChange({ newContent: { selectors: { ...selectors, dependentVariable: target.value }, }, }) }
          />
        </div> 
        <div className="text-input">
          <label htmlFor="independentVariable" className="header-text">What is the name of your Independent Variable (IV)?</label>
          <input
            className="input-box"
            placeholder="Independent variable"
            id={`independentVariable-${sectionId}`}
            type="text"
            name="independentVariable"
            value={selectors.independentVariable || ""}
            onChange={({ target }) => handleContentChange({ newContent: { selectors: { ...selectors, independentVariable: target.value }, }, }) }
            />
        </div>
        <div className="text-input">
          <label htmlFor="ivConditions" className="header-text">How many conditions does your Independent Variable (IV) have?</label>
          <input
            className="input-box-number"
            placeholder="2"
            id={`ivConditions-${sectionId}`}
            type="number"
            name="ivConditions"
            value={selectors.ivConditions || ""}
            min="2"
            max="10"
            onChange={handleIvConditionsChange}
            />
        </div>
      </div>
      <div className="parameter-panel">
        <div className="header">
        <div className="header-title">Rank your conditions</div>
        <Popup 
          content={
            <div>
              <><strong>If you have three condition:</strong></>
              <ol>
                <li>Name each of the condition using the dropdown (you can type in!)</li>
                <li>Use the slider on the right side of the label to indicate the expected rank of the DV in this condition compared to the rest</li>
              </ol>
            </div>
          }
          trigger={<img src={`/assets/icons/visualize/question_mark.svg`} />} 
          inverted
          style={popupStyle}
        />
      </div>
      <div className="ranks-grid-l1">
        {Array.from({ length: groupNb }, (_, i) => (
          <div key={i} className="fill-in-ranks">
            <label>
              I predict that 
            </label>
            <AggregateVarSelector
              placeholder={selectors[`condition${i + 1}`] || `condition ${i + 1}`}
              isDirectionality={false}
              allowAdditions={true}
              value={selectors[`condition${i + 1}`] || ""}
              onChange={(e, { value }) => handleAggregateVarChange(`condition${i + 1}`, value)}
              // study={study}
            />
            <>will occupy rank #</>
            <div className="fill-in-ranks">
              <div>{selectors[`group${i + 1}`] || 0}/{groupNb}</div>
              <input
                type='range'
                min={0}
                max={groupNb}
                value={selectors[`group${i + 1}`] || 0}
                onChange={(e) => handleRatingChange(e, `group${i + 1}`)}
                color="{ backgroundColor: 'red' }"
               />
              <br />
            </div>
          </div>
        ))}
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
        {(
          // user?.permissions?.map((p) => p?.name).includes("MENTOR") ||
          // user?.permissions?.map((p) => p?.name).includes("TEACHER") ||
          user?.permissions?.map((p) => p?.name).includes("ADMIN")
        ) && (
            // .includes("STUDENT")) && ( //// will include students later

              <div className="clipboard-AI-copy-button" onClick={copyAiToClipboard}>
                <div>🏗️ Copy AI-formulated hypothesis text to clipboard 🚧</div>
                <img src={`/assets/icons/visualize/clipboard-copy.svg`} />
              </div>
        )}    
      </div>
    </div>
   </div>
  );
}

//TODO: Add a button to copy the AI generated hypothesis to the clipboard
//TODO: Add aggregate variables from study builder to the dropdowns