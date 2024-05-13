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
  const [selectedOption, setSelectedOption] = useState("long");

  const connectSelectorsCodeWide = `
import json
html_output = js.document.getElementById('figure-${sectionId}')

columns = None
Xmultiple = None if js.document.getElementById("colToAnalyse-${sectionId}") == None else js.document.getElementById("colToAnalyse-${sectionId}")
xMultiple_value_json = json.loads(Xmultiple.value)
columns = xMultiple_value_json

isWide = True

#x_labels= columns ######################################need update################ To change to list under x axis
`;
  const connectSelectorsCodeLong = `
html_output = js.document.getElementById('figure-${sectionId}')

quantCol = None if js.document.getElementById("valCol-${sectionId}") == None else js.document.getElementById("valCol-${sectionId}").value
groupcol = None if js.document.getElementById("groupcol-${sectionId}") == None else js.document.getElementById("groupcol-${sectionId}").value

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
    const value = Array.isArray(target?.value)
      ? target?.value
      : [target?.value];
    handleContentChange({
      newContent: {
        selectors: { ...selectors, [target?.name]: value },
      },
    });
    updateCode({ code });
  };

  return (
    <div className="selectorsStats">
      <Dropdown
        className="dataFormatSelector"
        icon={
          <div className="menuItemThreeDiv menuButton">
            {selectedOption &&
              (selectedOption === "wide" ? (
                <>
                  <img
                    src="/assets/icons/visualize/more_vert.svg"
                    alt="Menu Icon"
                  />
                  <div>
                    <a>
                      <b>Currently performing:</b> One-Way ANOVA <b>between</b>{" "}
                      three or more columns.
                    </a>
                  </div>
                  <div></div>
                  <div>
                    <a>
                      (Click here to use a label column to group each rows per
                      unique label)
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <img
                    src="/assets/icons/visualize/more_vert.svg"
                    alt="Menu Icon"
                  />
                  <div>
                    <a>
                      <b>Currently performing:</b> One-Way ANOVA on a column
                      containing values using a grouping column containing the
                      group's labels on each row
                    </a>
                  </div>
                  <div></div>
                  <div>
                    <a>
                      (Click here if you want to switch to comparing values in
                      different columns)
                    </a>
                  </div>
                </>
              ))}
          </div>
        }
      >
        <DropdownMenu>
          {[
            {
              key: "wide",
              value: "wide",
              title: "Switch to performing a One-Way Anova between three or more columns",
              description:
                "In the example above, we would select the columns c1 and c2 to perform a t-test on them.",
              img: "/assets/icons/visualize/dataTtest.svg",
              link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
            },
            {
              key: "long",
              value: "long",
              title:
                "Switch to using a label column to sort rows of a value column",
              description:
                "In the example above, we would select the column 'attrib' as a grouping column. This grouping is performed on the 'value' column which contains values for both conditions",
              img: "/assets/icons/visualize/dataTtestLong.svg",
              link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
            },
          ]
            .filter((option) => option.value !== selectedOption)
            .map((option) => (
              <div
                key={option.key}
                className="menuItemDataType menuButton"
                onClick={() => onSelectorChoice(option)}
              >
                <h3>{option.title}</h3>
                <img src={option.img} alt={option.title} />
                <p>{option.description}</p>
                {/* <div className="slidesCard">
          <img src={`/assets/icons/visualize/googleSlides.svg`} alt="Google Slides" />
          <a href={option.link} target="_blank" rel="noopener noreferrer">
            Click here to see the lecture slides
          </a>
        </div> */}
              </div>
            ))}
        </DropdownMenu>
      </Dropdown>
      {selectedOption &&
        (selectedOption == "long" ? (
          <div className="selectorsTestStats">
            <SelectOne
              sectionId={sectionId}
              options={options}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title="Quantitative Column"
              parameter="valCol"
            />
            <SelectOne
              sectionId={sectionId}
              options={options}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title="Grouping Column"
              parameter="groupcol"
            />
          </div>
        ) : (
          <div className="selectorsTestStats">
            <SelectMultiple
              sectionId={sectionId}
              options={options}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title="Column(s) to include in ANOVA"
              parameter="colToAnalyse"
            />
          </div>
        ))}
    </div>
  );
}
