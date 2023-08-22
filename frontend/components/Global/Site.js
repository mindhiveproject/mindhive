import PropTypes from "prop-types";
import { ThemeProvider, createGlobalStyle } from "styled-components";

import Meta from "./Meta";

const theme = {
  red: "#FF0000",
  black: "#393939",
  grey: "#666666",
  white: "#FFFFFF",
  yellow: "yellow",
  lightgrey: "#E1E1E1",
  darkgreen: "#007C70",
  offWhite: "#EDEDED",
  maxWidth: "1300px",
  bs: "0 12px 24px 0 rgba(0, 0, 0, 0.09)",
};

const GlobalStyles = createGlobalStyle`
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
  .primaryBtn {
    background: var(--green);
  }
  .secondaryBtn {
    background: var(--lightGrey);
    color: var(--grey);
    font-weight: normal;
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
