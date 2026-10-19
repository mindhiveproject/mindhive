import styled from "styled-components";

export const StyledTipTap = styled.div`
  position: relative;
  z-index: 1; /* Ensure proper stacking context */
  width: 100%;

  .editorContainer {
    position: relative;
    margin-top: 10px;
  }

  .tiptapEditorHost {
    position: relative;
  }

  /* Toolbar strip inside the top of the editor box. Its space is always
     reserved (padding-top below), so fading it in on focus moves nothing. */
  &&.hasInlineToolbar .tiptapEditor .ProseMirror {
    padding-top: calc(var(--tiptap-toolbar-height, 36px) + 12px);
  }

  /* Sticky so it stays reachable while a long editor is scrolled past (by
     the page or any scrolling ancestor). The negative bottom margin keeps it
     out of the flow, so the text still starts in the reserved padding.
     Set --tiptap-toolbar-sticky-top to clear a fixed header. */
  .inlineToolbar {
    position: sticky;
    top: var(--tiptap-toolbar-sticky-top, 0px);
    margin: 1px 1px calc(-1px - var(--tiptap-toolbar-height, 36px));
    z-index: 2;
    border-bottom: 1px solid transparent;
    border-radius: 7px 7px 0 0;
    background: transparent;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.15s ease, visibility 0.15s, background-color 0.15s,
      border-color 0.15s;

    &.visible {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      background: var(--MH-Theme-Neutrals-White, #ffffff);
      border-bottom-color: var(--MH-Theme-Neutrals-Light, #e6e6e6);
    }
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 2px 8px;

    .toolbarGroup {
      padding: 1px 0;
      display: flex;
      align-items: center;
      width: fit-content;

      .tiptap-toolbar-icon {
        display: block;
        flex-shrink: 0;
        object-fit: contain;
      }
    }

    .toolbarDivider {
      width: 1px;
      height: 18px;
      margin: 0 6px;
      background: #d3e0e3;
    }

    .specialButtonGroup {
      margin-left: auto;

      /* Fit the 40px design-system button into the slim strip */
      .DesignSystem-Button {
        height: 28px !important;
        padding-top: 4px !important;
        padding-bottom: 4px !important;
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
      border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
      background: var(--MH-Theme-Neutrals-White, #ffffff);
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
          font: var(--MH-Type-Body-Base);
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
        font: var(--MH-Type-Heading-Large);
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
        font: var(--MH-Type-Label-Small);
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