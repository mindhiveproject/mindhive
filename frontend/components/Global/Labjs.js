import PropTypes from "prop-types";
import { ThemeProvider, createGlobalStyle } from "styled-components";

const theme = {};

const GlobalStyles = createGlobalStyle`
 /* Basic configuration */
 :root {
    /* Layout */
    --width-container: 900px;
    --width-min-container: 320px;
    --height-min-header-footer: 8vh;
    --padding-internal: 24px;
    --border-radius-container: 5px;
    --border-radius-content: 4px;
    /* Typography */
    --font-family: "Arial", sans-serif;
    --font-family-mono: Droid Mono, Menlo, Consolas, monospace;
    --font-size: 18px;
    --line-height: 1.45;
    /* (line height is specified in em so that it adapts to varying font sizes) */
    --paragraph-margin-vertical: var(--font-size);
    /* Colors */
    --color-text: black;
    --color-background: white;
    --color-border: #e5e5e5;
    --color-border-internal: #efefef;
    --color-gray-background: #f8f8f8;
    --color-gray-content: #8d8d8d;
  }

  /* Set box model to border-box globally */
  :root {
    box-sizing: border-box;
  }
  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  /* Content layout */
  body {
    margin: 0;
    background: white;
    background: var(--color-background);
  }
  ::-webkit-backdrop {
    background: white;
    background: var(--color-background);
  }
  ::backdrop {
    background: white;
    background: var(--color-background);
  }

  .container {
    min-width: 320px;
    min-width: var(--width-min-container);
    min-height: 8vh;
    min-height: var(--height-min-header-footer);
    /* Use page-style layout by default */
    margin: 24px auto;
    margin: var(--padding-internal) auto;
    width: 900px;
    width: var(--width-container);
  }
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    padding: calc(2 * 24px);
    padding: calc(2 * var(--padding-internal));
    background: rgba(140, 140, 140, 0.25);
    /* Use backdrop-filter where available */
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
  }
  .overlay .modal {
    margin: 24px auto;
    margin: var(--padding-internal) auto;
    padding: calc(2 * 24px) 24px;
    padding: calc(2 * var(--padding-internal)) var(--padding-internal);
    min-height: 25vh;
    background: white;
    border: 1px solid rgba(140, 140, 140, 0.5);
    border-radius: 4px;
    border-radius: var(--border-radius-content);
    box-shadow: 0 0 5px rgba(140, 140, 140, 0.25);
  }

  header,
  footer,
  main {
    padding: 24px;
    padding: var(--padding-internal);
  }
  /* Individual parts: Height, borders and background */
  header,
  footer {
    min-height: 8vh;
    min-height: var(--height-min-header-footer);
  }
  main {
    min-height: 8vh;
    min-height: var(--height-min-header-footer);
  }

  /* Fullscreen layout */
  .container.fullscreen {
    /* Full screen minus margins */
    margin: 24px;
    margin: var(--padding-internal);
    min-height: calc(100vh - 2 * 24px);
    min-height: calc(100vh - 2 * var(--padding-internal));
    width: calc(100vw - 2 * 24px);
    width: calc(100vw - 2 * var(--padding-internal));
    /* Display content using flexboxes */
    display: -webkit-box;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    flex-direction: column;
  }
  .container.fullscreen main {
    /* Flex positioning */
    -webkit-box-flex: 1;
    flex: 1;
  }

  /* Frameless layout */
  .container.frameless {
    margin: 0 auto;
    border: none;
    border-radius: 0;
  }
  .container.fullscreen.frameless {
    margin: 0;
    width: 100%;
    min-height: 100vh;
  }

  /* Remove frame on small screens */
  @media (max-width: 600px), (max-height: 600px) {
    .container.fullscreen {
      margin: 0;
      border: none;
      border-radius: 0;
      width: 100%;
      min-height: 100vh;
    }
  }

  /* Flexbox fix for IE11, per https://github.com/philipwalton/flexbugs */
  @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    body {
      display: -webkit-box;
      display: flex;
    }
    .container.fullscreen {
      /* IE11 miscalculates the height, so add some slack */
      min-height: calc(100vh - 3 * 24px);
      min-height: calc(100vh - 3 * var(--padding-internal));
    }
  }

  /* Borders and backgrounds */
  .container {
    border: 1px solid #e5e5e5;
    border: 1px solid var(--color-border);
    border-radius: 5px;
    border-radius: var(--border-radius-container);
  }
  header {
    border-bottom: 1px solid #efefef;
    border-bottom: 1px solid var(--color-border-internal);
  }
  footer {
    border-top: 1px solid #efefef;
    border-top: 1px solid var(--color-border-internal);
    background-color: #f8f8f8;
    background-color: var(--color-gray-background);
  }

  /* Typography */
  :root {
    color: black;
    color: var(--color-text);
    font-family: "Arial", sans-serif;
    font-family: var(--font-family);
    font-size: 18px;
    font-size: var(--font-size);
    line-height: 1.45;
    line-height: var(--line-height);
  }
  header,
  footer,
  main {
    /* Set display style explicitly for legacy browsers
     that are unfamiliar with these elements */
    display: block;
    text-align: center;
  }
  h1,
  h2,
  h3 {
    line-height: 1.45;
    line-height: var(--line-height);
  }
  hr {
    border: none;
    border-top: 2px solid #e5e5e5;
    border-top: 2px solid var(--color-border);
  }

  /* Special elements: Keyboard buttons */
  kbd {
    /* Positioning */
    display: inline-block;
    min-width: 1.5rem;
    min-height: 1.5rem;
    padding: 0 0.3rem;
    padding-top: 0.15rem;
    /* Fonts */
    font-family: Droid Mono, Menlo, Consolas, monospace;
    font-family: var(--font-family-mono);
    font-size: 0.9rem;
    text-align: center;
    /* Background and border */
    background-color: white;
    background-color: var(--color-background);
    border-radius: 4px;
    border-radius: var(--border-radius-content);
    border: 1px solid #e5e5e5;
    border: 1px solid var(--color-border);
  }
  kbd.big {
    font-size: 1.4rem;
    padding-top: 0.375rem;
    border-radius: 0.125rem;
  }

  /* Alignment helpers */
  .w-100 {
    width: 100%;
  }
  .w-s {
    width: 100%;
    max-width: 320px;
    max-width: var(--width-min-container);
  }
  .w-m {
    width: 100%;
    max-width: calc(1.5 * 320px);
    max-width: calc(1.5 * var(--width-min-container));
  }
  .w-l {
    width: 100%;
    max-width: calc(2 * 320px);
    max-width: calc(2 * var(--width-min-container));
  }
  /* Block alignment based on flexbox */
  .content-vertical-top,
  .content-vertical-center,
  .content-vertical-bottom,
  .content-horizontal-left,
  .content-horizontal-center,
  .content-horizontal-right,
  .content-horizontal-space-between,
  .content-vertical-space-between,
  .content-horizontal-space-around,
  .content-vertical-space-around {
    display: -webkit-box;
    display: flex;
  }
  .content-vertical-top {
    -webkit-box-align: start;
    align-items: flex-start;
  }
  .content-vertical-center {
    -webkit-box-align: center;
    align-items: center;
  }
  .content-vertical-bottom {
    -webkit-box-align: end;
    align-items: flex-end;
  }
  .content-horizontal-left {
    -webkit-box-pack: start;
    justify-content: flex-start;
  }
  .content-horizontal-center {
    -webkit-box-pack: center;
    justify-content: center;
  }
  .content-horizontal-right {
    -webkit-box-pack: end;
    justify-content: flex-end;
  }
  .content-horizontal-space-between,
  .content-vertical-space-between {
    -webkit-box-pack: justify;
    justify-content: space-between;
  }
  .content-horizontal-space-around,
  .content-vertical-space-around {
    justify-content: space-around;
  }
  .content-vertical-space-around,
  .content-vertical-space-between {
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    flex-direction: column;
  }
  .content-vertical-space-between.content-horizontal-right,
  .content-vertical-space-around.content-horizontal-right {
    -webkit-box-align: start;
    align-items: flex-start;
  }
  .content-vertical-space-between.content-horizontal-center,
  .content-vertical-space-around.content-horizontal-center {
    -webkit-box-align: center;
    align-items: center;
  }
  .content-vertical-space-between.content-horizontal-right,
  .content-vertical-space-around.content-horizontal-right {
    -webkit-box-align: end;
    align-items: flex-end;
  }
  .sticky-top {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
  }
  /* Text alignment */
  .text-left {
    text-align: left;
  }
  .text-center {
    text-align: center;
  }
  .text-right {
    text-align: right;
  }
  .text-justify {
    text-align: justify;
  }
  .text-muted {
    color: #8d8d8d;
    color: var(--color-gray-content);
  }
  .text-muted a {
    color: rgb(60, 89, 156);
  }
  small,
  .small {
    font-size: 0.9rem;
  }
  .font-weight-bold {
    font-weight: bold;
  }
  .font-italic {
    font-style: italic;
  }
  code {
    font-family: Droid Mono, Menlo, Consolas, monospace;
    font-family: var(--font-family-mono);
    background-color: #f8f8f8;
    background-color: var(--color-gray-background);
    padding: 2px;
    border-radius: 2px;
  }

  /* Visibility */
  .invisible {
    visibility: hidden;
  }
  .hidden {
    display: none;
  }
  .hide-if-empty:empty {
    display: none;
  }

  /* Alerts */
  .alert {
    border: 2px solid #e5e5e5;
    border: 2px solid var(--color-border);
    border-radius: 4px;
    border-radius: var(--border-radius-content);
    padding: 16px 16px 14px;
    margin: 16px 0;
  }
  .alert.alert-danger {
    color: #a02c2c;
    border-color: #a02c2c;
  }
  .alert.alert-warning {
    color: #f6a902;
    border-color: #ffb400;
  }

  /* Background styles (experimental) */
  .alert,
  .background-dark {
    background-color: #f8f8f8;
    background-color: var(--color-gray-background);
  }
  .alert.alert-danger,
  .background-danger {
    background-color: #e9afaf;
  }
  .alert.alert-warning,
  .background-warning {
    background-color: #ffe6a5;
  }
  .background-ok {
    background-color: #c3e6cb;
  }

  /* Form elements */
  input,
  select,
  button,
  textarea {
    font-family: "Arial", sans-serif;
    font-family: var(--font-family);
    font-size: 0.9rem;
    line-height: 1.45;
    line-height: var(--line-height);
    border: 2px solid #e5e5e5;
    border: 2px solid var(--color-border);
    border-radius: 4px;
    border-radius: var(--border-radius-content);
    margin: 8px 0;
    padding: 8px;
  }
  input[type="checkbox"] {
    margin: 0 10px;
  }
  input[type="range"] {
    border: none;
  }
  input + label {
    margin-left: 2px;
  }
  select {
    padding: 8px 5px; /* selects have a weird vertical alignment */
  }
  button {
    background-color: white;
    border-radius: 3px;
    padding: 8px 8px 6px;
  }
  button:hover {
    border-color: #ddd;
    background-color: #fcfcfc;
  }
  textarea {
    display: block;
    margin: 18px 0;
    margin: var(--paragraph-margin-vertical) 0;
    resize: vertical;
  }
  /* Input groups */
  .input-group {
    display: inline-table;
    margin: 8px 0;
  }
  .input-group * {
    display: table-cell;
    border-radius: 0px;
  }
  .input-group input {
    margin: 0;
  }
  .input-group *:first-child {
    border-radius: 4px 0 0 4px;
  }
  .input-group *:last-child {
    border-radius: 0 4px 4px 0;
  }
  .input-group .input-group-addon {
    background-color: #e5e5e5;
    background-color: var(--color-border);
    border: 2px solid #e5e5e5;
    border: 2px solid var(--color-border);
    padding: 0 10px;
  }
  /* Page styles */
  #page-form .page-item-table td input[type="radio"],
  #page-form .page-item-table td input[type="checkbox"] {
    margin: 4px 0 10px;
  }
  #page-form .page-item-table td label {
    display: block;
  }
  #page-form .page-item-image img {
    text-align: center;
  }
  #page-form .page-item-image img {
    max-width: 100%;
  }

  /* Table */
  table {
    width: 100%;
    border-collapse: collapse;
  }
  table td,
  table th {
    padding: 10px 8px 8px;
  }
  /* Table borders (except for plain) */
  table:not(.table-plain) > tr > td,
  table:not(.table-plain) > tr > th,
  table:not(.table-plain) > thead > tr > td,
  table:not(.table-plain) > thead > tr > th,
  table:not(.table-plain) > tbody > tr > td,
  table:not(.table-plain) > tbody > tr > th {
    border-bottom: 2px solid #e5e5e5;
    border-bottom: 2px solid var(--color-border);
  }
  table:not(.table-plain) > tr:last-child > td,
  table:not(.table-plain) > tr:last-child > th,
  table:not(.table-plain) > tbody > tr:last-child > td,
  table:not(.table-plain) > tbody > tr:last-child > th {
    border-bottom: 2px solid transparent;
  }
  /* Striped rows */
  table.table-striped tr:nth-child(odd) td {
    background-color: #efefef;
    background-color: var(--color-border-internal);
  }
  table .sticky-top {
    /* Add background color to sticky table headers */
    background-color: white;
    background-color: var(--color-background);
  }

  /* Progress bar */
  .progress {
    width: 100%;
    height: 8px;
    overflow: hidden;
    margin: 0.2rem 0 0.4rem;
    border-radius: 2px;
    border: 1px solid #e5e5e5;
    border: 1px solid var(--color-border);
  }
  .progress .progress-bar {
    width: 0%;
    min-height: 8px;
    background-color: #f8f8f8;
    background-color: var(--color-gray-background);
    border-right: 1px solid #efefef;
    border-right: 1px solid var(--color-border-internal);
    box-sizing: content-box;
  }

  /* Popovers */
  .popover {
    position: absolute;
    top: 0;
    -webkit-animation-duration: 0.5s;
    animation-duration: 0.5s;
    -webkit-animation-name: popover;
    animation-name: popover;
  }

  /* Width, for some reason, needs to be set explicitly */
  .container.fullscreen .popover {
    width: calc(100vw - 2 * 24px);
    width: calc(100vw - 2 * var(--padding-internal));
  }
  /* Repeated for frameless mode on small screens */
  @media (max-width: 600px), (max-height: 600px) {
    .container.fullscreen .popover {
      width: 100vw;
    }
  }

  .popover > * {
    width: 80%;
    margin: 0 auto;
  }

  .container:not(.fullscreen) .popover {
    width: 900px;
    width: var(--width-container);
  }

  /* Slide in from the top */
  @-webkit-keyframes popover {
    from {
      -webkit-transform: translate3d(0, -100%, 0);
      transform: translate3d(0, -100%, 0);
    }

    to {
      -webkit-transform: none;
      transform: none;
    }
  }
  @keyframes popover {
    from {
      -webkit-transform: translate3d(0, -100%, 0);
      transform: translate3d(0, -100%, 0);
    }

    to {
      -webkit-transform: none;
      transform: none;
    }
  }

  .popover > .alert:first-child {
    border-width: 1px;
    position: relative;
    padding-top: 24px;
    top: -8px;
  }
`;

// the styles shared within all pages
export default function Labjs({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      {children}
    </ThemeProvider>
  );
}
