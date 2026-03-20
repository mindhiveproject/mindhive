import styled from "styled-components";

export const StyledDataArea = styled.div`
  display: grid;
  align-content: baseline;
  background: #f8f9f8;
  height: 100%;
`;

export const StyledDataJournal = styled.div`
  display: grid;
  align-content: baseline;
  height: 100%;
`;

export const StyledSidebar = styled.div`
  display: flex;
  flex-direction: column;
  grid-gap: 10px;
  padding: 10px;
  margin: 10px;
  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  border-radius: 16px;
  .collapsePanelBtn {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 10px;
    justify-content: flex-start;
  }
  .journals {
    display: grid;
    grid-gap: 10px;
    .journal {
      display: grid;
      grid-gap: 4px;
      margin: 10px 0px 28px 0px;
    }
    .titleHeader {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-gap: 8px;
      align-items: center;
    }
    .title {
      cursor: pointer;
      font-family: Nunito;
      font-weight: 400;
      font-style: Regular;
      font-size: 16px;
      leading-trim: NONE;
      line-height: 24px;
      letter-spacing: 0px;
      color: grey;
    }
    .selectedTitle {
      cursor: pointer;
      font-family: Nunito;
      font-weight: 700;
      font-style: Bold;
      font-size: 16px;
      leading-trim: NONE;
      line-height: 24px;
      letter-spacing: 0px;
    }
    .timestamp {
      color: #888888;
      font-family: Lato;
      font-weight: 300;
      font-style: Italic;
      font-size: 10px;
      leading-trim: NONE;
      line-height: 140%;
      letter-spacing: 0%;
    }
    .dataSource {
      font-family: Nunito;
      font-weight: 600;
      font-style: SemiBold;
      font-size: 12px;
      leading-trim: NONE;
      line-height: 16px;
      letter-spacing: 0px;
      background: #f6f9f8;
      padding: 5px 10px;
      width: fit-content;
    }
  }
  .workspaces {
    display: grid;
    grid-gap: 10px;
    margin: 10px 0px 10px 17px;

    font-family: Inter;
    font-size: 14px;
    leading-trim: NONE;
    line-height: 100%;
    letter-spacing: 0%;

    .titleLine {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-gap: 8px;
      align-items: center;
    }

    .workspace {
      display: grid;
      cursor: pointer;
      font-weight: 400;
      font-style: Regular;
    }
    .selectedWorkspace {
      display: grid;
      color: #5d5763;
      cursor: pointer;
      font-weight: 700;
      font-style: Bold;
    }
  }

  .components {
    display: grid;
    grid-gap: 10px;
    margin: 15px 0px 10px 17px;

    font-family: Inter;
    font-weight: 400;
    font-style: Regular;
    font-size: 14px;
    leading-trim: NONE;
    line-height: 100%;
    letter-spacing: 0%;

    .component {
      margin: 0px 0px 5px 0px;
      display: grid;
      grid-template-columns: auto 1fr;
      grid-gap: 8px;
      align-items: center;
    }
  }
  /* Change the default styles of the Dropdown Menu */
  .menu {
    border-radius: 8px !important;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07) !important;
  }
  /* Add the styles to the Dropdown Item inside the menu */
  .menuItem {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 12px;
    align-items: center;
    color: #000;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    cursor: pointer;
  }
  /* The button in the side menu */
  .menuButton {
    display: grid;
    text-align: center;
    padding: 11px 33px 11px 13px;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
    color: #000000;
    cursor: pointer;
  }
`;

export const StyledTopNavigation = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-gap: 10px;
  height: 56px;
  align-content: center;
  align-items: center;
  border-bottom: 1px solid #e6e6e6;
  background: white;
  .buttons {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-gap: 10px;
  }
  .leftIconNav {
    margin: 0px 8px 0px 12px;
    padding-right: 10px;
    display: flex;
    align-items: center;
    gap: 0;
    border-right: 1px solid #e6e6e6;
    .leftNavChip {
      min-width: 120px;
      justify-content: center;
    }
  }
`;

export const StyledDataComponent = styled.div`
  display: grid;
  align-content: baseline;
  textarea {
    width: 100%;
    min-height: 100px;
    resize: vertical;
  }
  .buttons {
    display: grid;
    grid-template-columns: auto auto;
    grid-gap: 10px;
    justify-content: end;
    margin-bottom: 10px;
    .actionIcon {
      color: #336f8a;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      &:hover {
        background: #f4f8f7;
      }
    }
  }
  .menuItemThreeDiv {
    display: grid;
    grid-template-columns: 15px auto;
    grid-column-gap: 12px;
    grid-row-gap: 7px;
    max-width: 250px;
    align-items: center;
    color: #000;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    cursor: pointer;
  }
  .menuItem {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 12px;
    align-items: center;
    color: #000;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    cursor: pointer;
  }
  .menuButton {
    padding: 11px 33px 11px 13px;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
    color: #000000;
    cursor: pointer;
  }
  .menuItemDataStruct {
    display: grid;
    grid-template-columns: 350px;
    grid-template-rows: 200px auto;
    padding: 20px;
    grid-gap: 12px;
    align-items: start;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    cursor: pointer;
    .img {
      width: 100%;
      height: auto;
    }
    div {
      display: flex;
      justify-content: start;
      width: 350px;
    }
    h3 {
      font-size: 18px;
      color: #007c70;
      margin: 0;
    }
    p {
      font-size: 14px;
      width: auto;
      margin: 0 4;
      word-break: break-word;
      white-space: normal;
    }
  }
`;

export const StyledRightPanel = styled.div`
  display: grid;
  align-content: baseline;
  grid-gap: 10px;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
  align-self: stretch;
  & > * {
    min-width: 0;
  }
  .editor-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
    h2 {
      margin: 0;
      min-width: 0;
      flex: 1 1 auto;
      overflow-wrap: break-word;
      word-break: break-word;
    }
  }
  .editor-header .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ui.tab {
    max-width: 100%;
  }
  .ui.menu {
    flex-wrap: wrap;
  }
  /* HypVis Variables tab: pane should fit the right rail; graph-dashboard CSS handles width */
  .graph .hypvis-tab-pane {
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    padding: 1rem;
  }
  .outputArea {
    width: 100%; /* ← takes full available width */
    box-sizing: border-box; /* ← very important! includes padding + border in width */
    /* Optional but very useful improvements */
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db; /* gray-300 */
    border-radius: 0.375rem;
    font-size: 1rem;
    line-height: 1.5;
    resize: vertical; /* or resize: none / both / horizontal */
    min-height: 80px;
    background-color: white;
  }
  /* globals.css or .module.css */
  .editor-wrapper {
    width: 100%;
    max-width: 100%;
    margin: 0;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
  }
  .runCodeButton {
    display: grid;
    margin: 10px 0px !important;
  }

  /* Optional: make sure CodeMirror doesn't fight the container */
  .editor-wrapper .cm-editor {
    width: 100% !important;
  }
`;

export const StyledComponentPanel = styled.div`
  display: grid;
  align-content: baseline;
  grid-gap: 10px;
  min-width: 300px;
  background: white;
  padding: 16px;
  overflow-y: auto;
  height: 100%;
  margin: 10px;
  box-shadow: 0px 2px 4px 0px #00000012;
  border-radius: 8px;
  .title {
    font-family: Nunito;
    font-weight: 700;
    font-style: Bold;
    font-size: 16px;
    leading-trim: NONE;
    line-height: 24px;
    letter-spacing: 0px;
    padding-bottom: 5px;
  }
  .subtitle {
    font-family: Nunito;
    font-weight: 700;
    font-style: Bold;
    font-size: 14px;
    leading-trim: NONE;
    line-height: 20px;
    letter-spacing: 0px;
    border-bottom: 1px solid lightgrey;
    padding-bottom: 5px;
  }
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 16px;
    margin: 10px 0px 20px 0px;
  }
  .card {
    cursor: pointer;
    border: 1px solid
      var(--State-Layers-On-Secondary-Container-Opacity-12, #4a44591f);
    border-radius: 8px;
    justify-items: center;
    padding: 5px;

    font-family: Nunito;
    font-weight: 600;
    font-style: SemiBold;
    font-size: 12px;
    leading-trim: NONE;
    line-height: 16px;
    letter-spacing: 0px;
    text-align: center;
    vertical-align: middle;
  }
`;

export const StyledDataWorkspace = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  align-content: baseline;
  background: #f8f9f8;
  gap: 10px;
  --dashboard-gap: 10px;
  /* Space between the left journal sidebar and the grid canvas when the sidebar is open */
  --left-panel-canvas-gap: 16px;
  --right-rail-width: clamp(380px, 36vw, 900px);

  /* Left journal sidebar: never show a box-shadow (Semantic UI + themes often add one) */
  .sidebar,
  .dashboardPushable .ui.sidebar,
  .dashboardPushable .ui.sidebar.visible,
  .dashboardPushable .ui.sidebar.animating {
    background: white;
    border: 1px solid #e6e6e6;
    border-left: none;
    /* Flush to the left: no radius on the outer (left) edge; keep radius toward the canvas */
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
    border-top-right-radius: 12px !important;
    border-bottom-right-radius: 12px !important;
    box-shadow: none !important;
  }

  .segment {
    border: none;
    background: none;
    box-shadow: none;
  }

  .datasets {
    display: grid;
    .datasetCard {
      display: grid;
    }
    .addDataset {
      display: grid;
    }
  }

  .dashboard {
    background: transparent;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    gap: var(--dashboard-gap);
    align-content: stretch;
    height: calc(100vh - 50px);
    min-width: 0;
    min-height: 0;

    &.hasRightPanel {
      grid-template-columns: minmax(0, 1fr) var(--right-rail-width);
    }

    .dashboardMain {
      min-width: 0;
      position: relative;
      display: grid;
      grid-template-rows: minmax(0, 1fr);
      gap: var(--dashboard-gap);
    }

    .openPanelBtnSlot {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 3;
    }

    .openPanelBtn {
      cursor: pointer;
      padding: 16px;
      border-radius: 12px;
      background: white;
      border: 1px solid #e6e6e6;
      box-shadow: 2px 2px 8px 0px #0000001a;
    }

    /* Semantic UI can apply margin-top on .ui.segment.pushable when sidebar is hidden — removes “extra padding” at top */
    .dashboardPushable.ui.segment.pushable {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }

    .dashboardPushable {
      min-width: 0;
      height: 100%;
      overflow: hidden;
    }

    .dashboardPusher {
      min-width: 0;
      min-height: 0;
      background: transparent;
    }

    &.hasLeftSidebar .dashboardPusher {
      padding-left: var(--left-panel-canvas-gap);
      box-sizing: border-box;
    }

    .dashboardRightRail {
      min-width: 0;
      min-height: 0;
      height: 100%;
      overflow: hidden;
      display: grid;
      grid-template-rows: minmax(0, 1fr);
      align-content: stretch;
      align-items: stretch;
    }
  }
  .canvas {
    display: grid;
    width: 100%;
    min-width: 0;
    min-height: 80vh;

    background: white;
    // box-shadow: 2px 2px 8px 0px #0000001a;
    border: 1px solid #e6e6e6;
    border-radius: 12px;

    .widgetContainer {
      border-radius: 14px;
      &:hover {
        outline: 2px solid #e6e6e6;
        outline-offset: 2px;
      }
    }
  }
  .graph {
    display: grid;

    .displayContainer {
      display: grid;
      grid-template-columns: 2fr 1fr;
      grid-gap: 10px;
    }

    .graphContainer {
      display: grid;
    }

    .templates {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-gap: 12px;
      margin: 0px 0px 40px 0px;
      .template {
        display: grid;
        grid-template-columns: 1fr 4fr;
        grid-gap: 13px;
        border-radius: 8px;
        border: 1px solid #e6e6e6;
        cursor: pointer;
        padding: 22px 40px 22px 23px;
        align-content: center;
        .text {
          display: grid;
          grid-gap: 0px;
          .title {
            color: #000;
            font-family: Inter;
            font-size: 14px;
            font-style: normal;
            font-weight: 500;
            line-height: 150%;
          }
          .description {
            color: var(--gray-500666666, #666);
            font-family: Inter;
            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: 150%;
          }
        }
      }
    }

    .graphRenderContainer {
      display: grid;
      grid-template-columns: 1fr;
      grid-gap: 10px;
      justify-content: center;
      box-shadow: 0px 2px 20px 0px rgba(0, 0, 0, 0.07);
      border-radius: 8px;

      .dashboardContainer {
      }
    }
    .tableRenderContainer {
      display: grid;
      grid-template-columns: 1fr;
      justify-content: center;
      max-width: 100%;
      margin: 20px 0px;
    }
    .graphArea {
      display: grid;
      justify-content: center;
      max-height: 80vh;
    }
    .selectors {
      display: grid;
      margin: 20px;
      grid-gap: 21px;
      .header {
        display: grid;
        grid-gap: 10px;
        grid-template-columns: auto 1fr;
        font-weight: bold;
        font-size: 18px;
        margin: 10px 0px 10px 0px;
      }
    }
    .selectorsTestStats {
      display: grid;
      grid-gap: 21px;
    }
    .selectorsStats {
      margin: 20px clamp(12px, 4vw, 48px) 50px;
      display: grid;
      grid-gap: 41px;
    }
    .selectorLine {
      display: grid;
      grid-template-columns: minmax(max-content, 200px) 1fr;
      border-radius: 8px;
      border: 1px solid #eaeaea;
      background: #fff;
      box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.04);
      color: #4bb3a3;
      font-family: Inter;
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: 150%;
      .title {
        display: grid;
        align-content: center;
        justify-content: end;
        background: #eaeaea;
        padding: 9px 13px;
      }
      .select {
        .dropdown {
          border: 0;
        }
        select {
          border: 0px;
          height: 100%;
          padding: 9px 13px;
          min-width: 98%;
          max-width: 200px;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
        }
      }
    }
    .customTabs {
      display: grid;
      grid-template-rows: auto 1fr;
      /* .menu {
        display: grid;
        grid-template-columns: repeat(3, auto);
        grid-gap: 10px;
        padding: 10px;
        background: #f8f9f8;
        border-bottom: 1px solid #e6e6e6;
        .item {
          font-family: Nunito;
          font-weight: 600;
          font-size: 14px;
          line-height: 20px;
          padding: 10px 20px;
          cursor: pointer;
          border-radius: 8px;
          color: #666;
          &.active {
            background: #336f8a;
            color: white;
            font-weight: 700;
          }
        }
      } */
      .item {
        font-family: Nunito;
        font-weight: 600;
        font-size: 14px;
        line-height: 20px;
        padding: 10px 20px;
        cursor: pointer;
        border-radius: 8px;
        color: #666;
        &.active {
          background: #336f8a;
          color: white;
          font-weight: 700;
        }
      }
      .tabContent {
        padding: 20px;
        background: white;
        border-radius: 0 0 10px 10px;
        box-shadow: 0px 2px 20px 0px rgba(0, 0, 0, 0.07);
        .styleLayoutContainer {
          display: grid;
          grid-gap: 10px;
          h3 {
            font-family: Nunito;
            font-weight: 700;
            font-size: 16px;
            line-height: 24px;
            color: #333;
          }
          p {
            font-family: Inter;
            font-size: 14px;
            line-height: 150%;
            color: #666;
          }
        }
      }
    }
  }
  .graphDashboard {
    display: grid;
    margin: 0px 10px 20px 10px;

    .header {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: auto 1fr;
      font-size: 18px;
      font-weight: bold;
      margin: 0px 0px 10px 0px;
    }
    .subheader {
      background: #f1f7f6;
      padding: 10px;
    }
    .subsection {
      display: grid;
      grid-gap: 8px;
      padding: 10px 10px;
    }
    .title {
      color: #666666;
    }
    .ranges {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 100px 100px;
    }
    label {
      display: block;
      font-style: normal;
      font-weight: normal;
      font-size: 14px;
      line-height: 20px;
    }
    input,
    textarea,
    select {
      font-family: Lato;
      height: 48px;
      border: 1px solid #cccccc;
      border-radius: 10px;
      width: 100%;
      font-size: 16px;
      line-height: 24px;
      padding: 12px;
      &:focus {
        outline: 0;
        border-color: ${(props) => props.theme.red};
      }
    }
  }

  .graph-dashboard {
    color: inherit;
    display: flex;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    align-self: stretch;
    padding: 20px 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 22px;

    border-radius: 16px;
    background: var(--Schemes-On-Primary, #fff);

    .ui.selection.dropdown {
      min-width: 0 !important;
      max-width: 100%;
    }

    .ui.selection.dropdown > .dropdown.icon {
      flex-shrink: 0;
    }

    input.input-box,
    input.input-box-number,
    textarea.input-box {
      font-family: Nunito, sans-serif;
      font-size: 14px;
      line-height: 20px;
    }

    .header {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;

      .header-title {
        color: var(--MH-Theme-Tertiary-Dark, #0d3944);

        /* MH-Theme/title/base */
        font-family: Nunito;
        font-size: 16px;
        font-style: normal;
        font-weight: 900;
        line-height: 24px; /* 150% */
      }
    }

    .text-input {
      display: flex;
      box-sizing: border-box;
      min-width: 0;
      width: 100%;
      padding: 0px 10px;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      align-self: stretch;

      .header-text {
        color: var(--MH-Theme-Neutrals-Black, #171717);

        /* MH-Theme/body/small */
        font-family: "Nunito";
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        line-height: 16px; /* 133.333% */
      }

      .input-box {
        display: flex;
        box-sizing: border-box;
        min-width: 0;
        width: 100%;
        min-height: 40px;
        padding: 4px 16px;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        align-self: stretch;

        border-radius: 8px;
        border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
      }

      .input-box-number {
        display: flex;
        height: 40px;
        padding: 4px 16px;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;

        border-radius: 8px;
        border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
      }
    }

    .parameter-panel {
      display: flex;
      box-sizing: border-box;
      min-width: 0;
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      align-self: stretch;

      .header {
        display: flex;
        padding: 8px 10px;
        justify-content: space-between;
        align-items: center;
        align-self: stretch;

        border-bottom: 1px solid var(--Schemes-On-Secondary-Container, #4a4459);

        .header-title {
          color: var(--MH-Theme-Neutrals-Black, #171717);

          /* MH-Theme/title/base */
          font-family: Nunito;
          font-size: 16px;
          font-style: normal;
          font-weight: 700;
          line-height: 24px; /* 150% */
        }
      }
    }

    .button-panel {
      display: flex;
      flex-wrap: wrap;
      padding: 3px 10px;
      align-items: center;
      gap: 10px;
      width: 100%;
      box-sizing: border-box;

      .clipboard-copy-button {
        display: flex;
        padding: 3px 10px;
        align-items: center;
        gap: 10px;

        border-radius: 4px;
        background: var(--MH-Theme-Tertiary-Lighter, #f4f8f7);
      }

      .clipboard-fig-copy-button {
        display: flex;
        padding: 3px 10px;
        align-items: center;
        gap: 10px;

        border-radius: 4px;
        background: var(--MH-Theme-Tertiary-Lighter, #f3f3f3);
      }

      .clipboard-AI-copy-button {
        display: flex;
        padding: 3px 10px;
        align-items: center;
        gap: 10px;

        border-radius: 4px;
        background: var(--MH-Theme-Tertiary-Lighter, #fdf2d0);
      }
    }

    .fill-in-the-blanks {
      display: flex;
      padding: 0px 10px;
      align-items: center;
      align-content: center;
      gap: 8px;
      align-self: stretch;
      flex-wrap: wrap;

      .text {
        color: var(--MH-Theme-Neutrals-Black, #171717);

        /* MH-Theme/body/small */
        font-family: "Nunito";
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        line-height: 16px; /* 133.333% */
      }

      .a-blank {
        border: none;
        border-radius: 0px;
        display: flex;
        align-items: center;

        border-bottom: 1px solid var(--MH-Theme-Primary-Medium, #a3d6db);
        margin-bottom: -1px;
        background: var(--MH-Theme-Neutrals-White, #fff);
      }
    }

    .ranks-grid-l1 {
      display: flex;
      padding: 0px 8px;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 4px;
      align-self: stretch;
    }

    .fill-in-ranks {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      align-self: stretch;
      min-width: 0;

      input[type="range"] {
        min-width: 120px;
        flex: 1 1 160px;
        max-width: 100%;
      }

      .text {
        color: var(--MH-Theme-Neutrals-Black, #171717);

        /* MH-Theme/body/small */
        font-family: "Nunito";
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        line-height: 16px; /* 133.333% */
      }

      .a-blank {
        border: none;
        border-radius: 0px;
        display: flex;
        align-items: center;

        border-bottom: 1px solid var(--MH-Theme-Primary-Medium, #a3d6db);
        margin-bottom: -1px;
        background: var(--MH-Theme-Neutrals-White, #fff);
      }
    }
  }

  .addNewChapter {
    display: flex;
    height: 40px;
    padding: 8px 24px;
    justify-content: center;
    align-items: center;
    gap: 8px;
    border-radius: 100px;
    border: 1px solid var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

export const StyledDatasetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

export const StyledAddDataset = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f8f9f8;
  color: #336f8a;
  padding: 12px 24px;
  border: 2px dashed #336f8a;
  border-radius: 8px;
  cursor: pointer;
  font-family: Nunito;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: #336f8a;
    color: white;
  }
`;

export const StyledDatasetCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  border: 1px solid #e6e6e6;
  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .dataset-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .dataset-title {
    font-family: Nunito;
    font-weight: 600;
    font-size: 16px;
    line-height: 20px;
    color: #333;
    margin: 0;
    flex: 1;
  }

  .dataset-actions {
    display: flex;
    gap: 8px;
    margin-left: 10px;
  }

  .edit-btn,
  .delete-btn {
    background: #336f8a;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    font-family: Inter;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover:not(:disabled) {
      background: #2a5a6f;
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }

  .delete-btn {
    background: #ff4d4d;

    &:hover:not(:disabled) {
      background: #cc0000;
    }
  }

  .dataset-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .origin-badge {
    background: #f0f8f7;
    color: #336f8a;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    font-family: Inter;
    align-self: flex-start;
    max-width: fit-content;
  }

  .dataset-info {
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: #666;
    font-family: Inter;
  }

  .author {
    font-weight: 500;
  }

  .updated {
    color: #999;
  }
`;

export const StyledDatasetView = styled.div`
  .dataset-view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e6e6e6;

    h2 {
      margin: 0;
      font-family: Nunito;
      font-weight: 700;
      font-size: 24px;
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .refresh-btn,
    .close-btn {
      background: #336f8a;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-family: Inter;
      font-size: 14px;

      &:hover {
        background: #2a5a6f;
      }
    }

    .close-btn {
      background: #ff4d4d;

      &:hover {
        background: #cc0000;
      }
    }
  }

  .dataset-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 20px;
    border-bottom: 1px solid #e6e6e6;

    .tab-btn {
      background: none;
      border: none;
      padding: 12px 24px;
      cursor: pointer;
      font-family: Nunito;
      font-weight: 600;
      font-size: 14px;
      color: #666;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;

      &:hover {
        color: #336f8a;
      }

      &.active {
        color: #336f8a;
        border-bottom-color: #336f8a;
      }
    }
  }

  .dataset-content {
    min-height: 400px;
  }

  .preview-container,
  .data-container,
  .settings-container {
    h4 {
      font-family: Nunito;
      font-weight: 600;
      font-size: 18px;
      margin-bottom: 15px;
      color: #333;
    }
  }

  .table-container {
    overflow-x: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    table {
      width: 100%;
      border-collapse: collapse;
      background: white;

      th,
      td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #e6e6e6;
        font-family: Inter;
        font-size: 14px;
      }

      th {
        background: #f8f9f8;
        font-weight: 600;
        color: #333;
        position: sticky;
        top: 0;
      }

      tr:hover {
        background: #f8f9f8;
      }

      tbody tr:last-child td {
        border-bottom: none;
      }
    }
  }

  .row-count {
    margin-top: 10px;
    font-size: 12px;
    color: #666;
    font-style: italic;
  }

  .settings-container {
    pre {
      background: #f8f9f8;
      padding: 16px;
      border-radius: 8px;
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }

  .dataset-footer {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #e6e6e6;
    font-size: 12px;
    color: #666;
    font-family: Inter;
  }
`;

export const StyledDataSourceLabels = styled.span`
  font-family: Inter;
  font-weight: 500;
  font-size: 12px;
  color: #336f8a;
  margin-left: 8px;
`;
