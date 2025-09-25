import styled from "styled-components";

export const StyledDataViz = styled.div`
  
  display: grid;

  .main {
    display: grid;
    padding: 10px 0px;
    grid-template-columns: 1fr 3fr;
    background: #f7f9f8;
  }

  .topNav {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-gap: 10px;
    height: 56px;
    align-items: center;
    background: white;
    padding: 10px;
    .areaSwitch {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }

  .vizMenu {
    display: inline-flex; /* Use inline-flex to allow the width to adjust based on children */
    flex-direction: column;
    align-items: stretch; /* Ensure children stretch to fill the container */
    gap: 10px; /* Add spacing between children */
    background: #f7f9f8;
    padding: 0px 8px 0px 16px;
    border-radius: 8px;
 
    .navigation-mode {
      max-width: 400px;
    }
  }
 
  }

  .item {
    padding: 0px !important;
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
  .customDropdownMenu {
    display: grid;
  }
  .menuItemDataType {
    display: grid;
    grid-template-columns: min-content;
    grid-template-rows: 40px auto;
    padding: 20px;
    grid-gap: 12px;
    align-items: start;
    justify-content: center;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    cursor: pointer;
    div {
      display: flex;
      justify-content: start;
      width: 290px;
    }
    h3 {
      font-size: 18px;
      color: #28619e;
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
  .menuItemDataType p {
    font-size: 14px;
    width: auto;
    word-break: break-word;
    white-space: normal;
  }
  .menuItemDataType img {
    width: 100%;
    max-height: 200px;
  }
  .dropdownMenu {
    background-color: #f1f7f6;
    border-radius: 8px;
    padding: 15px 10px 10px 10px;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }
  .slidesCard {
    grid-template-columns: 15px 100%;
    column-gap: 15px;
    max-width: max-content;
    background-color: #fbbc041e;
    border-radius: 8px;
    padding: 15px 10px 10px 10px;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }

  .resourcesCard {
    display: grid;
    grid-template-columns: 20px 1fr;
    column-gap: 15px;
    row-gap: 6px;
    max-width: max-content;
    background-color: #ecf8fb;
    border-radius: 8px;
    padding: 15px 15px 10px 10px;
    margin: 0px 0px 15px 0px;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    align-items: center; /* Center items vertically */
    justify-items: start; /* Align items to the start horizontally */
  }
  .resourcesCard:hover {
    cursor: pointer;
    outline: solid #28619e 1.5px;
  }

  .resourcesCardImage {
    width: 100%;
    height: auto;
    max-width: 250px;
  }

  .resourcesCardTitle {
    grid-area: 1 / 2 / 2 / 3;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    color: #28619e;
  }

  .resourcesCardLink {
    grid-area: 2 / 2 / 3 / 3;
    font-size: 11px;
    font-style: normal;
    font-weight: 400;
    color: #000;
  }

  .dataTypeSelector {
    grid-template-columns: 15px 200px;
    max-width: 370px;
    column-gap: 15px;
    background-color: #e6f2f1;
    border-radius: 8px;
    padding: 15px 10px 10px 10px;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
  }
  .dataFormatSelector {
    display: grid;
    grid-template-columns: 15px 1fr;
    // max-width: 1fr;
    column-gap: 15px;
    align-items: center;
    background-color: #e6f2f1;
    border-radius: 8px;
    padding: 15px 10px 10px 10px;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
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
  .dataButtonPart {
    display: grid;
    grid-template-columns: 15px auto;
    grid-column-gap: 20px;
    align-items: center;
    color: #000;
    font-size: 14px;
    font-style: normal;
    cursor: pointer;
  }
  .buttons {
    display: grid;
    grid-gap: 30px;
    align-content: baseline;
    justify-content: center;
    justify-items: center;
    .icon {
      display: grid;
      justify-content: center;
      justify-items: center;
      align-content: center;
      width: 40px;
      height: 40px;
      cursor: pointer;
    }
  }
  .overview {
    
    display: flex;
    width: 100%;
    // padding: 20px 16px;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    align-self: stretch;
    border-radius: 12px;
    background: #FFF;

    /* MH-Theme/Elevation/Medium */
    box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.10);

    .navigation-panel {
      width: 100%;
    }
  
    .header {
      display: grid;
      grid-template-columns: auto 1fr auto;
      grid-gap: 13px;
      justify-content: center;
      padding: 25px 12px 12px 19px;
    }
    .menu {
      border-radius: 8px;
      background: #fff !importantt;
      box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07) !important;
    }
    .menuButton {
      padding: 11px 33px 11px 13px;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
      color: #000000;
      cursor: pointer;
    }
    .menuButtonThin {
      padding: 4px 13px 4px 13px;
      border-radius: 8px;
      // background: #fff;
      cursor: pointer;
    }
    .greenFrame {
      background: #f1f7f6;
      color: #007c70;
      outline: solid #007c70 1px;
      box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
      font-weight: 600;
    }
    .greenFrame:hover {
      outline: solid #007c70 2px; /* Adjust the color and width as needed */
    }
    .blueFrame {
      color: #28619e;
      outline: solid #28619e 1px;
      font-weight: 400;
    }
    .blueFrame:hover {
      outline: solid #28619e 2.5px;
      box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.27);
    }
    .redSaveFrame {
      grid-area: 1 / 1 / 2 / 2;
      max-width: 100px;
      height: 35px;
      color: #db2828;
      outline: solid #db2828 1.5px;
      font-weight: 550;
    }
    .redSaveFrame:hover {
      outline: solid #db2828 2.5px;
      box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.27);
    }
    .emptyStateButtons {
      display: grid;
      grid-gap: 10px;
      margin: 28px 10px;
      justify-content: center;
    }
    .contents {
      display: flex;
      width: 100%;
      padding: 20px 16px;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      .emptyStateHeader {
        padding: 10px 15px;
      }
      .part {
        display: flex;
        width: 100%;
        padding: 8px 8px;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
        border-left: 3px solid var(--MH-Theme-Neutrals-Light-Green, #F6F9F8);
        
        &:hover {
          border-left: 3px solid #F9D978;;
          // border: 1px solid var(--State-Layers-On-Secondary-Container-Opacity-12, rgba(74, 68, 89, 0.12));
        }
        
        &.active {
          border-left: 3px solid #F2BE42;
        }

        .journal-header {
          display: flex;
          width: 100%;
          align-items: flex-start;
          justify-content: space-between;
          gap: 5px;

          .journal-header-text {
            color: var(--gray-8001-a-1-a-1-a, #1A1A1A);

            /* MH-Theme/title/base */
            font-family: Nunito;
            font-size: 16px;
            font-style: normal;
            font-weight: 700;
            line-height: 24px; /* 150% */

            .title {
              color: var(--MH-Theme-Neutrals-Black, #171717);

              /* MH-Theme/body/base */
              font-family: "Nunito";
              font-size: 16px;
              font-style: normal;
              font-weight: 400;
              line-height: 24px; /* 150% */
            }
            .description {
              color: var(--MH-Theme-Neutrals-Dark, #6A6A6A);

              /* MH-Theme/body/small */
              font-family: "Nunito";
              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: 16px; /* 133.333% */
            }
          }
        }

        .workspaces {
          display: flex;
          padding: 8px 0px;
          flex-direction: column;
          align-items: flex-start;
          align-self: stretch;
          
          .workspace {
            display: flex;
            flex-direction: column;
            // height: 43px;
            width: 100%;
            padding-left: 8px;
            padding-bottom: 14px;
            align-items: center;
            gap: 8px;
            align-self: stretch;

            .title {
              display: flex;
              // height: 43px;
              padding-left: 14px;
              align-items: flex-start;
              gap: 8px;
              align-self: stretch;

              .logo-workspace-tile {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1 0 0;
              }
              
            }
            .selected {
              border-left: 3px solid var(--MH-Theme-Accent-Base, #F2BE42);
            }

            .component-section {
              display: flex;
              height: 32px;
              padding: 0px 8px 0px 32px;
              align-items: center;
              gap: 8px;
              align-self: stretch;
            }
          }
        }

        .menuSubtitle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-gap: 10px;
          padding-left: 5px;
          .dataSource {
            font-family: "Lato";
            font-style: normal;
            font-weight: 400;
            font-size: 10px;
            line-height: 140%;
            color: #1a1a1a;
          }
          .lastUpdated {
            font-family: "Lato";
            font-style: italic;
            font-weight: 300;
            font-size: 10px;
            line-height: 140%;
            text-align: right;
            color: #888888;
            padding-right: 10px;
          }
        }
        .activePart {
          border-left: 8px solid #4bb3a3;
        }
      }
      .chapters {
        display: grid;
        margin-top: 10px;
      }
      .chapter {
        padding: 12px 10px 12px 30px;
        font-family: "Inter";
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        line-height: 17px;
        color: rgb(192, 187, 187);
        .title {
          cursor: pointer;
          :hover {
            font-weight: bold;
          }
        }
      }
      .selected {
        font-weight: 700;
        color: #000000;
      }
      .section {
        display: grid;
        grid-template-columns: 15px 1fr;
        column-gap: 8px;
        padding: 10px 20px;
        cursor: pointer;
        :hover {
          font-weight: bold;
        }
      }
      .title {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-gap: 12px;
      }
      .addNewChapter {
        display: flex;
        height: 40px;
        padding: 8px 24px;
        justify-content: center;
        align-items: center;
        gap: 8px;

        border-radius: 100px;
        border: 1px solid var(--MH-Theme-Primary-Dark, #336F8A);
      }
    }

    .database {
      display: grid;
      align-content: baseline;
      grid-gap: 5px;
      width: 100%;

      .header {
        display: grid;
        grid-template-columns: 20px 1fr auto;
        grid-gap: 13px;
        justify-content: center;
        padding: 12px;

        .icons {
          cursor: pointer;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          grid-gap: 10px;
        }
      }
      .options {
        display: grid;
        grid-template-columns: max-content max-content;
        grid-template-rows: 1fr;
        grid-column-gap: 25px;
        justify-content: space-between;
        padding: 12px;
      }
      .optionsFrame {
        display: grid;
        grid-area: 1 / 2 / 2 / 3;
        grid-template-columns: max-content max-content;
        grid-template-rows: 1fr 1fr;
        grid-column-gap: 20px;
        grid-row-gap: 15px;
        padding: 0px 13px 4px 13px;
        // outline: solid #007C70 1px;
      }
      .optionsButtonGreen {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 4px 13px 4px 13px;
        border-radius: 8px;
        background: #f1f7f6;
        box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
        cursor: pointer;
        color: #007c70;
        font-weight: 450;
      }
      .optionsButtonGreen {
        padding: 4px 13px 4px 13px;
        border-radius: 8px;
        background: #f1f7f6;
        box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
        cursor: pointer;
        color: #007c70;
        font-weight: 450;
      }
      .optionsButtonGreen:hover {
        outline: solid #007c70 2px; /* Adjust the color and width as needed */
      }
      .optionsButtonYellow {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 4px 13px 4px 13px;
        border-radius: 8px;
        background: #ffc10723;
        box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
        cursor: pointer;
        // color: #ffc107ff;
        font-weight: 450;
      }
      .optionsButtonYellow:hover {
        outline: solid #ffc107 2px; /* Adjust the color and width as needed */
      }

      .task {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 10px;
        align-items: center;

        .title {
          color: #000;
          font-family: Inter;
          font-size: 14px;
          font-style: normal;
          font-weight: 600;
          line-height: 130%; /* 18.2px */
        }
        .subtitle {
          color: #636363;
          font-family: Inter;
          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
        }
      }
      .variables {
        display: grid;
        grid-gap: 15px;
        padding: 0px 30px;
        margin: 0px 0px 10px 0px;
      }
      .hidden {
        color: #9a9a9a;
      }
      .variable {
        font-family: Inter;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 130%; /* 18.2px */
        display: grid;
        grid-template-columns: 1fr auto;
        label,
        input {
          cursor: pointer;
        }
        .name {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-gap: 10px;
          align-items: center;
        }
        .icons {
          display: grid;
          grid-template-columns: 20px 20px;
          grid-gap: 20px;
          height: 5px;
          .visibilityIcon {
            cursor: pointer;
          }
        }
      }
    }
    .addJournalBtn {
      display: grid;
      background: #ffffff;
      border: 1px solid rgba(0, 124, 112, 0.1);
      box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05);
      border-radius: 12.5px;
      margin: 0px 15px;
      padding: 5px 20px;
      width: fit-content;
      font-family: "Inter";
      font-style: normal;
      font-weight: 400;
      font-size: 12px;
      line-height: 23px;
      color: #007c70;
    }
  }
  .overview::-webkit-scrollbar {
    width: 5px;
    color: #f1f7f6;
  }
  .overview::-webkit-scrollbar-thumb {
    // background-color: #CCE5E2;
  }
  .emptyDocument {
    display: grid;
    align-content: center;
    justify-content: center;
    color: #666;
    font-family: Lato;
    font-size: 20px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%; /* 30px */
    border-radius: 8px;
    background: #fcfdfc;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
  }
  .document {
    display: grid;
    align-content: baseline;
    padding: 0px 16px 600px 16px;
    height: 100%;
    overflow-y: auto;
    background: white;

    .widget {
      border: 1px solid lightgrey;
      box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.10);
    }
    .section {
      display: grid;
      max-width 1500px;
      padding: 10px 20px;
      margin-bottom: 10px;
      border-radius: 16px;
      background: #FFF;

      /* MH-Theme/Elevation/Medium */
      box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.10);
      

      .sectionHeader {
        display: grid;
        grid-gap: 10px;
        grid-template-columns: auto max-content max-content max-content 1fr auto;
        margin: 10px 0px 5px 0px;
        color: #000;
        font-family: Lato;
        font-size: 18px;
        font-style: normal;
        font-weight: 700;
        line-height: 150%; /* 27px */
      }
      .paragraph {
        .modeSwitch {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-gap: 10px;
          align-content: center;
          font-family: Lato;
          font-size: 18px;
          font-weight: 700;
          margin: 0px 0px 10px 0px;
        }
        .viewMode {
          margin: 0px 0px 10px 0px;
        }
      }
      .htmlRenderContainer {
        display: grid;
        max-width: 600px;
        margin: 20px auto; /* y-justify-center */
        box-shadow: 0px 2px 20px 0px rgba(0, 0, 0, 0.07);
        table {
          border-collapse: collapse;
          background: white;

          td,
          th {
            border: 1px solid #ddd;
            padding: 8px;
          }

          tr:nth-child(even) {
            background-color: #f2f2f2;
          }

          tr:hover {
            background-color: #e6f2f1; /* Made it more @MindHive */
          }

          th {
            padding-top: 6px;
            padding-bottom: 6px;
            text-align: left;
            background-color: #007c70;
            color: white;
          }
        }
      }
      .graph {
        display: grid;
        /* margin: 10px 0px; */

        .displayContainer {
          display: grid;
          grid-template-columns: 2fr 1fr;
          grid-gap: 10px;
        }

        .graphContainer {
          display: grid;
          /* box-shadow: 0px 2px 20px 0px rgba(0, 0, 0, 0.07);
          border-radius: 10px;
          padding: 10px; */
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
                line-height: 150%; /* 21px */
              }
              .description {
                color: var(--gray-500666666, #666);
                font-family: Inter;
                font-size: 12px;
                font-style: normal;
                font-weight: 400;
                line-height: 150%; /* 18px */
              }
            }
          }
        }

        .graphRenderContainer {
          display: grid;
          grid-template-columns: 1fr;
          /* grid-template-columns: 4fr 3fr; */
          grid-gap: 10px;
          justify-content: center;
          /* min-height: 450px; */
          box-shadow: 0px 2px 20px 0px rgba(0, 0, 0, 0.07);
          border-radius: 10px;
          /* margin: 20px 0px; */
          /* .graphContainer {
            margin: 20px 10px;
          } */
          .dashboardContainer {
            // box-shadow: 0px 2px 20px 0px rgba(0, 0, 0, 0.07);
          }
        }
        .tableRenderContainer {
          display: grid;
          grid-template-columns: 1fr;
          justify-content: center;
          max-width: 100%;
          // box-shadow: 0px 2px 20px 0px rgba(0, 0, 0, 0.07);
          // border-radius: 10px;
          margin: 20px 0px;
          /* .graphContainer {
            margin: 20px 10px;
          } */
        }
        .graphArea {
          display: grid;
          justify-items: center;
          /* max-width: 100%; */
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
          line-height: 150%; /* 24px */
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
      }
    }
    .originDataTitle {
      color: #636363;
      font-family: Inter;
      font-size: 12px;
      font-style: italic;
      font-weight: 400;
      line-height: normal;
    }
    .createSectionButton {
      display: grid;
      justify-items: center;
    }
    .outputArea {
      width: 100%;
    }
  }
  .graphDashboard {
    display: grid;
    /* overflow-y: scroll; */
    /* height: 450px; */
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
      
      color: ;
      display: flex;
      padding: 20px 16px;
      flex-direction: column;
      align-items: flex-start;
      gap: 22px;
      
      border-radius: 16px;
      background: var(--Schemes-On-Primary, #FFF);

      .header {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;

        .header-title {
          color: var(--MH-Theme-Tertiary-Dark, #0D3944);

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
        min-width: 378px;
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
          min-width: 256px;
          min-height: 40px;
          padding: 4px 16px;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          align-self: stretch;

          border-radius: 8px;
          border: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
        }
        
        .input-box-number {
          display: flex;
          height: 40px;
          padding: 4px 16px;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;

          border-radius: 8px;
          border: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
        }
      }

      .parameter-panel {
        display: flex;
        min-width: 600px;
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

          border-bottom: 1px solid var(--Schemes-On-Secondary-Container, #4A4459);

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
        display: inline-flex;
        padding: 3px 10px;
        align-items: center;
        gap: 10px;

        .clipboard-copy-button {
          display: flex;
          padding: 3px 10px;
          align-items: center;
          gap: 10px;

          border-radius: 4px;
          background: var(--MH-Theme-Tertiary-Lighter, #F4F8F7);
        }   
        
        .clipboard-fig-copy-button {
          display: flex;
          padding: 3px 10px;
          align-items: center;
          gap: 10px;

          border-radius: 4px;
          background: var(--MH-Theme-Tertiary-Lighter, #F3F3F3);
        }   

        .clipboard-AI-copy-button {
          display: flex;
          padding: 3px 10px;
          align-items: center;
          gap: 10px;

          border-radius: 4px;
          background: var(--MH-Theme-Tertiary-Lighter, #FDF2D0);
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

          border:none;
          border-radius: 0px;
          display: flex;
          align-items: center;

          border-bottom: 1px solid var(--MH-Theme-Primary-Medium, #A3D6DB);
          margin-bottom: -1px;
          background: var(--MH-Theme-Neutrals-White, #FFF);
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
        align-items: center;
        gap: 8px;
        align-self: stretch;

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

          border:none;
          border-radius: 0px;
          display: flex;
          align-items: center;

          border-bottom: 1px solid var(--MH-Theme-Primary-Medium, #A3D6DB);
          margin-bottom: -1px;
          background: var(--MH-Theme-Neutrals-White, #FFF);
        }
      }
    }
`;
