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
  display: grid;
  grid-gap: 10px;
  padding: 10px;
  margin: 10px;
  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  border-radius: 12px;
  .collapsePanelBtn {
    display: grid;
    margin: 10px 10px;
    justify-content: end;
    cursor: pointer;
  }
  .journals {
    display: grid;
    grid-gap: 10px;
    .journal {
      display: grid;
      grid-gap: 4px;
      margin: 10px 0px 28px 0px;
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
`;

export const StyledTopNavigation = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-gap: 10px;
  height: 56px;
  align-content: center;
  align-items: center;
  border: 1px solid #e6e6e6;
  background: white;
  .buttons {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-gap: 10px;

    .custonBtn {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 4px 24px;
      gap: 4px;
      height: 40px;
      background: #336f8a;
      border-radius: 100px;
      flex: none;
      order: 1;
      flex-grow: 0;
    }
  }
  .leftIconNav {
    margin: 0px 10px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 5px;
    border-right: 1px solid #e6e6e6;
    .icon {
      padding: 8px 10px;
      cursor: pointer;
    }
    .active {
      background: #f4f8f7;
      border-radius: 8px;
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
`;

export const StyledRightPanel = styled.div`
  display: grid;
  align-content: baseline;
  grid-gap: 10px;
  min-width: 900px;
  padding: 16px;
  overflow-y: auto;
  height: 100%;
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
  display: grid;
  height: 100%;
  align-content: baseline;
  grid-gap: 10px;
  background: #f8f9f8;

  .pushable {
    background: #f8f9f8;
    border-radius: 12px;
  }

  .sidebar {
    background: white;
    box-shadow: 2px 2px 8px 0px #0000001a;
    border-radius: 12px !important;
  }

  .segment {
    border: 1px solid #f8f9f8;
    background: #f8f9f8;
    box-shadow: none;
  }

  .pusher {
    background: #f8f9f8;
  }

  .dashboard {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-gap: 10px;
    align-content: baseline;
    height: calc(100vh - 50px);
    .openPanelBtn {
      cursor: pointer;
      margin: 10px;
      padding: 20px;
      border-radius: 12px;
      background: white;
      box-shadow: 2px 2px 8px 0px #0000001a;
    }
  }
  .canvas {
    display: grid;
    width: 100%;
    min-height: 80vh;

    background: white;
    margin-left: 14px;
    box-shadow: 2px 2px 8px 0px #0000001a;
    border-radius: 12px;

    .widgetContainer {
      border: 2px solid #e6e6e6;
      border-radius: 8px;
      &.active {
        border: 2px solid blue;
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
      border-radius: 10px;

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
      margin: 20px 100px 50px;
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
      .menu {
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
`;
