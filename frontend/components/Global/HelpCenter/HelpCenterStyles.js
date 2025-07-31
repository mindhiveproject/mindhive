import styled, { keyframes } from 'styled-components';

// Animations
export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(1);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// Styled Components
export const HelpButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.primaryGreen};
  border: none;
  box-shadow: ${props => props.theme.bs};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  transition: all 0.3s ease;
  z-index: 1000;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 16px 32px 0 rgba(0, 0, 0, 0.15);
  }
`;

export const ActionsList = styled.div`
  position: fixed;
  bottom: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 999;
`;

export const ActionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  animation: ${fadeInUp} 0.3s ease forwards;
  animation-delay: ${props => props.delay}ms;
  opacity: 0;
`;

export const ActionButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.bgColor || props.theme.primaryGreen};
  border: none;
  box-shadow: ${props => props.theme.bs};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 24px 0 rgba(0, 0, 0, 0.15);
  }
`;

export const ActionLabel = styled.span`
  background: white;
  padding: 8px 16px;
  border-radius: 25px;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  font-family: "Nunito Sans", sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 16px;
  box-shadow: ${props => props.theme.bs};
  white-space: nowrap;
`;

export const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1001;
  animation: ${scaleIn} 0.3s ease;
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px 0 rgba(0, 0, 0, 0.2);
`;

export const ModalHeader = styled.div`
  color: ${props => props.theme.neutral5};
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: between;
  gap: 12px;
  h2 {
    font-family: 'Lato', sans-serif;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    flex: 1;
  }
`;

export const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
`;

export const ModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme.accentGreen};
  background: ${props => props.theme.offWhite};
  .primaryBtn {
    margin-left: 10px;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
`;

export const DocSection = styled.div`
  .doc-item {
    background: ${props => props.theme.offWhite};
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 12px;
    border-left: 4px solid ${props => props.theme.primaryGreen};
    h4 {
      margin: 0 0 8px 0;
      color: ${props => props.theme.black};
      font-family: 'Lato', sans-serif;
    }
    p {
      margin: 0;
      font-size: 14px;
    }
  }
`;

export const Support = styled.div`
  .primaryBtn {
    margin-left: 10px;
  }
  .report-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: ${props => props.theme.neutral5};
    border-radius: 6px;
    margin-bottom: 12px;
    .report-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
    }
    .report-details {
      h4 {
        margin: 0 0 4px 0;
        color: ${props => props.theme.neutral1};
        font-family: 'Lato', sans-serif;
      }
      p {
        margin: 0;
        font-size: 14px;
      }
    }
  }
`; 