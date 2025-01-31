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
  const [selectedDataFormat, setSelectedDataFormat] = useState(
    selectors["dataFormat"] || "long"
  );

  const [activeIndex, setActiveIndex] = useState(-1);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  const correlationOptions = [
    { value: "No correlation", text: "No correlation" },
    { value: "positive", text: "Positive correlation" },
    { value: "negative", text: "Negative correlation" },
  ];

  const resourcesList = [
    {
      title: "What is a Bar Plot?",
      alt: "External link",
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://datavizcatalogue.com/methods/bar_chart.html",
    },
    {
      title: "More about the Standard Error",
      alt: "External link",
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://www.scribbr.com/statistics/standard-error/",
    },
    {
      title: "Confidence Intervales, what are they?",
      alt: "External link",
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://www.scribbr.com/statistics/confidence-interval/",
    },
  ];

  const connectSelectorsCode = `
html_output = js.document.getElementById('figure-${sectionId}')
xaxis = js.document.getElementById('xaxis-${sectionId}').value
yaxis = js.document.getElementById('yaxis-${sectionId}').value


n_points_element = js.document.getElementById('n_points-${sectionId}')
n_points = None if n_points_element is None or n_points_element.value == '' else int(n_points_element.value)
noise_level_element = js.document.getElementById('noise_level-${sectionId}')
noise_level = None if noise_level_element is None or noise_level_element.value == '' else float(noise_level_element.value)

correlationHyp = None if js.document.getElementById("correlation_type-${sectionId}") == None else js.document.getElementById("correlation_type-${sectionId}").value

`;

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.displayName || variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const updateCode = async ({ code }) => {
    await pyodide.runPythonAsync(connectSelectorsCode);
    runCode({ code });
  };

  const onSelectorChoice = (option) => {
    setSelectedDataFormat(option.value);
    onSelectorChange({ target: { name: "dataFormat", value: option?.value } });
  };

  const onSelectorChange = ({ target }) => {
    handleContentChange({
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
    updateCode({ code });
  };

  return (
    <div className="graphDashboard">
      <div className="header">
        <img src={`/assets/icons/visualize/axes.svg`} />
        <div>Axes</div>
      </div>
      <div>
        <label htmlFor="xaxis">X Axis</label>
        <input
          id={`xaxis-${sectionId}`}
          type="text"
          name="xaxis"
          value={selectors.xaxis}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, xaxis: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
        <label htmlFor="yaxis">Y Axis</label>
        <input
          id={`yaxis-${sectionId}`}
          type="text"
          name="yaxis"
          value={selectors.yaxis}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, yaxis: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
        <label htmlFor="n_points">Sample</label>
        <input
          id={`n_points-${sectionId}`}
          type="number"
          name="n_points"
          value={selectors.n_points}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, n_points: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
        <label htmlFor="noise_level">Noise level (0 - 1)</label>
        <input
          id={`noise_level-${sectionId}`}
          type="number"
          min="0" max="1" step="0.01" 
          name="noise_level"
          value={selectors.noise_level}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, noise_level: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
        <SelectOne
            sectionId={sectionId}
            options={correlationOptions}
            selectors={selectors}
            onSelectorChange={onSelectorChange}
            title="Expected correlation"
            parameter="correlation_type"
          />
        </div>
      <input
        type="hidden"
        id={`dataFormat-${sectionId}`}
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
