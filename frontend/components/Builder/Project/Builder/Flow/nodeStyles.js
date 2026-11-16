import styled from "styled-components";

import { getTaskTypeColor } from "../../../../../lib/taskTypeColors";

// The look of a block on the study canvas (task, design, starting point)

export const StyledNode = styled.div`
  display: grid;
  width: 378px;
  height: 128px;
  background-color: white;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.07);
  border-radius: 8px;

  border-top: 8px solid;
  border-top-color: ${(props) => getTaskTypeColor(props.taskType)};

  .node-header-container {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 0px 20px 0px 20px;
    align-items: center;
    height: 58px;
    border-radius: 8px;
    border-bottom: 1px solid #efefef;
  }

  .node-header-text {
    color: #1a1a1a;
    font-style: normal;
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
  }

  .node-header-icons {
    display: grid;
    grid-auto-flow: column;
    grid-gap: 2px;
    align-items: end;
  }

  /* the subtitle, edited in place (TaskNode) */
  .node-subtitle {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    min-width: 0;
  }

  .node-subtitle-text {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
  }

  .node-subtitle-edit {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #666666;
    cursor: pointer;
    opacity: 0;
  }

  &:hover .node-subtitle-edit,
  .node-subtitle-edit:focus-visible {
    opacity: 1;
  }

  .node-subtitle-edit:hover {
    background: #efefef;
  }

  .node-subtitle-input {
    width: 100%;
    padding: 2px 6px;
    border: 1px solid #007c70;
    border-radius: 4px;
    outline: none;
    color: #1a1a1a;
    font: var(--MH-Type-Body-Base);
  }

  .node-content {
    display: grid;
    padding: 0px 20px 0px 20px;
    color: #666666;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    text-align: left;
  }

  /* "Recording · …" line under the subtitle when a data source runs during
     this block (TaskWidget). */
  .node-recording {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }

  .node-recording-text {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .node-recording-dot {
    flex-shrink: 0;
    color: var(--MH-Theme-Error-Dark, #b3261e);
  }

  .icon {
    cursor: pointer;
  }

`;
