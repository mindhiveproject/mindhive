import styled from "styled-components";

export const StyledTipTap = styled.div`
  display: grid;
  grid-gap: 10px;

  .toolbar {
    background: rgba(51, 111, 138, 0.04);
    border-radius: 8px;
    padding: 8px 16px;
    display: flex;
    grid-template-rows: repeat(auto-fill, minmax(40px, 1fr)); /* Vertical (column) layout */
    grid-gap: 10px;
    width: fit-content;
    
    .toolbarButton { 
      height: 32px;
      background: #D3E0E3;
      display: grid;
      justify-content: center;
      align-content: center;

      &:hover {
        background: #b0c7d0;
        cursor: pointer;
      }
    }
    
    .table-dropdown {
      position: relative;

      > .icon.dropdown {
      display: none !important;
      }
    }
  }

  .tiptapEditor {
    display: grid;
    border-radius: 16px; /* Rounded corners */

    .ProseMirror {
      padding: 10px;
      outline: none;
      border-radius: 16px; /* Match outer radius or slightly smaller if nested */
      background: rgba(51, 111, 138, 0.04);
      
      table {
        border-collapse: collapse;
        margin: 0;
        overflow: hidden;
        table-layout: fixed;
        width: 100%;
        
        td, th {
          border: 2px solid #ced4da;
          box-sizing: border-box;
          min-width: 1em;
          padding: 3px 5px;
          position: relative;
          vertical-align: top;
          
          > * {
            margin-bottom: 0;
          }
        }
        
        th {
          background-color: #EFEFEF;
          font-weight: bold;
          text-align: left;
        }
        
        .selectedCell:after {
          background: rgba(200, 200, 255, 0.4);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        
        .column-resize-handle {
          background-color: #adf;
          bottom: -2px;
          position: absolute;
          right: -2px;
          pointer-events: none;
          top: 0;
          width: 4px;
        }
        
        p {
          margin: 0;
        }
      }
      
      .tableWrapper {
        padding: 1rem 0;
        overflow-x: auto;
      }
      
      .resize-cursor {
        cursor: ew-resize;
        cursor: col-resize;
      }
      
      /* Image Styles */
      .editor-image {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
        margin: 10px 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        
        &.ProseMirror-selectednode {
          outline: 3px solid #F9D978;
        }
      }
      
      /* Handle inline images */
      img {
        max-width: 100%;
        height: auto;
        vertical-align: top;
        
        &.ProseMirror-selectednode {
          outline: 3px solid #F9D978;
        }
      }
    }
  }
`;