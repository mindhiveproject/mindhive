import styled from "styled-components";

export const StyledModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const StyledModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

export const StyledModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e6e6e6;
  h2 {
    margin: 0;
    font-family: Nunito;
    font-weight: 700;
    font-size: 24px;
    color: #333;
  }
`;

export const StyledModalBody = styled.div`
  padding: 16px;
`;

export const StyledModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid #e6e6e6;
`;

export const StyledModalClose = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  &:hover {
    color: #333;
  }
`;

export const StyledModalButton = styled.button`
  padding: 8px 16px;
  margin-left: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: Inter;
  font-size: 14px;
  &.cancel {
    background: #f0f0f0;
    color: #333;
    &:hover {
      background: #e0e0e0;
    }
  }
  &.save {
    background: #336f8a;
    color: white;
    &:hover:not(:disabled) {
      background: #2a5a6f;
    }
    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }
`;

export const StyledDataSourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const StyledDataSourceOption = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  &:hover {
    background: #f8f9f8;
  }
  &.selected {
    border-color: #336f8a;
    background: #f0f8f7;
  }
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    pointer-events: auto; /* Ensure checkbox is clickable */
  }
  .datasource-details {
    flex: 1;
  }
  .datasource-title {
    font-family: Nunito;
    font-weight: 600;
    font-size: 16px;
    line-height: 20px;
    color: #333;
  }
  .datasource-meta {
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: #666;
    font-family: Inter;
    margin-top: 4px;
  }
  .origin-badge {
    background: #f0f8f7;
    color: #336f8a;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    font-family: Inter;
  }
  .author {
    font-weight: 500;
  }
  .updated {
    color: #999;
  }
`;
