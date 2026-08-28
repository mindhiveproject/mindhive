import styled from "styled-components";

export const ReadOnlyTipTap = styled.div`
  font-family: inherit;
  line-height: 1.6;
  color: #333;

  .ProseMirror {
    padding: 0px;
    border-radius: 0;
    outline: none;
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    margin: 1rem 0 0.5rem;
    color: #274E5B;
  }

  a {
    color: #3D85B0;
    text-decoration: underline !important;
    cursor: pointer;
    font-weight: 500;
    
    &:hover {
      color: #7D70AD;
      font-weight: 500;
    }
  }

  h1 { font: var(--MH-Type-Heading-Base); letter-spacing: 0; }
  h2 { font: var(--MH-Type-Heading-Small); letter-spacing: 0; }
  h3 { font: var(--MH-Type-Title-Large); letter-spacing: 0; }
  h4 { font: var(--MH-Type-Title-Base); letter-spacing: 0; }
  h5 { font: var(--MH-Type-Title-Small); letter-spacing: 0; }
  h6 { font: var(--MH-Type-Title-Small); letter-spacing: 0; }

  /* Paragraphs */
  p {
    margin: 0.75rem 0;
    
  }

  /* Blockquote */
  blockquote {
    border-left: 4px solid #274E5B;
    background-color: #f5f5f5;
    margin: 1rem 0;
    padding: 1rem 1.5rem;
    font-style: italic;
    border-radius: 0 8px 8px 0;
  }

  /* Lists */
  ul, ol {
    margin: 1rem 0;
    padding-left: 2.5rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  ol {
    list-style-type: decimal;
  }

  ol li ol {
    list-style-type: lower-alpha;
  }

  /* Code */
  pre, code {
    font-family: monospace;
    background-color: #f0f0f0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Table */
  table {
  border-collapse: collapse;
  margin: 1rem 0;
  overflow: hidden;
  table-layout: fixed;
  width: 100%;

  td, th {
    border: 2px solid #ced4da;
    box-sizing: border-box;
    // min-width: 1em;
    padding: 4px 8px;
    position: relative;
    vertical-align: top;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;

    > * {
      margin-bottom: 0;
    }
  }

  th {
    background-color: #EFEFEF;
    font-weight: bold;
    text-align: left;
  }

  .tableWrapper {
    overflow-x: auto;
  }

  /* Images */
  .editor-image {
    max-width: 600px;
    height: auto;
    border-radius: 4px;
    margin: 1rem 0;
  }
`;
