import styled from "styled-components";

export const StyledTipTap = styled.div`
  position: relative;
  z-index: 1; /* Ensure proper stacking context */

  .editorContainer {
    position: relative;
    margin-top: 10px;
  }

  .floatingToolbar {
    position: absolute;
    top: -60px;
    left: 0;
    z-index: 10000;
    pointer-events: auto;
    opacity: 0;
    transform: translateY(-10px);
    transition: opacity 0.2s ease, transform 0.2s ease;

    &.visible {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .toolbar {
    display: flex;
    grid-gap: 10px;
    border-radius: 100px;
    background: #f0f5f5;
    padding: 0px 16px 0px 16px;
    width: fit-content;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    .toolbarGroup {
      // border-radius: 8px;
      // background: #336F8A0a;
      padding: 4px 4px;
      display: flex;
      grid-template-rows: repeat(auto-fill, minmax(40px, 1fr)); /* Vertical (column) layout */
      grid-gap: -1px;
      width: fit-content;
      
      .toolbarButton { 
        height: 32px;
        background: #00000000;
        display: grid;
        justify-content: center;
        align-content: center;

        &:hover {
          background: #55808C;
          cursor: pointer;
          color: white; 
        }
         
        &.active {
        background: #D3E0E3;
          color: #434343; 
        }
      }
      
      .table-dropdown {
        position: relative;

        > .icon.dropdown {
        display: none !important;
        }
      }

      .specialButtonGroup {
        margin-left: auto;
        padding-right: 4px;
      }

      .specialToolbarButton {
        height: 36px;
        min-width: 124px;
        padding: 0 18px;
        border-radius: 999px !important;
        border: 1.5px solid #274e5b !important;
        background: transparent !important;
        color: #274e5b !important;
        font-weight: 600 !important;
        letter-spacing: 0.01em;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease,
          transform 0.2s ease;

        .icon {
          margin: 0 !important;
          font-size: 1em;
        }

        &:hover:not(.disabled):not(.loading) {
          background: #274e5b !important;
          color: #ffffff !important;
          box-shadow: 0 6px 16px rgba(39, 78, 91, 0.2);
        }

        &:active:not(.disabled):not(.loading) {
          transform: translateY(1px);
          box-shadow: 0 2px 8px rgba(39, 78, 91, 0.2);
        }

        &.positive {
          border-color: #21ba45 !important;
          color: #1c8f36 !important;

          &:hover:not(.disabled):not(.loading) {
            background: #21ba45 !important;
            color: #ffffff !important;
          }
        }

        &.negative {
          border-color: #db2828 !important;
          color: #b21e1e !important;

          &:hover:not(.disabled):not(.loading) {
            background: #db2828 !important;
            color: #ffffff !important;
          }
        }

        &.loading {
          opacity: 0.8;
        }

        &.disabled,
        &:disabled {
          opacity: 0.6 !important;
          border-color: #d3e0e3 !important;
          color: #7a7a7a !important;
          box-shadow: none;
          cursor: not-allowed;
        }
      }
    }
  }

  .tiptapEditor {
    display: flex;
    width: 100%;
    max-width: 900px;
    border-radius: 16px;

    .ProseMirror {
      padding: 24px;
      outline: none;
      border-radius: 16px;
      border: 2px solid #D3E0E3;
      background: white;
      width: 100%;
      max-height: 600px; 
      overflow-y: auto;
      
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
        overflow-x: scroll;
        max-width: 100%;
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
      
      /* Prevent other elements from breaking container */
      pre, code {
        max-width: 100%;
        overflow-x: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      blockquote {
        max-width: 100%;
        overflow-wrap: break-word;
        border-left: 4px solid #274E5B;
        background-color: #EFEFEF;
        margin: 1rem 0;
        padding: 1rem 1.5rem;
        font-style: italic;
        border-radius: 0 8px 8px 0;
      }

      .editor-link {
        color: #3D85B0;
        text-decoration: underline !important;
        cursor: pointer;
        font-weight: 500;
        
        &:hover {
          color: #7D70AD;
          font-weight: 500;
        }
      }

      /* List styling */
      ul, ol {
        // padding-left: 1rem; // not setting a padding as the editor handles it
        margin: 0.5rem 0;
        
        li {
          // margin-bottom: 0.1rem;
          color: #434343;
          font-size: 1.5rem;
        }


      }

      ol {
        list-style-type: decimal;
      }

      ol li ol {
        list-style-type: lower-alpha;
      }

      
      /* Heading Styles */
      h1 {
        font-size: 3rem;
        font-weight: bold;
        margin: 0 0 0.25rem 0;
        color: #274E5B;
        // border-bottom: 2px solid rgb(255, 255, 255);
        // padding-bottom: 0.25rem;
        max-width: 100%;
        overflow-wrap: break-word;
      }
    }
  }
`;