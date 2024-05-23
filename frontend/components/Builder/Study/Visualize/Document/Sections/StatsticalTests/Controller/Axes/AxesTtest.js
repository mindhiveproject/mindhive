import React, { useState } from "react";
import { 
  Dropdown, 
  DropdownMenu,
  Icon,
  AccordionTitle,
  AccordionContent,
  Accordion,
} from "semantic-ui-react";

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

  const [activeIndex, setActiveIndex] = useState(-1);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  const connectSelectorsCodeWide = `
import json
html_output = js.document.getElementById('figure-${sectionId}')

col1 = None if js.document.getElementById("col1-${sectionId}") == None else js.document.getElementById("col1-${sectionId}").value
col2 = None if js.document.getElementById("col2-${sectionId}") == None else js.document.getElementById("col2-${sectionId}").value

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

  const resourcesList = [
    {
      title: "Independent samples t-test",
      alt:   "External link",
      img:   "/assets/icons/visualize/externalNewTab.svg",
      link:  "https://www.scribbr.com/statistics/t-test/",
    },
  ]

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
        icon={
          <div className="dataFormatSelector">
            {selectedOption &&
              (selectedOption === "wide" ? (
                <>
                  <img
                    src="/assets/icons/visualize/more_vert.svg"
                    alt="Menu Icon"
                    />
                  <div>
                    <div>
                      <a>
                        <b>Currently performing:</b> T-Test <b>between</b> two
                        columns.
                      </a>
                    </div>
                    <div></div>
                    <div>
                      <a>(Click here to use a label column to group your rows)</a>
                    </div>
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
                      <b>Currently performing:</b> T-Test on a column containing
                      values using a grouping column containing labels for each
                      row
                    </a>
                  </div>
                  <div></div>
                  <div>
                    <a>
                      (Click here if you want to switch to comparing values in
                      two different columns)
                    </a>
                  </div>
                </>
              ))}
          </div>
        }
      >
        <DropdownMenu
        className="customDropdownMenu">
          {[
            {
              key: "wide",
              value: "wide",
              title: "Switch to performing a T-Test between two columns",
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
                className="menuItemDataType"
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
            <SelectOne
              sectionId={sectionId}
              options={options}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title="1st column"
              parameter="col1"
            />
            <SelectOne
              sectionId={sectionId}
              options={options}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title="2nd column"
              parameter="col2"
            />
          </div>
        ))
      }
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
        {resourcesList
          .map((option) => (
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
          ))
        }

        </AccordionContent>
      </Accordion>
    </div>
  );
}
