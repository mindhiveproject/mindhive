import { useState } from "react";
import {
  Icon,
  AccordionTitle,
  AccordionContent,
  Accordion,
} from "semantic-ui-react";
import SelectOne from "../Fields/SelectOne";
import ToggleOne from "../Fields/ToggleOne";

export default function AxesScatterPlot({
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

  const options = [
    ...variables.map((variable) => ({
      key: variable?.field,
      value: variable?.displayName || variable?.field,
      text: variable?.displayName || variable?.field,
    })),
  ];

  const resourcesList = [
    {
      title: "Scatter Plot",
      alt: "External link to trendline resource",
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "",
    },
    {
      title: "Trendline",
      alt: "External link to trendline resource",
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://www.storytellingwithdata.com/blog/2020/10/20/thoughts-on-trendlines#:~:text=A%20trendline%20is%20a%20line,data%20(e.g.%20regression%20analysis)",
    },
  ];

  const onSelectorChange = ({ target }) => {
    onChange({
      componentId: sectionId,
      newContent: {
        selectors: { ...selectors, [target?.name]: target?.value },
      },
    });
  };

  return (
    <div className="selectors">
      <div className="header">
        <img src={`/assets/icons/visualize/axes.svg`} />
        <div>Axes</div>
      </div>
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="X-Axis"
        parameter="xVariable"
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Y-Axis"
        parameter="yVariable"
      />
      <SelectOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Group"
        parameter="groupVariable"
      />
      <ToggleOne
        sectionId={sectionId}
        options={options}
        selectors={selectors}
        onSelectorChange={onSelectorChange}
        title="Trend line"
        parameter="trendLine"
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
