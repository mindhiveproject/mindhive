import React from 'react';
import { PortWidget } from '@projectstorm/react-diagrams-core';
import { StyledNode } from '../styles';

export const TaskWidget = props => (
  <StyledNode taskType={props.node?.options?.taskType}>
    <div
      className="node-header-container"
      style={{ backgroundColor: props.node.color }}
    >
      <div className="node-header-text">
        {props.node?.options?.name.length > 50
          ? `${props.node?.options?.name
              .split(' ')
              .slice(0, 4)
              .join(' ')} ...`
          : props.node?.options?.name}
      </div>

      <div className="node-header-icons">
        <div
          className="icon"
          aria-hidden="true"
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
      {props.node?.options?.subtitle || props.node?.options?.details}
    </div>

    <PortWidget
      className="port-container bottom-port"
      engine={props.engine}
      port={props.node.getPort('out')}
    >
      <div className="my-out-port"></div>
    </PortWidget>
  </StyledNode>
);
