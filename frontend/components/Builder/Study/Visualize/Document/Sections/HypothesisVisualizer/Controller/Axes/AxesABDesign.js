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

  const significanceOptions = [
    { value: "non-significant", text: "No significance" },
    { value: "significant", text: "Significant results" },
  ];

  const resourcesList = [
    {
      title: "What is a Bar Plot?",
      alt: "External link",
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://datavizcatalogue.com/methods/bar_chart.html",
    },
  ];

  const connectSelectorsCode = `
html_output = js.document.getElementById('figure-${sectionId}')
#groupA = js.document.getElementById('groupA-${sectionId}').value
groupA = None if js.document.getElementById("groupA-${sectionId}") == None else js.document.getElementById("groupA-${sectionId}").value

#groupB = js.document.getElementById('groupB-${sectionId}').value
groupB = None if js.document.getElementById("groupB-${sectionId}") == None else js.document.getElementById("groupB-${sectionId}").value

n_samples_element = js.document.getElementById('n_samples-${sectionId}')
n_samples = None if n_samples_element is None or n_samples_element.value == '' else int(n_samples_element.value)

significanceDecision = None if js.document.getElementById("significanceDecision-${sectionId}") == None else js.document.getElementById("significanceDecision-${sectionId}").value

base_mean_element = js.document.getElementById('base_mean-${sectionId}')
base_mean = None if base_mean_element is None or base_mean_element.value == '' else float(base_mean_element.value)

effect_size_element = js.document.getElementById('effect_size-${sectionId}')
effect_size = None if effect_size_element is None or effect_size_element.value == '' else float(effect_size_element.value)
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
        <div>Axes (A-B Design)</div>
      </div>
        <label htmlFor="groupA">Group A</label>
        <input
          id={`groupA-${sectionId}`}
          type="text"
          name="groupA"
          value={selectors.groupA}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, groupA: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
        <label htmlFor="groupB">Group B</label>
        <input
          id={`groupB-${sectionId}`}
          type="text"
          name="groupB"
          value={selectors.groupB}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, groupB: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
        <SelectOne
              sectionId={sectionId}
              options={significanceOptions}
              selectors={selectors}
              onSelectorChange={onSelectorChange}
              title="Significance of hypothesis"
              parameter="significanceDecision"
            />
        <label htmlFor="n_samples">Number of samples</label>
        <input
          id={`n_samples-${sectionId}`}
          type="number"
          name="n_samples"
          value={selectors.n_samples}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, n_samples: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
        <label htmlFor="base_mean">Base mean</label>
        <input
          id={`base_mean-${sectionId}`}
          type="number"
          name="base_mean"
          value={selectors.base_mean}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, base_mean: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
        <label htmlFor="base_mean">Effect size</label>
        <input
          id={`effect_size-${sectionId}`}
          type="number"
          name="effect_size"
          value={selectors.effect_size}
          onChange={({ target }) =>
            handleContentChange({
              newContent: {
                selectors: { ...selectors, effect_size: target.value },
              },
            })
          }
          onBlur={() => updateCode({ code })}
        />
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
