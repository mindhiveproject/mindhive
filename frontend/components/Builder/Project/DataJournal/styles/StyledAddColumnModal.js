import styled from "styled-components";

export const StyledAddColumnModal = styled.div`
  .addColumnModalBody {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 16px;
    min-height: 420px;
    align-items: stretch;
  }

  .addColumnModalRail {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-right: 8px;
    border-right: 1px solid #e0e0e0;
  }

  .addColumnModalRailLabel {
    font-family: Inter, sans-serif;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: #64748b;
    margin: 0 0 4px 2px;
  }

  .addColumnModalRailItem {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    background: #ffffff;
    color: #1e293b;
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease,
      box-shadow 0.15s ease;

    img {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    &:hover {
      background: #f4f8f7;
      border-color: #c4c4c4;
    }

    &.addColumnModalRailItem--active {
      border-color: var(--MH-Theme-Primary-Dark, #336f8a);
      background: #ecf3f5;
      color: var(--MH-Theme-Primary-Dark, #336f8a);
      box-shadow: 0 1px 3px rgba(51, 111, 138, 0.12);
    }
  }

  .addColumnModalPane {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .addColumnModalPaneHeading {
    font-family: "Nunito", sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 12px;
    flex-shrink: 0;
  }

  .addColumnModalPaneScroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 4px;
  }

  .addColumnModalFooter {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .addColumnModalCancelBtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    background: #ffffff;
    color: #1e293b;
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;

    &:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
  }
`;
