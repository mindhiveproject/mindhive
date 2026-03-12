import React, { useState } from "react";
import {
  Icon,
  AccordionTitle,
  AccordionContent,
  Accordion,
} from "semantic-ui-react";

import SelectOne from "../Fields/SelectOne";

export default function AxesPearsonCorr({
  variables,
  sectionId,
  selectors,
  onChange,
}) {
  const [selectedDataFormat, setSelectedDataFormat] = useState("wide");
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  const resourcesList = [
    {
      title: "What's a Pearson's correlation",
      alt: "External link",
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://www.scribbr.com/statistics/pearson-correlation-coefficient/",
    },
  ];

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const onSelectorChange = ({ target }) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
  };

  return (
    <div className="selectorsStats">
      <div className="selectorsTestStats">
        <SelectOne
          sectionId={sectionId}
          options={options}
          selectors={selectors}
          onSelectorChange={onSelectorChange}
          title="Predictor Column"
          parameter="col1"
        />
        <SelectOne
          sectionId={sectionId}
          options={options}
          selectors={selectors}
          onSelectorChange={onSelectorChange}
          title="Predicted Column"
          parameter="col2"
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
