import React from 'react';
import { PortWidget } from '@projectstorm/react-diagrams-core';
import { StyledNode } from '../styles';

export const DesignWidget = props => (
  <StyledNode taskType="DESIGN">
    <div
      className="node-header-container"
      style={{ backgroundColor: props.node.color }}
    >
      <div className="node-header-text">{props.node?.options?.name}</div>

      <div className="node-header-icons">
        <div></div>
        <div></div>
        <div
          className="icon"
          aria-hidden="true"
          onClick={() => {
            // lock the model
            props.engine.getModel().setLocked(true);
            // open the modal
            props.engine.openDesignModal({
              node: props?.node,
              isEditorOpen: true,
              isInfoOpen: false,
              isPreviewOpen: false,
            });
          }}
        >
          <img src="/assets/icons/builder/settings.svg" />
        </div>
      </div>
    </div>

    <PortWidget
      className="port-container up-port"
      engine={props.engine}
      port={props.node.getPort('in')}
    >
      <div className="my-in-port">Drop the link here</div>
    </PortWidget>

    <div className="node-content">{props.node?.options?.details}</div>
          
    <div className="port-container design-bottom-port">
      <PortWidget
        engine={props.engine}
        port={props.node.getPort('out-1')}
      >
        <div className="my-out-port"></div>
      </PortWidget>

      <PortWidget
        engine={props.engine}
        port={props.node.getPort('out-2')}
      >
        <div className="my-out-port"></div>
      </PortWidget>
    </div>
    
  </StyledNode>
);
