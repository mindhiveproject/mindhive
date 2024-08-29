import { Icon } from "semantic-ui-react";

import { NodesTypesContainer } from "../../Diagram/nodes-types-container/NodesTypesContainer";
import { NodeTypeLabel } from "../../Diagram/node-type-label/NodeTypeLabel";
import { StyledCard } from "../../../../../styles/StyledBuilder";

export default function StudyCard({ study, addFunctions }) {
  return (
    <StyledCard>
      <div className="addBlock">
        <Icon
          name="plus circle"
          size="big"
          color="grey"
          link
          onClick={() => {
            addFunctions.addStudyTemplateToCanvas({ study });
          }}
        />
      </div>

      <div className="movableCard">
        <NodesTypesContainer>
          <NodeTypeLabel
            model={{
              type: "study",
              diagram: study?.diagram,
            }}
            name={study?.title}
          ></NodeTypeLabel>
        </NodesTypesContainer>
      </div>
      <div className="icons"></div>
    </StyledCard>
  );
}
