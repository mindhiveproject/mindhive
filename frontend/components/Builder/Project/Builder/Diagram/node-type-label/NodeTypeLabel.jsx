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
        // read by both study canvases (Flow/StudyFlowCanvas.jsx and
        // Diagram/widgets/CreatorWidget.jsx)
        event.dataTransfer.setData(
          'application/x-mindhive-study-block',
          JSON.stringify(model)
        );
      }}
    >
      {name}
      <div className="subtitle">{createdBy === 'me' && subtitle}</div>
    </div>
  </StyledNodeTypeLabel>
);
