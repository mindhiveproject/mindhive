import { useState } from "react";

import uniqid from "uniqid";

import { NodesTypesContainer } from "../../Diagram/nodes-types-container/NodesTypesContainer";
import { NodeTypeLabel } from "../../Diagram/node-type-label/NodeTypeLabel";

import { Icon } from "semantic-ui-react";

import TaskModal from "../Task/Modal";
import ManageFavorite from "../../../../../User/ManageFavorite";

import { StyledCard } from "../../../../../styles/StyledBuilder";

export default function Card({
  user,
  component,
  addFunctions,
  search,
  componentType,
}) {
  const [showModal, setShowModal] = useState(false);

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  return (
    <>
      <StyledCard taskType={component?.taskType}>
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
                descriptionForParticipants: component?.descriptionForParticipants,
                settings: component?.settings,
                resources: component?.resources,
                aggregateVariables: component?.aggregateVariables,
                addInfo: component?.addInfo,
                parameters: component?.parameters,
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
                descriptionForParticipants: component?.descriptionForParticipants,
                settings: component?.settings,
                resources: component?.resources,
                aggregateVariables: component?.aggregateVariables,
                addInfo: component?.addInfo,
                parameters: component?.parameters,
              }}
              name={component?.title}
            ></NodeTypeLabel>
          </NodesTypesContainer>
        </div>
        <div className="icons">
          <ManageFavorite
            user={user}
            search={search}
            componentType={componentType}
            id={component?.id}
          />

          <div className="icon" onClick={() => toggleModal()}>
            <img src="/assets/icons/info.svg" />
          </div>

          {!component.link && (
            <a
              target="_blank"
              href={`/preview/${component?.taskType.toLowerCase()}/${
                component?.id
              }`}
            >
              <div className="icon">
                <img src="/assets/icons/preview.svg" />
              </div>
            </a>
          )}

          {component.link && (
            <a target="_blank" href={component.link} rel="noreferrer">
              <div className="icon">
                <img src="/assets/icons/preview.svg" />
              </div>
            </a>
          )}
        </div>
      </StyledCard>

      {showModal && (
        <TaskModal
          user={user}
          component={component}
          addFunctions={addFunctions}
          onModalClose={toggleModal}
        />
      )}
    </>
  );
}