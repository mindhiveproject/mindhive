import React, { useState, useEffect } from "react";
import {
  Dropdown,
  DropdownMenu,
  Icon,
  AccordionTitle,
  AccordionContent,
  Accordion,
} from "semantic-ui-react";

import SelectMultiple from "../Fields/SelectMultiple";
import SelectOne from "../Fields/SelectOne";

export default function Axes({
  variables,
  code,
  pyodide,
  runCode,
  sectionId,
  selectors,
  handleContentChange,
}) {
  // console.log("Axes component rendered");
  // console.log(selectors);
  const [selectedDataFormat, setSelectedDataFormat] = useState(selectors["dataType"] || "quant");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [jsonObject, setJsonObject] = useState(selectors);

  const connectSelectorsCode = `
#html_output = js.document.getElementById('figure-${sectionId}')
#colMultiple = None if js.document.getElementById("colMultiple-${sectionId}") == None else js.document.getElementById("colMultiple-${sectionId}")
#colMultiple_json = colMultiple.value.split(",")
#columns = colMultiple_json
#groupVariable= None if js.document.getElementById("groupVariable-${sectionId}") == None else js.document.getElementById("groupVariable-${sectionId}").value
#dataType= None if js.document.getElementById("dat aType-${sectionId}") == None else js.document.getElementById("dataType-${sectionId}").value
#isQuant = dataType == "quant"

html_output = js.document.getElementById('figure-${sectionId}')
parameters = dict(json.loads('dashboardJSON'))
`;

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

  const onSelectorChange = ({ target }) => {
    handleContentChange({
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
    updateCode({ code });
  };

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  const resourcesList = [
    {
      title: "What is a table?",
      alt: "External link",
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://datavizproject.com/data-type/table-chart/#",
    },
  ];

  const onSelectorChoice = (option) => {
    const newDataFormat = option?.value;
    setSelectedDataFormat(newDataFormat);
  
    // Update selectors and notify parent
    const updatedSelectors = { ...selectors, dataType: newDataFormat };
    handleContentChange({
      newContent: {
        selectors: updatedSelectors,
      },
    });
  
    // Optionally re-run the code to reflect changes in Render
    runCode({ code });
  };

  useEffect(() => {  
    const newJsonObject = { ...selectors };
    setJsonObject(newJsonObject);
    updateCode({ code, newJsonObject });
  }, [selectors]);

  return (
    <div className="selectorsStats">
      <Dropdown
        className="dataTypeSelector"
        icon={
          <div className="menuItemThreeDiv menuButton">
            {selectedDataFormat &&
              (selectedDataFormat === "quant" ? (
                <>
                  <img src="/assets/icons/visualize/tag.svg" alt="Menu Icon" />
                  <div>
                    <a>
                      Data format: <b>Quantitative</b> (click here to change)
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <img
                    src="/assets/icons/visualize/label.svg"
                    alt="Menu Icon"
                  />
                  <div>
                    <a>
                      Data format: <b>Qualitative</b> (click here to change)
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
              key: "quant",
              value: "quant",
              title: "Switch to Quantitative Data",
              description:
                "Quantitative data is represented in a column filled with numerical values. For example, the age of the participant or their score in a survey.",
              img: "/assets/icons/visualize/dataStructWide.svg",
              link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
            },
            {
              key: "qual",
              value: "qual",
              title: "Switch to Qualitative Data",
              description:
                "Qualitative data is represented in a column filled with labels. For example, which experimental condition a subject belongs to, or their answer to a multiple choice question.",
              img: "/assets/icons/visualize/dataTypeQual.svg",
              link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
            },
          ]
            .filter((option) => option.value !== selectedDataFormat)
            .map((option) => (
              <div
                key={option.key}
                className="menuItemDataType menuButton"
                onClick={() => onSelectorChoice(option)}
              >
                <h3>{option.title}</h3>
                <img src={option.img} alt={option.title} />
                <p>{option.description}</p>
                <div className="slidesCard">
                  <img
                    src={`/assets/icons/visualize/googleSlides.svg`}
                    alt="Google Slides"
                  />
                  <a
                    href={option.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Click here to see the lecture slides
                  </a>
                </div>
              </div>
            ))}
        </DropdownMenu>
      </Dropdown>
      <SelectMultiple
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        parameter="colMultiple"
        selectedDataFormat={selectedDataFormat}
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Grouping variable"
        parameter="groupVariable"
      />
      <input
        type="hidden"
        id={`dataType-${sectionId}`}
        value={selectedDataFormat}
      />
      <Accordion>
        <AccordionTitle
          active={activeIndex === 0}
          index={0}
          onClick={handleClick}
        >
          <Icon name="dropdown" />
          Resources
        </AccordionTitle>
        <AccordionContent active={activeIndex === 0}>
          {resourcesList.map((option) => (
            <a
              className="resourcesCard"
              href={option.link}
              target="_blank"
              rel="noopener noreferrer"
              key={option.link}
            >
              <img
                className="resourcesCardImage"
                src={option.img}
                alt={option.alt}
              />
              <div>
                <div className="resourcesCardTitle">{option.title}</div>
                <div className="resourcesCardLink">
                  Click here to access the resource
                </div>
              </div>
            </a>
          ))}
        </AccordionContent>
      </Accordion>
    </div>
  );
}
