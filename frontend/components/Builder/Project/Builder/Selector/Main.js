import { useState } from "react";
import { Dropdown, Accordion, Icon } from "semantic-ui-react";
import debounce from "lodash.debounce";
import ReactHtmlParser from "react-html-parser";

import { NodesTypesContainer } from "../Diagram/nodes-types-container/NodesTypesContainer";
import { NodeTypeLabel } from "../Diagram/node-type-label/NodeTypeLabel";

import Blocks from "./Blocks/Main";
import StudyTemplates from "./Templates/Main";
import { StyledCard } from "../../../../styles/StyledBuilder";

const components = [
  {
    index: 0,
    componentType: "BLOCK",
    title: "Basic Blocks",
    description: `
      Want to include <strong>custom instructions</strong> to your
      participants or <strong>embed a link and/or video</strong> in
      your study’s procedure? Select and edit a basic block`,
  },
  {
    index: 1,
    componentType: "TASK",
    title: "Tasks",
    description: `
      Want to <strong>measure a construct or variable</strong> by having
      participants <strong>complete an activity</strong>? Choose from
      this bank of validated tasks`,
  },
  {
    index: 2,
    componentType: "SURVEY",
    title: "Surveys",
    description: `
      Want to <strong> measure participants’ attitudes, experiences, or opinions
      </strong> through <strong>self-report</strong>? Choose from this bank of
      validated surveys`,
  },
];

export default function ComponentSelector({ engine, user, addFunctions }) {
  const [createdBy, setCreatedBy] = useState("anyone");
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState([]);

  const debouncedSearch = debounce((value) => {
    setSearch(value);
  }, 1000);

  const saveToState = (e) => {
    setKeyword(e?.target?.value);
    debouncedSearch(e?.target?.value);
  };

  const handleClick = (e, titleProps) => {
    const { index } = titleProps;
    let newIndex;
    if (activeIndex.includes(index)) {
      newIndex = activeIndex.filter((i) => i !== index);
    } else {
      newIndex = [...activeIndex, index];
    }
    setActiveIndex(newIndex);
  };

  return (
    <div className="editPane">
      <div className="header">
        <input
          type="text"
          name="keyword"
          value={keyword}
          onChange={saveToState}
          placeholder="🔍 Search"
          onFocus={() => {
            engine.getModel().setLocked(true);
          }}
          onBlur={() => {
            engine.getModel().setLocked(false);
          }}
        />

        <Dropdown
          fluid
          selection
          options={[
            {
              key: "anyone",
              text: "Created by anyone",
              value: "anyone",
            },
            {
              key: "me",
              text: "Owned by me",
              value: "me",
            },
            {
              key: "favorite",
              text: "My favorite",
              value: "favorite",
            },
          ]}
          onChange={(event, data) => {
            setCreatedBy(data.value);
          }}
          value={createdBy}
          className="createdByDropdown"
        />
      </div>

      <Accordion exclusive={false} fluid styled className="blocksMenu">
        {components.map((item, num) => (
          <div key={num}>
            <Accordion.Title
              active={activeIndex.includes(item?.index)}
              index={item?.index}
              onClick={handleClick}
            >
              <div className="blocksMenuTitle">
                <h3>{item?.title}</h3>
                <Icon name="dropdown" />
                <p>{ReactHtmlParser(item?.description)}</p>
              </div>
            </Accordion.Title>
            <Accordion.Content active={activeIndex.includes(item?.index)}>
              <Blocks
                user={user}
                createdBy={createdBy}
                search={search}
                componentType={item?.componentType}
                addFunctions={addFunctions}
              />
              {item?.componentType === "SURVEY" && (
                <div className="blocksMenuSurveyBuilder">
                  <p>
                    Cannot find a tools to measure one of you’re study
                    construct? Build your own with the Survey builder and
                    teacher’s help:
                  </p>
                  <Blocks
                    user={user}
                    createdBy={"anyone"}
                    search={search}
                    componentType={"SURVEY"}
                    addFunctions={addFunctions}
                    isSurveyBuilder
                  />
                </div>
              )}
            </Accordion.Content>
          </div>
        ))}
        <Accordion.Title
          active={activeIndex.includes(4)}
          index={4}
          onClick={handleClick}
        >
          <div className="blocksMenuTitle">
            <h3>Study design</h3>
            <Icon name="dropdown" />
            <p>Create between-subjects design</p>
          </div>
        </Accordion.Title>
        <Accordion.Content active={activeIndex.includes(4)}>
          <StyledCard taskType="DESIGN">
            <div className="addBlock">
              <Icon
                name="plus circle"
                size="big"
                color="grey"
                link
                onClick={() => {
                  addFunctions.addDesignToCanvas({
                    name: "Between-subjects design",
                  });
                }}
              />
            </div>

            <div className="movableCard">
              <NodesTypesContainer>
                <NodeTypeLabel
                  model={{
                    type: "design",
                    name: "Between-subjects design",
                  }}
                  name="Between-subjects design"
                ></NodeTypeLabel>
              </NodesTypesContainer>
            </div>
            <div className="icons"></div>
          </StyledCard>
        </Accordion.Content>

        <Accordion.Title
          active={activeIndex.includes(5)}
          index={5}
          onClick={handleClick}
        >
          <div className="blocksMenuTitle">
            <h3>Templates</h3>
            <Icon name="dropdown" />
            <p>
              Don’t want to start from scratch? Select and edit a{" "}
              <strong>pre-made study design</strong> using one of the templates
              in this bank
            </p>
          </div>
        </Accordion.Title>
        <Accordion.Content active={activeIndex.includes(5)}>
          <StudyTemplates
            user={user}
            addFunctions={addFunctions}
            createdBy={createdBy}
            search={search}
          />
        </Accordion.Content>
      </Accordion>
    </div>
  );
}
