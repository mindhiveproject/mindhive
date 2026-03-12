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

export default function AxesAnova({
  variables,
  sectionId,
  selectors,
  onChange,
}) {
  const [selectedDataFormat, setSelectedDataFormat] = useState(
    selectors["dataFormat"] || "long",
  );

  const [activeIndex, setActiveIndex] = useState(-1);

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const newIndex = activeIndex === index ? -1 : index;
    setActiveIndex(newIndex);
  };

  const resourcesList = [
    {
      title: "What is a One-way ANOVA?",
      alt: "External link",
      img: "/assets/icons/visualize/externalNewTab.svg",
      link: "https://www.scribbr.com/statistics/one-way-anova/",
    },
  ];

  const options = variables.map((variable) => ({
    key: variable?.field,
    value: variable?.field,
    text: variable?.displayName || variable?.field,
  }));

  const onSelectorChoice = (option) => {
    setSelectedDataFormat(option.value);
    onSelectorChange({ target: { name: "dataFormat", value: option?.value } });
  };

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
      <Dropdown
        icon={
          <div className="dataFormatSelector">
            {selectedDataFormat &&
              (selectedDataFormat === "wide" ? (
                <>
                  <img
                    src="/assets/icons/visualize/more_vert.svg"
                    alt="Menu Icon"
                  />
                  <div>
                    <div>
                      <a>
                        <b>Currently performing:</b> One-Way ANOVA{" "}
                        <b>between</b> three or more columns.
                      </a>
                    </div>
                    <div></div>
                    <div>
                      <a>
                        (Click here to use a label column to group each rows per
                        unique label)
                      </a>
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
        <DropdownMenu className="customDropdownMenu">
          {[
            {
              key: "wide",
              value: "wide",
              title:
                "Switch to performing a One-Way Anova between three or more columns",
              description:
                "In the example above, we would select the columns c1, c2, and c3 to perform a One-Way Anova on them.",
              img: "/assets/icons/visualize/dataOneWayAnova.svg",
              link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
            },
            {
              key: "long",
              value: "long",
              title:
                "Switch to using a label column to sort rows of a value column",
              description:
                "In the example above, we would select the column 'attrib' as a grouping column. This grouping is performed on the 'value' column which contains values for the conditions c1, c2, and c3.",
              img: "/assets/icons/visualize/dataAnovaLong.svg",
              link: "https://docs.google.com/presentation/d/1II5OqHmhYO_si-_bgcJrocQZFXjFb6c4gi8wcTN86ZQ/edit?usp=sharing",
            },
          ]
            .filter((option) => option.value !== selectedDataFormat)
            .map((option) => (
              <div className="customDropdownMenu">
                <div
                  key={option.key}
                  className="menuItemDataType"
                  onClick={() => onSelectorChoice(option)}
                >
                  <h3>{option.title}</h3>
                  <img src={option.img} alt={option.title} />
                  <p>{option.description}</p>
                </div>
              </div>
            ))}
        </DropdownMenu>
      </Dropdown>
      {selectedDataFormat &&
        (selectedDataFormat == "long" ? (
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
