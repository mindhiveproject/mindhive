import styled from 'styled-components';

export const StyledCreatorWidget = styled.div`
  height: 100%;

  .creator-body {
    display: grid;
    height: 100%;
  }

  .creator-header {
    display: flex;
    background: #fff;
    flex-grow: 0;
    flex-shrink: 0;
    color: #6a6b6b;
    font-family: Helvetica, Arial, sans-serif;
    font-size: 20px;
    padding: 10px;
    padding-left: 30px;
    align-items: center;
  }

  .creator-content {
    display: grid;
    grid-template-columns: 1fr;
    height: 100%;
  }

  .creator-layer {
    position: relative;
    flex-grow: 1;
  }

  .serialize-diagram {
    margin-left: 10px;
    padding: 3px;
    cursor: pointer;
    border: 1px solid #333333;
  }
`;
