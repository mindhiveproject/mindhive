import { PortWidget } from '@projectstorm/react-diagrams-core';
import { StyledNode } from '../styles';

import { TASK_TO_PARTICIPATE } from '../../../../../Queries/Task';
import { useQuery } from '@apollo/client';

export const TaskWidget = props => {

   const { data, error, loading } = useQuery(TASK_TO_PARTICIPATE, {
    variables: { id: props.node?.options?.componentID },
  });

  return  (
  <StyledNode taskType={props.node?.options?.taskType}>
    <div
      className="node-header-container"
      id="block"
      style={{ backgroundColor: props.node.color }}
    >
      <div className="node-header-text">
        {data?.task?.title} 
      </div>

      <div className="node-header-icons">
        <div
          className="icon"
          aria-hidden="true"
          id="blockSettings"
          onClick={() => {
            // lock the model
            props.engine.getModel().setLocked(true);
            // open the modal
            props.engine.openComponentModal({
              node: props?.node,
              isEditorOpen: true,
              isInfoOpen: false,
              isPreviewOpen: false,
            });
          }}
        >
          <img src="/assets/icons/builder/settings.svg" />
        </div>

        <div
          className="icon"
          aria-hidden="true"
          id="blockInfo"
          onClick={() => {
            // lock the model
            props.engine.getModel().setLocked(true);
            // open the modal
            props.engine.openComponentModal({
              node: props?.node,
              isEditorOpen: false,
              isInfoOpen: true,
              isPreviewOpen: false,
            });
          }}
        >
          <img src="/assets/icons/builder/info.svg" />
        </div>

        <div
          className="icon"
          aria-hidden="true"
          id="blockPlay"
          onClick={() => {
            // lock the model
            props.engine.getModel().setLocked(true);
            // open the preview
            props.engine.openComponentModal({
              node: props?.node,
              isEditorOpen: false,
              isInfoOpen: false,
              isPreviewOpen: true,
            });
          }}
        >
          <img src="/assets/icons/builder/play.svg" />
        </div>
      </div>
    </div>

    <PortWidget
      className="port-container up-port"
      engine={props.engine}
      port={props.node.getPort('in')}
    >
      <div className="my-in-port"></div>
    </PortWidget>

    <div className="node-content">
      {props.node?.options?.subtitle}
    </div>

    <PortWidget
      className="port-container bottom-port"
      engine={props.engine}
      port={props.node.getPort('out')}
    >
      <div className="my-out-port"></div>
    </PortWidget>
  </StyledNode>
)
} ;
