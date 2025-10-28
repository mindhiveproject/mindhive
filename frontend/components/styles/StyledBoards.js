import styled from "styled-components";

const StyledBoards = styled.div`
  padding: 2rem;
  min-height: 100vh;

  .headerSection {
    max-width: 1200px;
    margin: 0 auto;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2.2rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  h2 {
    font-size: 2rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  p {
    color: #4a5568;
    font-size: 1.1rem;
    line-height: 1.5;
  }

  .createButton.narrowButton {
    width: auto;
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    margin: 1rem 0;
    // background: #3182ce;
    background: #336F8A;
    color: white;
    border-radius: 100px;
    // border: none;
    border: 1px solid #336F8A;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .backButton,
  .saveButton {
    height: 40px;
    padding: 8px 24px 8px 24px;
    justify-content: center;
    gap: 8px;
    flex-shrink: 0;
    width: auto;
    display: inline-flex;
    align-items: center;
    margin: 1rem 0;
    background: #336F8A;
    color: white;
    border-radius: 100px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.3s ease;
    }
    
  .createButton.narrowButton:hover,
  .backButton:hover,
  .saveButton:hover {
    border-radius: 100px;
    border: 1px #F9D978;
    color: #274E5B;
    background: #F9D978;
    box-shadow: 2px 2px 12px 0 rgba(0, 0, 0, 0.15);
  }

  .buttonGroup {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .manageDropdown.ui.dropdown {
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .cardGrid,
  .clonedBoardsGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .projectCard,
  .clonedBoardItem {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .projectCard:hover,
  .clonedBoardItem:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .projectCard h3,
  .clonedBoardItem h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .description {
    color: #718096;
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .meta p,
  .clonedBoardItem p {
    color: #4a5568;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .cardActions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .viewButton,
  .editButton,
  .duplicateButton,
  .deleteButton {
    padding: 0.75rem;
    min-width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #edf2f7;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s ease;
    color: #2d3748;
  }

  .viewButton:hover,
  .editButton:hover,
  .duplicateButton:hover {
    background: #e2e8f0;
  }

  .deleteButton {
    background: #feb2b2;
    color: #9b2c2c;
  }

  .deleteButton:hover {
    background: #f56565;
    color: white;
  }

  .viewButton .icon,
  .editButton .icon,
  .duplicateButton .icon,
  .deleteButton .icon {
    opacity: 1;
    color: inherit;
  }

  .modalOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modalContent {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modalHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .modalHeader h3 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0;
  }

  .closeBtn {
    cursor: pointer;
    font-size: 1.5rem;
    color: #718096;
    transition: color 0.3s ease;
  }

  .closeBtn:hover {
    color: #2d3748;
  }

  .createOptions {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .optionButton {
    flex: 1;
    min-width: 150px;
    background: #3182ce;
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: none;
    font-size: 1.1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .optionButton:hover {
    background: #2b6cb0;
  }

  .optionButton:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
  }

  .dropdownSection {
    margin-top: 1rem;
  }

  .dropdownSection .ui.dropdown {
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 1.1rem;
  }

  .clonedBoardsSection {
    max-width: 1200px;
    margin: 2rem auto;
  }
`;

export default StyledBoards;
