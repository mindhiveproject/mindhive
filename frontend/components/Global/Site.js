import PropTypes from "prop-types";
import { ThemeProvider, createGlobalStyle } from "styled-components";

import Meta from "./Meta";

const theme = {
// Design System: https://www.figma.com/design/AODZL5Cne8QAt0Yy9ZcKkM/Design-System?node-id=2275-1249&t=i5eXhFYKPtMSetWj-1

  // Colors

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
  html {
    --green: #007C70;
    --primary-blue: ${props => props.theme.primaryBlue};
    --secondary-blue: ${props => props.theme.secondaryBlue};
    --accent-blue: ${props => props.theme.accentBlue};
    --primary-green: ${props => props.theme.primaryGreen};
    --secondary-green: ${props => props.theme.secondaryGreen};
    --accent-green: ${props => props.theme.accentGreen};
    --primary-calyspo: ${props => props.theme.primaryCalyspo};
    --secondary-calyspo: ${props => props.theme.secondaryCalyspo};
    --accent-calyspo: ${props => props.theme.accentCalyspo};
    --primary-yellow: ${props => props.theme.primaryYellow};
    --secondary-yellow: ${props => props.theme.secondaryYellow};
    --accent-yellow: ${props => props.theme.accentYellow};
    --primary-red: ${props => props.theme.primaryRed};
    --secondary-red: ${props => props.theme.secondaryRed};
    --accent-red: ${props => props.theme.accentRed};
    --primary-purple: ${props => props.theme.primaryPurple};
    --secondary-purple: ${props => props.theme.secondaryPurple};
    --accent-purple: ${props => props.theme.accentPurple};
    --neutral-1: ${props => props.theme.neutral1};
    --neutral-2: ${props => props.theme.neutral2};
    --neutral-3: ${props => props.theme.neutral3};
    --neutral-4: ${props => props.theme.neutral4};
    --neutral-5: ${props => props.theme.neutral5};
    --neutral-6: ${props => props.theme.neutral6};

    box-sizing: border-box;
    font-size: 14px;
    height: 100%;
    font-family: 'Inter', sans-serif;
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
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    font-style: normal;
    color: #666666;
  }
  h1 {
    font: var(--MH-Type-Heading-Large, 700 46px/52px "Inter", sans-serif);
    letter-spacing: 0;
    font-style: normal;
    color: #1a1a1a;
  }
  h3 {
    font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
    letter-spacing: 0;
    font-style: normal;
    color: #666666;
  }
  a {
    text-decoration: none !important;
    color: var(--black);
  }
  a:hover {
    text-decoration: underline;
  }
  button {
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    background: transparent;
    border: none;
    border-radius: 0;
    color: inherit;
    padding: 0;
    cursor: pointer;
  }
  input {
    font-family: 'Inter', sans-serif;
  }
  textarea {
    font-family: 'Inter', sans-serif;
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
        font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
        letter-spacing: 0;
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
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
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
  .pushable {
    height: 100%;
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
    </ThemeProvider>
  );
}
