import React, { useState } from "react";
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
  const [selectedDataFormat, setSelectedDataFormat] = useState(
    selectors["dataType"] || "quant"
  );

  const [activeIndex, setActiveIndex] = useState(-1);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  const resourcesList = [
    {
      title: "What is a table?",
      alt:   "External link",
      img:   "/assets/icons/visualize/openNewTab.svg",
      link:  "https://datavizproject.com/data-type/table-chart/#",
    },
  ]

  const connectSelectorsCode = `
import json
html_output = js.document.getElementById('figure-${sectionId}')

colMultiple = None if js.document.getElementById("colMultiple-${sectionId}") == None else js.document.getElementById("colMultiple-${sectionId}")
colMultiple_json = colMultiple.value.split(",")
columns = colMultiple_json

groupVariable= None if js.document.getElementById("groupVariable-${sectionId}") == None else js.document.getElementById("groupVariable-${sectionId}").value

dataType= None if js.document.getElementById("dataType-${sectionId}") == None else js.document.getElementById("dataType-${sectionId}").value

isQuant = dataType == "quant"
`;
  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const updateCode = async ({ code }) => {
    await pyodide.runPythonAsync(connectSelectorsCode);
    runCode({ code });
  };

  const onSelectorChange = ({ target }) => {
    handleContentChange({
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
    updateCode({ code });
  };

  const onSelectorChoice = (option) => {
    setSelectedDataFormat(option?.value);
    onSelectorChange({ target: { name: "dataType", value: option?.value } });
  };

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
              <img className="resourcesCardImage" src={option.img} alt={option.alt} />
              <div>
                <div className="resourcesCardTitle">{option.title}</div>
                <div className="resourcesCardLink">Click here to access the resource</div>
              </div>
            </a>
          ))}
          </AccordionContent>
        </Accordion>
    </div>
  );
}
