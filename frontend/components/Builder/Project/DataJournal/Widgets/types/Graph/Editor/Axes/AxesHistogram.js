import { useState } from "react";
import {
  Icon,
  AccordionTitle,
  AccordionContent,
  Accordion,
} from "semantic-ui-react";

import SelectMultiple from "../Fields/SelectMultiple";
import SelectOne from "../Fields/SelectOne";

export default function AxesHistogram({
  variables,
  sectionId,
  selectors,
  onChange,
}) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  const marginalPlotsOptions = [
    { value: "", text: "None" },
    { value: "rug", text: "Rug plot" },
    { value: "box", text: "Box plot" },
  ];

  const resourcesList = [
    {
      title: "What is a Histogram?",
      alt: "External link",
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://datavizcatalogue.com/methods/histogram.html",
    },
  ];

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.displayName || variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const onSelectorChange = ({ target }) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [target.name]: target.value },
      },
    });
  };

  return (
    <div className="selectors">
      <div className="header">
        <img src={`/assets/icons/visualize/axes.svg`} alt="Axes" />
        <div>Axes</div>
      </div>

      <SelectMultiple
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Column(s) to observe"
        parameter="X"
      />

      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Group by (optional – color by category)"
        parameter="Group"
      />

      <SelectOne
        sectionId={sectionId}
        options={marginalPlotsOptions}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Marginal plot"
        parameter="marginalPlot"
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
