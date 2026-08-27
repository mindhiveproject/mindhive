import styled from "styled-components";

export const StyledNodeTypeLabel = styled.div`
  .node-type-label {
    display: grid;
    width: 100%;
    height: 100%;
    padding: 16px;
    align-content: center;
    cursor: pointer;
    font: var(--MH-Type-Label-Large, 500 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
  }
  .subtitle {
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    font-style: italic;
    letter-spacing: 0;
  }
`;
