import styled from "styled-components";

export const StyledDataArea = styled.div`
  display: grid;
  align-content: baseline;
  grid-gap: 10px;
`;

export const StyledDataJournal = styled.div`
  display: grid;
  align-content: baseline;
  grid-gap: 10px;
`;

export const StyledDataWorkspace = styled.div`
  display: grid;
  align-content: baseline;
  grid-gap: 10px;
  .dashboard {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 10px;
    align-content: baseline;
  }
  .canvas {
    display: grid;
    width: 100%;
    border: 1px solid grey;
    height: 1000px;
    .widgetContainer {
      border: 1px solid grey;
    }
  }
`;

export const StyledSidebar = styled.div`
  display: grid;
  grid-gap: 10px;
  margin: 10px;

  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;

  .journals {
    display: grid;
    grid-gap: 10px;
  }
`;

export const StyledTopNavigation = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-gap: 10px;
  height: 50px;
  align-content: center;
  border: 1px solid #e6e6e6;
  .buttons {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-gap: 10px;
  }
`;

export const StyledDataComponent = styled.div`
  display: grid;
  align-content: baseline;
  border: 1px solid grey;
  position: fixed;
  bottom: 0;
  right: 0;
  width: 500px;
  height: 50%;
`;
