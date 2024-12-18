import React from 'react';
import { StyledNodesTypesContainer } from './nodes-type-container.js';

export const NodesTypesContainer = props => (
  <StyledNodesTypesContainer>
    <div className="nodes-container">{props.children}</div>
  </StyledNodesTypesContainer>
);
