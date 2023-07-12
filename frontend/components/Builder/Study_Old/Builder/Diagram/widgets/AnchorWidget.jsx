import React from 'react';
import { PortWidget } from '@projectstorm/react-diagrams-core';
import { StyledNode } from '../styles';

export const AnchorWidget = props => (
  <StyledNode taskType="ANCHOR">
    <div className="anchoredArea">
      <div
        className="node-header-container"
        style={{ backgroundColor: 'white' }}
      >
        <div className="node-header-text">Participant registration</div>

        <div
          className="icon"
          aria-hidden="true"
          onClick={() => {
            // open the preview
            props.engine.openStudyPreview();
          }}
        >
          <img src="/assets/icons/builder/play.svg" />
        </div>
      </div>

      <div className="node-content">Start buiding your study from here</div>
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
