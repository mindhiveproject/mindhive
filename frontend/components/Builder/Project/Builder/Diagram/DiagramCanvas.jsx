import React from 'react';
import styled from '@emotion/styled';

// Mesh grid
export const StyledDiagramCanvas = styled.div`
  width: 99%;
  height: 100%;
  box-shadow: 0px 2px 20px rgba(0, 0, 0, 0.07);
  background-color: ${p => p.background};
  background-size: 50px 50px;
  display: flex;

  > * {
    height: 100%;
    min-height: 100%;
    width: 100%;
  }

  background: linear-gradient(90deg, #f7f9f8 21px, transparent 1%) center,
    linear-gradient(#f7f9f8 21px, transparent 1%) center, #313741;
  background-size: 22px 22px;
`;

export const DiagramCanvas = props => (
  <StyledDiagramCanvas
    background={props.background || '#fff'}
    color={props.color || '#f2f2f2'}
  >
    {props.children}
  </StyledDiagramCanvas>
);
