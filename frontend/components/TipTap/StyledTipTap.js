import styled from "styled-components";

export const StyledTipTap = styled.div`
  display: grid;
  grid-gap: 10px;
  .toolbar {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
    grid-gap: 10px;
    .toolbarButton {
      display: grid;
      justify-content: center;
      align-content: center;
    }
  }
  .tiptapEditor {
    display: grid;
    background: white;
    .ProseMirror {
      padding: 10px;
      outline: none; // Remove default outline on ProseMirror
      border: 1px solid #e0e0e0; // Subtle grey border
    }
  }
`;
