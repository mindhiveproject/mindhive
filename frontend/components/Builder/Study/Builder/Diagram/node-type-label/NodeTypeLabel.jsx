import React from 'react';
import { StyledNodeTypeLabel } from './node-type-label.js';

// Nodes Labels (left panel)
export const NodeTypeLabel = props => (
  <StyledNodeTypeLabel>
    <div
      className="node-type-label"
      color={props.color}
      draggable
      onDragStart={event => {
        event.dataTransfer.setData(
          'storm-diagram-node',
          JSON.stringify(props.model)
        );
      }}
    >
      {props?.name}
      <div className="subtitle">
        {props?.createdBy === 'me' && props?.subtitle}
      </div>
    </div>
  </StyledNodeTypeLabel>
);
