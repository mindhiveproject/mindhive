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

  const errBarsOptions = [
    // { value: "", text: "" },
    { value: "stdErr", text: "Standard error" },
    { value: "95pi", text: "95% confidence interval" },
    { value: "99pi", text: "99% confidence interval" },
  ];

  const resourcesList = [
    {
      title: "What is a Bar Plot?",
      alt:   "External link",
      img:   "/assets/icons/visualize/openNewTab.svg",
      link:  "https://datavizcatalogue.com/methods/bar_chart.html",
    },
    {
      title: "More about the Standard Error",
      alt:   "External link",
      img:   "/assets/icons/visualize/openNewTab.svg",
      link:  "https://www.scribbr.com/statistics/standard-error/",
    },
    {
      title: "Confidence Intervales, what are they?",
      alt:   "External link",
      img:   "/assets/icons/visualize/openNewTab.svg",
      link:  "https://www.scribbr.com/statistics/confidence-interval/",
    },
  ]

  const connectSelectorsCodeWide = `
import json
html_output = js.document.getElementById('figure-${sectionId}')

errBar  = None if js.document.getElementById("errBar-${sectionId}") == None else js.document.getElementById("errBar-${sectionId}").value
Xmultiple = None if js.document.getElementById("colToPlot-${sectionId}") == None else js.document.getElementById("colToPlot-${sectionId}")
xMultiple_value_json = json.loads(Xmultiple.value)
columns = xMultiple_value_json

isWide = True

#x_labels= columns ######################################need update################ To change to list under x axis
`;
  const connectSelectorsCodeLong = `
html_output = js.document.getElementById('figure-${sectionId}')

errBar  = None if js.document.getElementById("errBar-${sectionId}") == None else js.document.getElementById("errBar-${sectionId}").value
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
    <div className="selectors">
      <div className="header">
        <img src={`/assets/icons/visualize/axes.svg`} />
        <div>Axes</div>
      </div>
      <Dropdown
        className="dropdownMenu"
        icon={
          <div className="menuItemThreeDiv menuButton">
            <img src={`/assets/icons/visualize/more_vert.svg`} />
            <div>
              {selectedOption &&
                (selectedOption === "long" ? (
                  <a>
                    If you want to <b>compare columns</b> click here
                  </a>
                ) : (
                  <a>
                    {" "}
                    If you want to{" "}
                    <b>compare different groups for one column</b> (variable),
                    click here.
                  </a>
                ))}
            </div>
          </div>
        }
      >
        <DropdownMenu>
          {[
            {
              key: "long",
              value: "long",
              title: "Long Data Format",
              description:
                "Data organized with each observation (like a student's test score) appearing on its own row, often with a column indicating categories (like subjects). This format is useful for detailed analysis across categories.",
              img: "/assets/icons/visualize/dataStructLongDetailed.svg",
              link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
            },
            {
              key: "wide",
              value: "wide",
              title: "Wide Data Format",
              description:
                "Data organized with each category (like subjects) appearing as its own column, often with rows representing observations (like students). This format is simpler for quick comparisons within categories.",
              img: "/assets/icons/visualize/dataStructWideDetailed.svg",
              link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
            },
          ]
            .filter((option) => option.value !== selectedOption)
            .map((option) => (
              <div
                key={option.key}
                className="menuItemDataStruct menuButton"
                onClick={() => onSelectorChoice(option)}
              >
                {/* <h3>{option.title}</h3> */}
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

      {selectedOption &&
        (selectedOption === "long" ? (
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
            <SelectOne
              sectionId={sectionId}
              options={errBarsOptions}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title="Error bar"
              parameter="errBar"
            />
          </div>
        ) : (
          <div className="selectors">
            <SelectMultiple
              sectionId={sectionId}
              options={options}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title="Column(s) to plot"
              parameter="colToPlot"
            />
            <SelectOne
              sectionId={sectionId}
              options={errBarsOptions}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title="Error Bar"
              parameter="errBar"
            />
          </div>
        ))}
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
