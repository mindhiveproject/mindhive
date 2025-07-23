import PropTypes from "prop-types";
import { ThemeProvider, createGlobalStyle } from "styled-components";

import Meta from "./Meta";
import HelpCenter from "./HelpCenter"; // Import the HelpCenter component

const theme = {
// Design System: https://www.figma.com/design/AODZL5Cne8QAt0Yy9ZcKkM/Design-System?node-id=2275-1249&t=i5eXhFYKPtMSetWj-1

  // Blues
  primaryBlue:   "#265390",  
  secondaryBlue: "#3D85B0",  
  accentBlue:    "#D3E2F1",  
  //Greens
  primaryGreen:   "#274E5B",  
  secondaryGreen: "#55808C",  
  accentGreen:    "#E0FAF8",  
  //Calypsos
  primaryCalyspo:   "#336F8A",  
  secondaryCalyspo: "#69BBC4",  
  accentCalyspo:    "#DEF8FB",  
  //Yellows
  primaryYellow:   "#F2BE42",  
  secondaryYellow: "#F9D978",  
  accentYellow:    "#FDF2D0",  
  //Reds
  primaryRed:   "#B9261A",  
  secondaryRed: "#CF6D6A",  
  accentRed:    "#EDCECD",  
  //Purples
  primaryPurple:   "#8A2CF6",  
  secondaryPurple: "#7D70AD",  
  accentPurple:    "#D8D3E7",  
  //Neutrals (darker >> ligher)
  neutral1: "#171717",  
  neutral2: "#434343",  
  neutral3: "#625B71",  
  neutral4: "#EFEFEF",  
  neutral5: "#F3F3F3",  
  neutral6: "#FFFFFF",  
  
  //Old color scheme //////////////////
  red: "#FF0000",
  black: "#393939",
  grey: "#666666",
  white: "#FFFFFF",
  yellow: "yellow",
  lightgrey: "#E1E1E1",
  darkgreen: "#007C70",
  offWhite: "#EDEDED",

  // Breakpoints
  maxWidth: "2300px",

  // Bootstrap
  bs: "0 12px 24px 0 rgba(0, 0, 0, 0.09)",
};

const GlobalStyles = createGlobalStyle`
  @import url("https://fonts.googleapis.com/css?family=Nunito");
  @import url("https://fonts.googleapis.com/css?family=Lato");
  @import url("https://fonts.googleapis.com/css?family=Roboto");
  @import url("https://fonts.googleapis.com/css?family=Inconsolata");
  @import url("https://fonts.googleapis.com/css?family=Inter");
  html {
    --green: #007C70;
    box-sizing: border-box;
    font-size: 10px;
    height: 100%;
    font-family: 'Lato';
  }
  *, *:before, *:after {
    box-sizing: inherit;
  }
  body {
    padding: 0;
    margin: 0;
    display: grid;
    height: 100%;
  }
  p {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 24px;
    color: #666666;
  }
  h1 {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 48px;
    line-height: 56px;
    color: #1a1a1a;
  }
  h3 {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 24px;
    line-height: 32px;
    color: #666666;
  }
  a {
    text-decoration: none !important;
    color: var(--black);
    font-family: 'Raleway', --apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  a:hover {
    text-decoration: underline;
  }
  button {
    font-family: 'Lato';
    background: var(--green);
    border: 2px solid var(--green);
    border-radius: 4px;
    color: white;
    font-style: normal;
    font-weight: 400;
    font-size: 18px;
    line-height: 100%;
    padding: 10px 15px;
    cursor: pointer;
  }
  input {
    font-family: 'Raleway', --apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  textarea {
    font-family: 'Raleway', --apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  .menu {
      width: 100%;
      display: grid;
      grid-gap: 10px;
      grid-template-columns: repeat(auto-fill, 150px);
      margin: 10px 0px 0px 0px;    
      .menuTitle {
        display: grid;
        align-items: center;
        justify-items: center;
        grid-template-columns: 1fr;
        border-bottom: 2px solid #e8ebef;
        padding-bottom: 10px;
        cursor: pointer;
      }
      .titleWithIcon {
        display: grid;
        grid-gap: 5px;
        grid-template-columns: auto 1fr;
      }
      .selectedMenuTitle {
        border-bottom: 4px solid #ffc107;
      }
    }
  .board {
    display: grid;
    .wrapper {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 1fr 100px;
      align-items: center;
    }
    .heading {
      display: grid;
      padding: 1.5rem 1rem;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      p {
        font-weight: bold
      }
    }
    .item {
      display: grid;
      padding: 1.5rem 1rem;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      cursor: pointer;
      box-shadow: 0px 2px 4px 0px #00000026;
      transition: box-shadow 300ms ease-out;
      :hover {
        box-shadow: 0px 2px 24px 0px #0000001a;
      }
    }
  }
  .cardBoard {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-column-gap: 26px;
    grid-row-gap: 26px;
    @media (max-width: 500px) {
      grid-template-columns: 1fr;
    }
  }
  .modalButtons {
    margin: 10px;
  }
  .primaryBtn {
    background: var(--green);
    margin-left: 10px;
  }
  .secondaryBtn {
    background: var(--lightGrey);
    color: var(--grey);
    font-weight: normal;
    margin-left: 10px;
  }
  .iconTitle {
    display: grid;
    grid-gap: 5px;
    grid-template-columns: auto 1fr;
    align-items: center;
  }
  .titleIcon {
    display: grid;
    grid-gap: 5px;
    grid-template-columns: 1fr auto;
    align-items: center;
  }
  .pushableSidebar {
    min-width: 1000px;
  }
  .jodit_fullsize {
    position: relative !important;
    inset: auto !important;
  }
`;

// the styles shared within all pages
export default function Site({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Meta />
      {children}
      <HelpCenter />
    </ThemeProvider>
  );
}
