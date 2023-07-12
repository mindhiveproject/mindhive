import { Icon } from "semantic-ui-react";
import uniqid from "uniqid";

import { StyledTaskCard } from "../../../../../styles/StyledCard";

import { NodesTypesContainer } from "../../Diagram/nodes-types-container/NodesTypesContainer";
import { NodeTypeLabel } from "../../Diagram/node-type-label/NodeTypeLabel";

export default function Card({ component, addFunctions, setComponentId }) {
  return (
    <>
      <StyledTaskCard taskType={component?.taskType}>
        <div className="addBlock">
          <Icon
            name="plus circle"
            size="big"
            color="grey"
            link
            onClick={() => {
              addFunctions?.addComponentToCanvas({
                name: component?.title,
                details: component?.description,
                componentID: component?.id,
                testId: uniqid.time(),
                taskType: component?.taskType,
                subtitle: component?.subtitle,
              });
            }}
          />
        </div>

        <div className="movableCard">
          <NodesTypesContainer>
            <NodeTypeLabel
              model={{
                type: "component",
                ports: "in",
                name: component?.title,
                details: component?.description,
                componentID: component.id,
                taskType: component?.taskType,
                subtitle: component?.subtitle,
              }}
              name={component?.title}
            ></NodeTypeLabel>
          </NodesTypesContainer>
        </div>
        <div className="icons">
          <div className="icon" onClick={() => setComponentId(component?.id)}>
            <img src="/assets/icons/info.svg" />
          </div>

          {!component.link && (
            <div className="icon" onClick={(e) => this.togglePreview(e, false)}>
              <img src="/assets/icons/preview.svg" />
            </div>
          )}

          {component.link && (
            <a target="_blank" href={component.link} rel="noreferrer">
              <div className="icon">
                <img src="/assets/icons/preview.svg" />
              </div>
            </a>
          )}
        </div>
      </StyledTaskCard>
    </>
  );
}
