import React from 'react';
import { StyledNodeTypeLabel } from './node-type-label.js';

// Nodes Labels (left panel). `disabled` stops the drag onto a locked canvas.
export const NodeTypeLabel = ({
  color,
  model,
  name,
  createdBy,
  subtitle,
  disabled = false,
}) => (
  <StyledNodeTypeLabel>
    <div
      className="node-type-label"
      color={color}
      draggable={!disabled}
      style={disabled ? { cursor: 'default' } : undefined}
      onDragStart={event => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData('storm-diagram-node', JSON.stringify(model));
      }}
    >
      {name}
      <div className="subtitle">{createdBy === 'me' && subtitle}</div>
    </div>
  </StyledNodeTypeLabel>
);
