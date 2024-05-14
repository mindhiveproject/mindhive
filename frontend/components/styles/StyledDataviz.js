import styled from "styled-components";

export const StyledDataViz = styled.div`
  display: grid;
  margin: 27px 17px;
  grid-template-columns: 1fr 2fr;
  grid-gap: 19px;
  max-height: 85vh;
  .vizMenu {
    display: grid;
    grid-template-columns: 1fr;
    grid-gap: 34px;
    overflow-y: auto;
    height: 100%;
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
      color: #007C70;
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
  .customDropdownMenu{
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
      color: #28619E;
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
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.10);
    box-sizing: border-box;
  }
  .slidesCard {
    grid-template-columns: 15px 100%;
    column-gap: 15px;
    background-color: #fbbc041e; 
    border-radius: 8px; 
    padding: 15px 10px 10px 10px;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.10);
    box-sizing: border-box;
  }
  .dataTypeSelector {
    grid-template-columns: 15px 200px;
    max-width: 370px;
    column-gap: 15px;
    background-color: #E6F2F1; 
    border-radius: 8px; 
    padding: 15px 10px 10px 10px;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.10);
    box-sizing: border-box;
  }
  .dataFormatSelector {
    display: grid;
    grid-template-columns: 15px 1fr;
    // max-width: 1fr;
    column-gap: 15px;
    align-items: center;
    background-color: #E6F2F1; 
    border-radius: 8px; 
    padding: 15px 10px 10px 10px;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.10);
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
    display: grid;
    border-radius: 8px;
    background: #fcfdfc;
    box-shadow: 0px 2px 20px 0px rgba(0, 0, 0, 0.07);
    overflow-y: auto;
    height: 100%;
    .header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        grid-gap: 13px;
        justify-content: center;
        padding: 12px 12px 12px 12px;
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
      background: #F1F7F6;
      color: #007C70;
      outline: solid #007C70 1px;
      box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
      font-weight: 600;
    }
    .greenFrame:hover {
      outline: solid #007C70 2px; /* Adjust the color and width as needed */
    }
    .blueFrame {
      color: #28619E;
      outline: solid #28619E 1px;
      font-weight: 400;
    }
    .blueFrame:hover {
      outline: solid #28619E 2.5px;
      box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.27)
    }
    .redSaveFrame {
      grid-area: 1 / 1 / 2 / 2;
      max-width: 100px;
      height: 35px;
      color: #DB2828;
      outline: solid #DB2828 1.5px;
      font-weight: 550;
    }
    .redSaveFrame:hover {
      outline: solid #DB2828 2.5px;
      box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.27)
    }
    .emptyStateButtons {
      display: grid;
      grid-gap: 10px;
      margin: 28px 10px;
      justify-content: center;
    }
    .contents {
      display: grid;
      grid-gap: 10px;
      padding-bottom: 100px;
      .emptyStateHeader {
        padding: 10px 15px;
      }
      .part {
        display: grid;
        border-radius: 5px;
        .menuOriginaDataTitle {
          background: #f1f7f6;
          padding: 10px 15px;
          border-radius: 5px;
          display: grid;
          align-items: center;
          grid-template-columns: 1fr auto auto;
          grid-gap: 12px;
          color: #007c70;
          font-family: Inter;
          font-size: 16px;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
          .icon {
            cursor: pointer;
          }
          .title {
            cursor: pointer;
            :hover {
              color: black;
              font-weight: bold;
            }
          }
          .title {
            cursor: pointer;
          }
        }
        .menuDescription {
        }
      }
      .active {
        border: 1px solid #d3d3d359;
      }
      .chapter {
        padding: 12px 15px;
        .title {
          cursor: pointer;
          :hover {
            font-weight: bold;
          }
        }
      }
      .selected {
        border: 1px solid #d3d3d359;
        background: #ffefd561;
      }
      .section {
        padding: 5px 20px;
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
        display: grid;
        justify-content: center;
        border-top: 1px solid lightgrey;
        padding: 5px;
        height: 50px;
      }
    }

    .database {
      display: grid;
      align-content: baseline;
      grid-gap: 5px;

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
        background: #F1F7F6 ;
        box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
        cursor: pointer;
        color: #007C70;
        font-weight: 450;
      }
      .optionsButtonGreen {
        padding: 4px 13px 4px 13px;
        border-radius: 8px;
        background: #F1F7F6 ;
        box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
        cursor: pointer;
        color: #007C70;
        font-weight: 450;
      }
      .optionsButtonGreen:hover {
        outline: solid #007C70 2px; /* Adjust the color and width as needed */
      }
      .optionsButtonYellow {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 4px 13px 4px 13px;
        border-radius: 8px;
        background: #ffc10723 ;
        box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
        cursor: pointer;
        // color: #ffc107ff;
        font-weight: 450;
      }
      .optionsButtonYellow:hover {
        outline: solid #FFC107 2px; /* Adjust the color and width as needed */
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
    padding: 10px 32px 600px;
    border-radius: 8px;
    background: #fcfdfc;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
    height: 100%;
    overflow-y: auto;
    .section {
      display: grid;
      // padding: 10px 0px;
      // box-shadow: 0px 2px 500px 0px rgba(0, 0, 0, 0.07);
      // box-shadow: 0px 2px 10px 0px  papayawhip;
      // box-shadow: 0px 2px 10px 0px  #007c70;
      padding: 10px 32px 30px;
      margin: 10px 32px 30px;
      border-radius: 8px;
      background: #fcfdfc;
      box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.17);
      // :hover {
      //   background: #000000;
      // }

      .sectionHeader {
        display: grid;
        grid-gap: 10px;
        grid-template-columns: auto 1fr auto;
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
            background-color: #E6F2F1; /* Made it more @MindHive */
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
        margin: 10px 0px;

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
          grid-template-columns: 4fr 3fr;
          grid-gap: 10px;
          justify-content: center;
          min-height: 450px;
          box-shadow: 0px 2px 20px 0px rgba(0, 0, 0, 0.07);
          border-radius: 10px;
          margin: 20px 0px;
          .graphContainer {
            margin: 20px 10px;
          }
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
          .graphContainer {
            margin: 20px 10px;
          }
        }
        .graphArea {
          display: grid;
          max-width: 100%;
        }
        .selectors {
          display: grid;
          margin: 20px;
          grid-gap: 21px;
          height: 60px;
          .header {
            display: grid;
            grid-gap: 10px;
            grid-template-columns: auto 1fr;
            font-weight: bold;
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
          grid-template-columns: minmax(auto, 200px) 1fr;
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
    overflow-y: scroll;
    height: 450px;
    margin: 20px 10px;

    .header {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: auto 1fr;
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
