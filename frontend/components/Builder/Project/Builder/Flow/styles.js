import styled from "styled-components";

// The canvas keeps the look of the Storm canvas: the light grid, 20px green
// connection dots and grey curved links with an arrow into the next block.
export const StyledFlowCanvas = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f7f9f8 21px, transparent 1%) center,
    linear-gradient(#f7f9f8 21px, transparent 1%) center, #313741;
  background-size: 22px 22px;

  .react-flow {
    --xy-edge-stroke-default: #9a9a9a;
    --xy-edge-stroke-width-default: 3;
    --xy-edge-stroke-selected-default: #007c70;
    --xy-connectionline-stroke-default: #007c70;
    --xy-connectionline-stroke-width-default: 3;
    background: transparent;
  }

  .react-flow__node {
    cursor: grab;
  }

  .react-flow__node.selected > div {
    outline: 2px solid #007c70;
    outline-offset: 2px;
  }

  .react-flow__node-comment.selected > div {
    outline-offset: 0;
  }

  /* someone else selected this block or has it open in their side panel */
  .react-flow__node.remotePresence > div {
    outline: 2px solid var(--presence-color);
    outline-offset: 2px;
  }

  .react-flow__node.remotePresence::before {
    content: var(--presence-name);
    position: absolute;
    top: -26px;
    left: 0;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--presence-color);
    color: #ffffff;
    font: var(--MH-Type-Label-Small);
    white-space: nowrap;
    pointer-events: none;
  }

  .studyHandle.react-flow__handle {
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 50%;
    background-color: #007c70;
  }

  .studyHandle.react-flow__handle.connectingto {
    box-shadow: 0 0 0 4px #ffb74d;
  }

  .studyHandle.react-flow__handle.connectingto:not(.valid) {
    box-shadow: 0 0 0 4px #e0e0e0;
  }

  .conditionLabel {
    position: absolute;
    bottom: 18px;
    transform: translateX(-50%);
    max-width: 120px;
    color: #666666;
    font: var(--MH-Type-Label-Small);
    letter-spacing: 0.05em;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }

  .react-flow__controls {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    overflow: hidden;
  }
`;

// The sticky note of StyledComment, sized by its own content so the canvas
// can measure it (the Storm note was absolutely positioned).
export const StyledFlowComment = styled.div`
  width: 280px;
  min-height: 100px;
  transform: rotate(0.6deg);
  background: linear-gradient(180deg, #fff9c4 0%, #fff59d 100%);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;

  .comment-header-container {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 8px 14px;
    align-items: center;
    gap: 8px;
    background: linear-gradient(180deg, #ffca28 0%, #ffc107 100%);
  }

  .comment-header-text {
    color: #1a1a1a;
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    opacity: 0.85;
  }

  .comment-content {
    display: grid;

    textarea {
      padding: 12px 14px;
      min-height: 100px;
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
      color: #333333;
      resize: none;
      border: none;
      outline: none;
      background: transparent;
      cursor: text;
    }
  }
`;
