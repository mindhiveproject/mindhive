import styled from "styled-components";

export const StyledDataViz = styled.div`
  display: grid;
  margin: 27px 17px;
  grid-template-columns: 1fr 2fr;
  grid-gap: 19px;
  max-height: 85vh;
  .plotly {
    width: 100%;
    height: 500px;
    overflow-y: auto;
  }
  .vizMenu {
    display: grid;
    grid-template-columns: 40px auto;
    grid-gap: 34px;
    overflow-y: auto;
    height: 100%;
  }
  .item {
    padding: 0px !important;
  }
  .menuItem {
    padding: 5px 20px 5px 5px;
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
      padding: 12px;
      margin-bottom: 17px;
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
    .emptyStateButtons {
      display: grid;
      margin: 28px 10px;
      justify-content: center;
    }
    .contents {
      display: grid;
      .part {
        display: grid;
        .menuOriginaDataTitle {
          background: #f1f7f6;
          padding: 10px 15px;
          display: grid;
          align-items: center;
          grid-template-columns: 1fr auto;
          grid-gap: 12px;
          color: #007c70;
          font-family: Inter;
          font-size: 12px;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
        }
        .menuDescription {
        }
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
        border: 1px solid black;
        border-radius: 5px;
        background: papayawhip;
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
        padding-top: 5px;
      }
    }

    .database {
      display: grid;
      align-content: baseline;
      grid-gap: 5px;
      .header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        .icons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-gap: 10px;
        }
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
        /* align-content: center; */
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
          grid-gap: 10px;
          .visibilityIcon {
            cursor: pointer;
          }
        }
      }
    }
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
    padding: 10px 32px;
    border-radius: 8px;
    background: #fcfdfc;
    box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
    height: 100%;
    overflow-y: auto;
    .section {
      display: grid;
      padding: 10px 0px;
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

        .graphArea {
          display: grid;
          justify-content: center;
          margin: 10px 0px;
          .graph {
            padding: 11px 20px;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.07);
          }
        }
        .selectors {
          display: grid;
          grid-gap: 21px;
        }
        .selectorLine {
          display: grid;
          grid-template-columns: auto 1fr;

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
`;
