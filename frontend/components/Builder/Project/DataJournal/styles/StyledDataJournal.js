import styled, { css } from "styled-components";

/** Keep overflow scroll behavior without showing scrollbars (Chrome / Firefox / legacy Edge). */
const hideScrollbars = css`
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
`;

/** Collapsible data layout panel (graph bar plot + statistical test axes under .selectorsStats) */
const barPlotDataFormatPanelStyles = css`
  .barPlotDataFormat {
    display: grid;
    grid-gap: 10px;
    min-width: 0;
    max-width: 100%;
  }
  .barPlotDataFormat__panel {
    display: grid;
    grid-gap: 12px;
    min-width: 0;
    max-width: 100%;
    padding-top: 2px;
    box-sizing: border-box;
  }
  .barPlotDataFormat__card {
    display: grid;
    grid-gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid #e6e6e6;
    background: #ffffff;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }
  .barPlotDataFormat__figureWrap {
    width: 70%;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
    box-sizing: border-box;
  }
  .barPlotDataFormat__figure {
    display: block;
    width: 100%;
    height: auto;
    vertical-align: top;
  }
  .barPlotDataFormat__title {
    margin: 0;
    font-family: Inter, sans-serif;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.35;
    color: #171717;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    line-clamp: 4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .barPlotDataFormat__desc {
    margin: 0;
    font-family: Inter, sans-serif;
    font-size: 14px;
    line-height: 1.45;
    color: #5d5763;
    overflow-wrap: break-word;
  }
  .barPlotDataFormat__slides {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
    font-family: Inter, sans-serif;
    font-size: 13px;
    line-height: 1.4;
    min-width: 0;
  }
  .barPlotDataFormat__slides img {
    flex-shrink: 0;
    margin-top: 1px;
  }
  .barPlotDataFormat__slides a {
    color: var(--MH-Theme-Primary-Base, #7D70AD);
    text-decoration: underline;
    word-break: break-word;
  }
`;

export const StyledDataArea = styled.div`
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  align-content: stretch;
  background: #f8f9f8;
  height: 100%;
  min-height: 0;
`;

export const StyledDataJournal = styled.div`
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  align-content: stretch;
  height: 100%;
  min-height: 0;
`;

export const StyledSidebar = styled.div`
  display: flex;
  flex-direction: column;
  grid-gap: 10px;
  margin: 10px;
  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  border-radius: 16px;
  .navigationPanelHeader {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    .collapsePanelBtn {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-start;
      .collapsePanelBtnIcon {
        opacity: 0.5;
      }
    }
  }
  .journals {
    display: grid;
    .journal {
      display: grid;
      grid-gap: 4px;
      margin-bottom: 20px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
      background: #ffffff;
      box-sizing: border-box;
      transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .journal:not(.journal--selected):hover {
      background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
      border-color: var(--MH-Theme-Neutrals-Medium, #a1a1a1);
      box-shadow: var(--MH-Theme-Elevation-Medium, 2px 2px 8px rgba(0, 0, 0, 0.08));
    }
    .journal.journal--selected {
      border: 1.5px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
    }
    .journal.journal--selected:hover {
      background: #F6F9F8;
      border-color: var(--MH-Theme-Primary-Base, #E6E6E6);
    }
    .titleHeader {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-gap: 8px;
      align-items: center;
    }
    .journalTitleButton {
      margin: 0;
      padding: 0;
      border: none;
      background: none;
      text-align: left;
      font: inherit;
      color: inherit;
      cursor: pointer;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      line-clamp: 4;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .journalTitleButton:focus-visible {
      outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
      outline-offset: 2px;
      border-radius: 4px;
    }
    .title { 
      font-family: Inter, sans-serif;
      font-weight: 400;
      font-size: 16px;
      line-height: 24px;
      letter-spacing: 0;
      color: #888888;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      line-clamp: 4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .selectedTitle {
      font-family: Inter, sans-serif;
      font-weight: 700;
      font-size: 16px;
      line-height: 24px;
      letter-spacing: 0;
      color: inherit;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      line-clamp: 4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .dataSourceRow {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      background: transparent;
      // padding: 8px 10px;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    .dataSourceChips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .addActionsRow {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin: 8px 0;
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

    .workspaceRowLabel {
      min-width: 0;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: left;
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

    .dataJournalWorkspaceRowBtn:hover {
      background-color: #FDF2D0 !important;
    }
  }
  
  .createJournalBtn {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;

    > div > button {
      transition: background-color 0.15s ease, box-shadow 0.15s ease;
    }

    &:hover > div > button {
      background-color: #e8eeec !important;
      box-shadow: var(
        --MH-Theme-Elevation-Medium,
        0 1px 4px rgba(0, 0, 0, 0.08)
      );
    }
  }

  .addWorkspaceBtn,
  .addComponentBtn {
    display: flex;
    width: fit-content;
    justify-content: center;
    align-items: center;
    border-radius: 8px;

    > div > button,
    > button {
      transition: background-color 0.15s ease, box-shadow 0.15s ease;
    }

    &:hover > div > button,
    &:hover > button {
      background-color: #e8eeec !important;
      box-shadow: var(
        --MH-Theme-Elevation-Medium,
        0 1px 4px rgba(0, 0, 0, 0.08)
      );
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
  padding: 8px;
  .buttons {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
  }
  .topNavJournalActions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    justify-content: flex-end;
  }
  /* TopNav is under StyledDataWorkspace, not StyledDataJournal — mirror journal pill hovers here */
  .addWorkspaceBtn,
  .addComponentBtn {
    display: flex;
    width: fit-content;
    justify-content: center;
    align-items: center;
    border-radius: 8px;

    > div > button,
    > button {
      transition: background-color 0.15s ease, box-shadow 0.15s ease;
    }

    &:hover > div > button,
    &:hover > button {
      background-color: #e8eeec !important;
      box-shadow: var(
        --MH-Theme-Elevation-Medium,
        0 1px 4px rgba(0, 0, 0, 0.08)
      );
    }
  }
  .leftIconNav {
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
  margin: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 12px;
  box-sizing: border-box;
  overflow-x: hidden;
  ${hideScrollbars}
  height: 100%;
  align-self: stretch;
  & > * {
    min-width: 0;
  }
  .editorPanelBody {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e6e6e6;
    padding: 12px 14px 16px;
    overflow-x: visible;
    overflow-y: visible;
    ${hideScrollbars}

    /* TipTap (paragraph panel): flush content chrome; one vertical scroller on this panel */
    .tiptapEditor {
      max-width: 100%;
      border-radius: 0;
      border-top: 1px solid #E6E6E6;
    }
    .editorContainer {
      margin-top: 0;
    }
    .tiptapEditor .ProseMirror {
      border: none;
      border-radius: 0;
      padding: 0;
      margin: 0;
      max-height: none;
      overflow-x: visible;
      overflow-y: visible;
    }

    .tiptapEditorHost {
      position: relative;
      width: 100%;
      min-width: 0;
      min-height: 5.5rem;
    }
    .tiptapEditorHost .tiptapEmptyInvite {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      margin: 1rem 0 0 0;
      width: fit-content;
      height: fit-content;
      pointer-events: none;
      color: #5D5763;
      border: 1px solid #5D5763;
      background-color: #F6F9F8;
      border-radius: 12px;
      padding: 0.5rem 1rem;
      font-family: Inter, sans-serif;
      font-size: 15px;
      line-height: 150%;
      font-weight: 400;
      font-style: italic;
    }
  }
  .editor-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: flex-start;
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

  .editor-wrapper .cm-scroller {
    ${hideScrollbars}
  }

  .editor-header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-gap: 8px;
    align-items: center;
    .editor-component-name-input {

      input {
        font-family: Lato;
        border: 1px solid #cccccc;
        border-radius: 10px;
        width: 100%;
        padding: 12px;
        &:focus {
          outline: 0;
          border-color: #69BBC4;
        }
      }
    }
    .editor-component-name {
      display: flex;
      flex-direction: row;
      grid-template-columns: auto 1fr;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #d3e0e3;
      padding: 2px 8px 2px 16px;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      .editor-component-title {
        min-width: 0;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        line-clamp: 4;
        text-overflow: ellipsis;
        white-space: normal;
        word-break: break-word;
      }
    }
    .button {
      cursor: pointer;
    }
  }

  .datasets .datasets-list-intro {
    margin: 0 0 16px;
    max-width: 720px;
    font-family: Inter, sans-serif;
    font-size: 14px;
    line-height: 1.45;
    color: #4a5568;
  }
`;

export const StyledComponentPanel = styled.div`
  display: grid;
  align-content: baseline;
  grid-gap: 10px;
  min-width: 0;
  width: auto;
  background: white;
  padding: 12px;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and legacy Edge */
  height: 100%;
  margin: 10px 8px 10px 8px;
  box-sizing: border-box;
  box-shadow: none;
  border-radius: 12px;
  border: 1px solid #e6e6e6;
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
  .panelHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 5px;
  }
  .title {
    font-family: Nunito;
    font-weight: 700;
    font-style: Bold;
    font-size: 16px;
    leading-trim: NONE;
    line-height: 24px;
    letter-spacing: 0px;
    flex: 1;
    min-width: 0;
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-gap: 10px;
    margin: 8px 8px 20px 0px;
  }
  .card {
    cursor: pointer;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    align-items: start;
    justify-items: center;
    border: 1px solid transparent;
    border-radius: 16px;
    padding: 8px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    background: #fff;

    font-family: Nunito;
    font-weight: 600;
    font-size: 13px;
    line-height: 18px;
    letter-spacing: 0px;
    text-align: center;

    &:hover {
      background: #F6F9F8;
      border: 1px solid #A1A1A1;
      box-shadow: 0px 1px 4px 0px #00000012;
    }
  }

  .cardImage {
    width: 72px;
    height: 72px;
    border-radius: 8px;
    border: 1px solid #D3E0E3;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: #F6F9F8;
    padding: 4px 8px 4px 8px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      display: block;
    }
  }

  .cardContent {
    min-width: 0;
    display: grid;
    gap: 0;
    align-content: start;
    justify-items: center;
  }

  .cardTitle {
    font-family: Nunito;
    font-weight: 700;
    font-size: 13px;
    line-height: 18px;
    color: #111827;
    max-width: 100%;
  }
`;

export const StyledDataWorkspace = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  align-content: baseline;
  background: #f8f9f8;
  gap: 10px;
  --dashboard-gap: 10px;
  /* Space between the left journal sidebar and the grid canvas when the sidebar is open */
  --left-panel-canvas-gap: 16px;
  --left-sidebar-width: 430px;

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
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    overflow: hidden;

    .dashboardMain {
      min-width: 0;
      min-height: 0;
      overflow: hidden;
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

    /* Two-pane journal: flex row + container query so canvas width stays constant when rail collapses */
    .journalShell {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: stretch;
      align-self: stretch;
      min-width: 0;
      min-height: 0;
      width: 100%;
      height: 100%;
      max-height: 100%;
      overflow: hidden;
      box-sizing: border-box;
      gap: var(--left-panel-canvas-gap);
      container-type: inline-size;
      container-name: journal-shell;
    }

    .journalLeftRail {
      flex: 0 0 var(--left-sidebar-width);
      max-width: var(--left-sidebar-width);
      min-width: 0;
      /* Let the rail shrink inside the flex row so inner .sidebarModeBody can scroll */
      min-height: 0;
      max-height: 100%;
      height: 100%;
      overflow: hidden;
      display: grid;
      grid-template-rows: minmax(0, 1fr);
      box-sizing: border-box;
      background: white;
      border: 1px solid #e6e6e6;
      border-left: none;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
      box-shadow: none;
      transition:
        flex-basis 0.2s ease,
        max-width 0.2s ease,
        opacity 0.15s ease,
        border-color 0.15s ease;
    }

    &.noLeftSidebar .journalLeftRail {
      flex: 0 0 0;
      max-width: 0;
      min-width: 0;
      opacity: 0;
      pointer-events: none;
      border-color: transparent;
    }

    &.hasLeftSidebar .journalLeftRail {
      opacity: 1;
      pointer-events: auto;
    }

    .journalCanvasColumn {
      flex: 1 1 auto;
      min-width: 0;
      min-height: 0;
      max-height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    &.hasLeftSidebar .journalCanvasColumn {
      align-items: stretch;
    }

    &.noLeftSidebar .journalCanvasColumn {
      align-items: center;
      /* Gutters without shrinking journalShell — keeps cqi stable when rail toggles */
      margin-inline: 16px;
    }

    /* Width from full journal row (cqi), not remaining flex space — RGL does not resize when rail toggles */
    .journalShell .canvas {
      width: calc(
        100cqi - var(--left-sidebar-width) - var(--left-panel-canvas-gap)
      );
      max-width: 100%;

      flex: 1 1 0;
      min-height: 0;
      overflow-x: hidden;
      overflow-y: auto;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* legacy Edge */

      &::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }
    }
  }
  .sidebarModeShell {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }
  .sidebarModeHeader {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #ffffff;
    border-bottom: 1px solid #e6e6e6;
    margin: 0;
    padding: 10px;
  }
  .navigationPanelHeader {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    .collapsePanelBtn {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-start;
      .collapsePanelBtnIcon {
        opacity: 0.5;
      }
    }
  }
  .sidebarModeBody {
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* legacy Edge */

    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
  }
  .canvas {
    display: grid;
    width: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;

    background: white;
    // box-shadow: 2px 2px 8px 0px #0000001a;
    border: 1px solid #e6e6e6;
    border-radius: 12px;

    .widgetContainer {
      border-radius: 14px;
      border: 2px solid #F3F3F3;
      &:hover {
        outline: 4px solid #e6e6e6;
        outline-offset: 2px;
      }
    }

    .react-grid-placeholder {
      background: rgba(228, 223, 246, 0.45) !important;
      border: 2px solid #e4dff6 !important;
      border-radius: 14px !important;
      opacity: 1 !important;
    }

    .react-grid-item.react-draggable-dragging {
      z-index: 3 !important;
      border-radius: 14px;
      box-shadow: 0 0 0 3px rgba(228, 223, 246, 0.9) !important;
    }

    .react-grid-item.resizing {
      z-index: 3 !important;
      border-radius: 14px;
      box-shadow: 0 0 0 3px rgba(228, 223, 246, 0.9) !important;
    }

    .react-resizable-handle::after {
      border-right: 2px solid #e4dff6 !important;
      border-bottom: 2px solid #e4dff6 !important;
    }

    /* Paragraph widget on grid: match panel TipTap — no inner ProseMirror box chrome; WidgetContent scrolls */
    .paragraph .tiptapEditor {
      max-width: 100%;
      border-radius: 0;
    }
    .paragraph .editorContainer {
      margin-top: 0;
    }
    .paragraph .tiptapEditor .ProseMirror {
      border: none;
      border-radius: 0;
      padding: 0;
      margin: 0;
      max-height: none;
      overflow-x: visible;
      overflow-y: visible;
    }
  }
  .dashboard.noLeftSidebar .journalShell .canvas {
    max-width: min(1380px, 100%);
  }
  .graph {
    display: grid;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;

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
      margin: 0;
      padding: 8px;
      box-sizing: border-box;
      grid-gap: 12px;
      min-width: 0;
      max-width: 100%;
      .header {
        display: grid;
        grid-gap: 10px;
        grid-template-columns: auto 1fr;
        font-weight: bold;
        font-size: 18px;
        margin: 10px 0px 10px 0px;
      }

      ${barPlotDataFormatPanelStyles}
    }
    .selectorsTestStats {
      display: grid;
      grid-gap: 12px;
    }
    .selectorsStats {
      margin: 0;
      padding: 8px clamp(10px, 3vw, 24px) 16px;
      box-sizing: border-box;
      display: grid;
      grid-gap: 16px;
      min-width: 0;
      max-width: 100%;

      .statTestDataFormatSummary {
        font-family: Inter, sans-serif;
        font-size: 14px;
        line-height: 1.45;
        color: #000000;
        min-width: 0;
        max-width: 100%;
      }
      .statTestDataFormatSummary p {
        margin: 0 0 8px 0;
      }
      .statTestDataFormatSummary p:last-child {
        margin-bottom: 0;
      }

      ${barPlotDataFormatPanelStyles}
    }
    .graphEditorFieldRow {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      max-width: 100%;
      min-width: 0;
      grid-gap: 10px;
      // border-radius: 12px;
      // border: 1px solid #e6e6e6;
      background: #fff;
      // box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
      color: #171717;
      font-family: Inter, sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.4;
      .graphEditorFieldRow__label {
        background: transparent;
        color: #0D3944;
        font-weight: 600;
        // padding: 10px 12px 4px;
        min-width: 0;
        max-width: 100%;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        line-clamp: 4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .graphEditorFieldRow__control {
        min-width: 0;
        max-width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 6px;
        .dropdown {
          border: 0;
        }
      }
    }
    .graphEditorNestedFields {
      display: grid;
      gap: 12px;
      min-width: 0;
      max-width: 100%;
    }
    .selectorLine {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      grid-gap: 12px;
      max-width: 100%;
      background: #fff;
      color: #171717;
      font-family: Inter;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.4;
      .title {
        color: #0D3944;
        font-weight: 600;
        background: transparent;
        min-width: 0;
        max-width: 100%;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        line-clamp: 4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .select {
        min-width: 0;
        padding: 0;
        .dropdown {
          border: 0;
        }
        select {
          min-height: 44px;
          min-width: 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow-wrap: anywhere;
          word-wrap: break-word;
          word-break: break-word;
        }
      }
    }
    .tabs {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
      max-width: 100%;
    }
    .tabs > .graph {
      min-width: 0;
      max-width: 100%;
    }
    .customTabs {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
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
    }
    .tabContent {
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      overflow-x: auto;
      ${hideScrollbars}
      padding: 8px;
      background: white;
      border-radius: 0 0 10px 10px;
      .styleLayoutContainer {
        display: grid;
        grid-gap: 10px;
        h3 {
          font-family: Inter;
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
  .graphDashboard {
    display: grid;
    margin: 0 0 8px 0;
    padding: 0 2px;
    box-sizing: border-box;
    min-width: 0;
    max-width: 100%;

    .header {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: auto 1fr;
      font-size: 18px;
      font-weight: bold;
      margin: 0px 0px 10px 0px;
    }
    .subheader {
      background: transparent;
      padding: 2px 2px 0;
      margin-top: 4px;
      font-family: Inter, sans-serif;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
      color: #6a6a6a;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .subsection {
      display: grid;
      grid-gap: 8px;
      padding: 4px 0 8px;
    }
    .title {
      color: #666666;
    }
    .ranges {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      input {
        flex: 1;
        min-width: 0;
      }
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
      font-family: Inter, sans-serif;
      min-height: 44px;
      border: 1px solid #cccccc;
      border-radius: 10px;
      width: 100%;
      font-size: 14px;
      line-height: 20px;
      padding: 10px 12px;
      &:focus {
        outline: 0;
        border-color: #0D3944;
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
    flex-direction: column;
    align-items: stretch;
    gap: 22px;

    border-radius: 16px;
    background: var(--Schemes-On-Primary, #fff);

    .ui.selection.dropdown {
      min-width: 0 !important;
      max-width: 100%;
    }

    .ui.selection.dropdown .text {
      min-width: 0;
      max-width: 100%;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .ui.multiple.selection.dropdown > .label,
    .ui.multiple.selection.dropdown .label {
      max-width: 100%;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
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
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        line-clamp: 4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal;
        max-width: 100%;
        overflow-wrap: anywhere;
        word-break: break-word;
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
  width: fit-content;
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
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    cursor: pointer;
    font-family: Inter, sans-serif;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #fff;
  }

  .edit-btn {
    background: var(--MH-Theme-Primary-Dark, #336f8a);

    &:hover:not(:disabled) {
      background: #2a5a6f;
    }

    &:disabled {
      background: #ccc;
      color: #fff;
      cursor: not-allowed;
    }
  }

  .delete-btn {
    background: #e53e3e;

    &:hover:not(:disabled) {
      background: #c53030;
    }

    &:disabled {
      background: #feb2b2;
      color: #fff;
      cursor: not-allowed;
    }
  }

  .dataset-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dataset-badges {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .inclusion-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    font-family: Inter, sans-serif;
    color: #4a5568;
    background: #fff;
    border: 1px solid #cbd5e0;
    cursor: help;
    max-width: fit-content;
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

export const StyledTableEditor = styled.div`
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  font-family: Inter, sans-serif;

  .tableEditorTitle {
    margin-top: 0;
    margin-bottom: 0.25rem;
    font-weight: 500;
    font-size: 18px;
    line-height: 150%;
    color: #000000;
  }

  .tableEditorDescription,
  .tableEditorEmptyState {
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-weight: 400;
    font-size: 14px;
    line-height: 150%;
    color: #666666;
  }

  .tableEditorSearchInput,
  .tableEditorNumericInput {
    width: 100%;
    max-width: 100%;
    font-family: Inter, sans-serif;
    font-weight: 500;
    font-size: 14px;
    line-height: 150%;
    color: #000000;
    border: 1px solid #cccccc;
    border-radius: 10px;
    padding: 10px 12px;
    box-sizing: border-box;
  }

  .tableEditorSearchInput {
    margin-bottom: 0.75rem;
  }

  .tableEditorActions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .tableEditorActionButton {
    height: 32px;
    padding: 6px 12px;
  }

  .tableEditorRows {
    display: grid;
    gap: 0.5rem;
    min-width: 0;
  }

  .tableEditorRow {
    border: 1px solid #e6e6e6;
    border-radius: 10px;
    padding: 0.65rem 0.75rem;
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
  }

  .tableEditorRowHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 0;
    width: 100%;
  }

  .tableEditorRowLabel {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    min-width: 0;
    flex: 1 1 auto;
    font: inherit;
    color: inherit;
  }

  .tableEditorRowName {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 300;
    font-size: 14px;
    line-height: 150%;
    color: #000000;
  }

  .tableEditorFilterChip {
    flex: 0 0 auto;
    height: 32px;
    max-width: 100%;
  }

  .tableEditorFiltersPanel {
    margin-top: 0.6rem;
    padding-top: 0.6rem;
    border-top: 1px solid #f0f0f0;
    min-width: 0;
  }

  .tableEditorRangeGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    min-width: 0;
  }

  .tableEditorFieldLabel {
    margin-bottom: 0.25rem;
    font-weight: 400;
    font-size: 12px;
    line-height: 150%;
    color: #6a6a6a;
  }
`;
