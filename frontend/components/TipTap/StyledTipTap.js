import styled from "styled-components";

export const StyledTipTap = styled.div`
  position: relative;
  z-index: 1; /* Ensure proper stacking context */
  width: 100%;

  .editorContainer {
    position: relative;
    margin-top: 10px;
  }

  .floatingToolbar {
    position: absolute;
    top: -60px;
    left: 0;
    right: 0;
    max-width: 100%;
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

  &[data-toolbar-align="right"] {
    .floatingToolbar {
      display: flex;
      justify-content: flex-end;
    }

    .toolbar {
      width: auto;
      margin-left: auto;
    }
  }

  .toolbar {
    display: flex;
    // grid-gap: 4px;
    padding: 0px 8px 0px 16px;
    width: fit-content;
    border-radius: 32px;
    border: 1px solid #A1A1A1;
    background: var(--MH-Theme-Neutrals-Light-Green, #F6F9F8);

    /* MH-Theme/Elevation/High */
    box-shadow: 2px 2px 12px 0 rgba(0, 0, 0, 0.15);
    
    .toolbarGroup {
      // border-radius: 8px;
      // background: #336F8A0a;
      padding: 4px 4px;
      display: flex;
      grid-template-rows: repeat(auto-fill, minmax(40px, 1fr)); /* Vertical (column) layout */
      grid-gap: -1px;
      width: fit-content;

      .tiptap-toolbar-icon {
        display: block;
        flex-shrink: 0;
        object-fit: contain;
      }

      .specialButtonGroup {
        margin-left: auto;
        padding-right: 4px;
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
      border-radius: 8px;
      border: 1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1);
      background: var(--MH-Theme-Neutrals-White, #FFF);
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
          font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
          letter-spacing: 0;
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
        font: var(--MH-Type-Heading-Large, 700 46px/52px "Inter", sans-serif);
        letter-spacing: 0;
        margin: 0 0 0.25rem 0;
        color: #274E5B;
        // border-bottom: 2px solid rgb(255, 255, 255);
        // padding-bottom: 0.25rem;
        max-width: 100%;
        overflow-wrap: break-word;
      }

      /* Collaborative editing — remote user carets and labels */
      .collaboration-cursor__caret {
        border-left: 1px solid #0d0d0d;
        border-right: 1px solid #0d0d0d;
        margin-left: -1px;
        margin-right: -1px;
        pointer-events: none;
        position: relative;
        word-break: normal;
      }

      .collaboration-cursor__label {
        border-radius: 3px 3px 3px 0;
        color: #fff;
        font: var(--MH-Type-Label-Small, 600 12px/16px "Inter", sans-serif);
        font-style: normal;
        letter-spacing: 0;
        left: -1px;
        padding: 0.1rem 0.3rem;
        position: absolute;
        top: -1.4em;
        user-select: none;
        white-space: nowrap;
      }
    }
  }
`;