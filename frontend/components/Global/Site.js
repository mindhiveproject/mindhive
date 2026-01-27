import PropTypes from "prop-types";
import { ThemeProvider, createGlobalStyle } from "styled-components";

import Meta from "./Meta";

const theme = {
// Design System: https://www.figma.com/design/AODZL5Cne8QAt0Yy9ZcKkM/Design-System?node-id=2275-1249&t=i5eXhFYKPtMSetWj-1

  // Typography

  titleLarge: {
    color: "var(--MH-Theme-Neutrals-Black, #171717)",
    fontFamily: "Nunito, sans-serif",
    fontSize: "22px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "28px", // 127.273%
  },
  
  titleBase: {
    color: "#171717",
    fontFamily: "Nunito, sans-serif",
    fontSize: "16px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "24px"
  },

  titleSmall: {
    color: "var(--MH-Theme-Neutrals-Black, #171717)",
    fontFamily: "Nunito, sans-serif",
    fontSize: "14px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "20px"
  },

  bodyLarge: {
    color: "var(--MH-Theme-Neutrals-Black, #171717)",
    fontFamily: "Nunito Sans",
    fontSize: "22px",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "28px"
  },

  bodyBase: {
    color: "var(--MH-Theme-Neutrals-Black, #171717)",
    fontFamily: "Nunito Sans",
    fontSize: "16px",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "24px"
  },

  bodySmall: {
    color: "var(--MH-Theme-Neutrals-Black, #171717)",
    fontFamily: "Nunito Sans",
    fontSize: "12px",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "16px"
  },
  labelLarge: {
    color: "var(--MH-Theme-Neutrals-Black, #171717)",
    fontFamily: "Nunito Sans",
    fontSize: "16px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "24px"
  },

  labelBase: {
    color: "var(--MH-Theme-Neutrals-Black, #171717)",
    fontFamily: "Nunito Sans",
    fontSize: "14px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "20px"
  },

  labelSmall: {
    color: "var(--MH-Theme-Neutrals-Black, #171717)",
    fontFamily: "Nunito Sans",
    fontSize: "12px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "16px"
  },

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
  @import url("https://fonts.googleapis.com/css?family=Lato");
  @import url("https://fonts.googleapis.com/css?family=Roboto");
  @import url("https://fonts.googleapis.com/css?family=Inconsolata");
  @import url("https://fonts.googleapis.com/css?family=Inter");
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
    
    /* Typography CSS Variables */
    --title-large-font-family: ${props => props.theme.titleLarge.fontFamily};
    --title-large-font-size: ${props => props.theme.titleLarge.fontSize};
    --title-large-font-weight: ${props => props.theme.titleLarge.fontWeight};
    --title-large-line-height: ${props => props.theme.titleLarge.lineHeight};
    --title-large-color: ${props => props.theme.titleLarge.color};
    
    --title-base-font-family: ${props => props.theme.titleBase.fontFamily};
    --title-base-font-size: ${props => props.theme.titleBase.fontSize};
    --title-base-font-weight: ${props => props.theme.titleBase.fontWeight};
    --title-base-line-height: ${props => props.theme.titleBase.lineHeight};
    --title-base-color: ${props => props.theme.titleBase.color};
    
    --title-small-font-family: ${props => props.theme.titleSmall.fontFamily};
    --title-small-font-size: ${props => props.theme.titleSmall.fontSize};
    --title-small-font-weight: ${props => props.theme.titleSmall.fontWeight};
    --title-small-line-height: ${props => props.theme.titleSmall.lineHeight};
    --title-small-color: ${props => props.theme.titleSmall.color};
    
    --body-large-font-family: ${props => props.theme.bodyLarge.fontFamily};
    --body-large-font-size: ${props => props.theme.bodyLarge.fontSize};
    --body-large-font-weight: ${props => props.theme.bodyLarge.fontWeight};
    --body-large-line-height: ${props => props.theme.bodyLarge.lineHeight};
    --body-large-color: ${props => props.theme.bodyLarge.color};
    
    --body-base-font-family: ${props => props.theme.bodyBase.fontFamily};
    --body-base-font-size: ${props => props.theme.bodyBase.fontSize};
    --body-base-font-weight: ${props => props.theme.bodyBase.fontWeight};
    --body-base-line-height: ${props => props.theme.bodyBase.lineHeight};
    --body-base-color: ${props => props.theme.bodyBase.color};
    
    --body-small-font-family: ${props => props.theme.bodySmall.fontFamily};
    --body-small-font-size: ${props => props.theme.bodySmall.fontSize};
    --body-small-font-weight: ${props => props.theme.bodySmall.fontWeight};
    --body-small-line-height: ${props => props.theme.bodySmall.lineHeight};
    --body-small-color: ${props => props.theme.bodySmall.color};
    
    --label-large-font-family: ${props => props.theme.labelLarge.fontFamily};
    --label-large-font-size: ${props => props.theme.labelLarge.fontSize};
    --label-large-font-weight: ${props => props.theme.labelLarge.fontWeight};
    --label-large-line-height: ${props => props.theme.labelLarge.lineHeight};
    --label-large-color: ${props => props.theme.labelLarge.color};
    
    --label-base-font-family: ${props => props.theme.labelBase.fontFamily};
    --label-base-font-size: ${props => props.theme.labelBase.fontSize};
    --label-base-font-weight: ${props => props.theme.labelBase.fontWeight};
    --label-base-line-height: ${props => props.theme.labelBase.lineHeight};
    --label-base-color: ${props => props.theme.labelBase.color};
    
    --label-small-font-family: ${props => props.theme.labelSmall.fontFamily};
    --label-small-font-size: ${props => props.theme.labelSmall.fontSize};
    --label-small-font-weight: ${props => props.theme.labelSmall.fontWeight};
    --label-small-line-height: ${props => props.theme.labelSmall.lineHeight};
    --label-small-color: ${props => props.theme.labelSmall.color};
    
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
