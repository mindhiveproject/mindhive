import styled from "styled-components";

export const ReadOnlyTipTap = styled.div`
  font-family: inherit;
  line-height: 1.6;
  color: #333;

  .ProseMirror {
    padding: 0; /* No background */
    border-radius: 0;
    background: none;
    outline: none;
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    font-weight: bold;
    margin: 1rem 0 0.5rem;
    color: #274E5B;
  }

  h1 { font-size: 2.5rem; }
  h2 { font-size: 2rem; }
  h3 { font-size: 1.75rem; }
  h4 { font-size: 1.5rem; }
  h5 { font-size: 1.25rem; }
  h6 { font-size: 1rem; }

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
    padding-left: 1.5rem;
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
    font-size: 1rem;

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
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1rem 0;
  }

  /* Links */
  a {
    color: #3D85B0;
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      color: #7D70AD;
    }
  }
`;
