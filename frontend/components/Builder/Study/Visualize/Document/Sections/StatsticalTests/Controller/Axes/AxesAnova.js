import React, { useState } from "react";
import { Dropdown, DropdownMenu } from "semantic-ui-react";

import SelectMultiple from "../Fields/SelectMultiple";
import SelectOne from "../Fields/SelectOne";

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

  const [selectedOption, setSelectedOption] = useState(null);

  const connectSelectorsCodeWide = `
import json
plot_output = js.document.getElementById('figure-${sectionId}')

Xmultiple = None if js.document.getElementById("colToAnalyse-${sectionId}") == None else js.document.getElementById("colToAnalyse-${sectionId}")
xMultiple_value_json = json.loads(Xmultiple.value)
columns = xMultiple_value_json

isWide = True

#x_labels= columns ######################################need update################ To change to list under x axis
`;
const connectSelectorsCodeLong = `
plot_output = js.document.getElementById('figure-${sectionId}')

qualCol  = None if js.document.getElementById("qualCol-${sectionId}") == None else js.document.getElementById("qualCol-${sectionId}").value
quantCol = None if js.document.getElementById("quantCol-${sectionId}") == None else js.document.getElementById("quantCol-${sectionId}").value

isWide = False

#x_labels= columns ######################################need update################ To change to list under x axis
`;

const options = variables.map((variable) => ({
  key: variable?.field,
  value: variable?.field,
  text: variable?.displayName || variable?.field,
}));

const updateCode = async ({ code }) => {
  if (selectedOption === "wide") {
    await pyodide.runPythonAsync(connectSelectorsCodeWide);
  } else if (selectedOption === "long") {
    await pyodide.runPythonAsync(connectSelectorsCodeLong);
  }
  runCode({ code });
};


const onSelectorChoice = (option) => {
  setSelectedOption(option.value);
};

const onSelectorChange = ({ target }) => {
  const value = Array.isArray(target?.value) ? target?.value : [target?.value];
  handleContentChange({
    newContent: {
      selectors: { ...selectors, [target?.name]: value },
    },
  });
  updateCode({ code });
};

return (
  <div className="selectorsStatTest">
  <Dropdown 
  className="dropdownMenu"
    icon={
      <div className="menuItemThreeDiv menuButton">
        <img src={`/assets/icons/visualize/database_selected.svg`} />
        <div>
          {selectedOption ? (
            <a><b>Click here</b> to change your choice.</a>
          ) : (
            <a><b>Click here</b> to select how the data for this plot is structured.</a>
          )}
        </div>

        <div></div>
        {selectedOption && (
          selectedOption === "long" ? (
            <div>
              You selected a <b>{selectedOption}</b>-data format dashboard
            </div>
            ) : (
              <div>
                You selected a <b>{selectedOption}</b>-data format dashboard
              </div>
              )
          )
        }
      </div>
    }
  >
  <DropdownMenu>
    {[
      { 
        key: 'long', 
        value: 'long', 
        title: "Long Data Format", 
        description: "Data organized with each observation (like a student's test score) appearing on its own row, often with a column indicating categories (like subjects). This format is useful for detailed analysis across categories.", 
        img: '/assets/icons/visualize/dataStructLong.svg'
      },
      { 
        key: 'wide', 
        value: 'wide', 
        title: "Wide Data Format", 
        description: "Data organized with each category (like subjects) appearing as its own column, often with rows representing observations (like students). This format is simpler for quick comparisons within categories.", 
        img: '/assets/icons/visualize/dataStructWide.svg'
      }
    ].map((option) => (
      <div
        key={option.key}
        className="menuItemDataStruct menuButton"
        onClick={() => onSelectorChoice(option)}
      >
        <img src={option.img} alt={option.title} />
        <div>
          <h3>{option.title}</h3>
          <p>{option.description}</p>
        </div>
      </div>
    ))}
  </DropdownMenu>

  </Dropdown>

  {selectedOption && (
    selectedOption === "long" ? (

      <div className="selectors">
        <SelectOne
          sectionId={sectionId}
          options={options}
          selectors={selectors}
          onSelectorChange={onSelectorChange}
          title="Qualitative Column"
          parameter="qualCol"
        />
        <SelectOne
          sectionId={sectionId}
          options={options}
          selectors={selectors}
          onSelectorChange={onSelectorChange}
          title="Quantitative Column"
          parameter="quantCol"
        />
      </div>

    ) : (
      <SelectMultiple
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Column(s) to include in ANOVA"
        parameter="colToAnalyse"
      />
    )
  )}
</div>
);
}