/**
 * Minimal CSS for offscreen HTML export (mirrors critical TipTap / widget rules).
 */
export const EXPORT_CONTENT_STYLES = `
  .export-content-root {
    box-sizing: border-box;
    font-family: Inter, system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #171717;
    background: #ffffff;
    width: 100%;
    overflow: visible;
  }
  .export-content-root * {
    box-sizing: border-box;
  }
  .export-content-root p {
    margin: 0.5em 0;
  }
  .export-content-root ul,
  .export-content-root ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  .export-content-root ol {
    list-style-type: decimal;
  }
  .export-content-root blockquote {
    max-width: 100%;
    overflow-wrap: break-word;
    border-left: 4px solid #274e5b;
    background-color: #efefef;
    margin: 1rem 0;
    padding: 1rem 1.5rem;
    font-style: italic;
    border-radius: 0 8px 8px 0;
  }
  .export-content-root img {
    max-width: 100%;
    height: auto;
    display: block;
  }
  .export-content-root table {
    border-collapse: collapse;
    width: 100%;
    table-layout: auto;
    margin: 0.5rem 0;
  }
  .export-content-root .tableWrapper {
    padding: 0.5rem 0;
    overflow: visible;
    max-width: 100%;
  }
  .export-content-root th,
  .export-content-root td {
    border: 1px solid #ced4da;
    padding: 4px 8px;
    vertical-align: top;
    word-break: break-word;
  }
  .export-content-root th {
    background-color: #efefef;
    font-weight: bold;
    text-align: left;
  }
  .export-content-root h1,
  .export-content-root h2,
  .export-content-root h3 {
    margin: 0.75em 0 0.35em;
  }
`;
