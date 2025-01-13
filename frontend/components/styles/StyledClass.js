import styled from "styled-components";

const StyledClass = styled.div`
  display: grid;

  .upperMenu {
    display: grid;
    margin-bottom: 30px;
  }

  .classListHeader {
    display: grid;
    margin: 5px;
    padding: 10px;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    cursor: pointer;
    font-weight: bold;
  }

  .classListRow {
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

  .editableClassHeader {
    display: grid;
    margin-bottom: 20px;
    padding: 10px;
    input,
    textarea,
    select {
      background: #f6f9f8;
      width: 100%;
      border: 0px solid #e6e6e6;
      border-radius: 4px;
      &:focus {
        outline: 0;
        background: white;
        border-color: mintcream;
      }
    }
    button {
      background: #007c70;
      color: white;
      max-width: 256px;
      border-radius: 3px;
      cursor: pointer;
    }
    .title {
      font-family: Lato;
      font-size: 48px;
      font-style: normal;
      font-weight: 400;
      line-height: 56px;
      letter-spacing: 0em;
      text-align: left;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .description {
      font-family: Lato;
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      /* line-height: 32px; */
      letter-spacing: 0em;
      text-align: left;
      color: #666666;
      margin-bottom: 10px;
    }
    .teacher {
      font-family: Lato;
    }
  }

  .listHeader {
    display: grid;
    padding: 10px;
    grid-template-columns: 70px 1fr 1fr;
    font-weight: bold;
  }

  .listWrapper {
    display: grid;
    grid-template-columns: 70px 1fr;
    .dropdownMenu {
      display: grid;
      justify-content: center;
      align-content: center;
      font-size: 1.5rem !important;
    }
    .dropdownItem {
      font-size: 1.5rem !important;
    }
  }
  .listRow {
    display: grid;
    padding: 1.5rem 1rem;
    margin-bottom: 2px;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    background: white;
    box-shadow: 0px 2px 4px 0px #00000026;
    transition: box-shadow 300ms ease-out;
    :hover {
      box-shadow: 0px 2px 24px 0px #0000001a;
    }
    border-radius: 4px;
  }

  .students {
    .topNavigation {
      display: grid;
      margin-bottom: 20px;
      padding: 20px;
      grid-template-columns: 2fr 1fr;
      grid-gap: 20px;
      background: white;
      .copyArea {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 20px;
        justify-items: baseline;
      }
      .link {
        padding: 12px 16px 12px 17px;
        border: 1px solid #cccccc;
        border-radius: 4px;
      }
      .copyButton {
        padding: 12px 25px 12px 25px;
        cursor: pointer;
        color: #007c70;
        border: 2px solid #007c70;
        border-radius: 4px;
        height: fit-content;
      }
    }
  }

  .mentors {
    .mentorsPageHeader {
      display: grid;
      margin-bottom: 20px;
      padding: 20px;
      grid-template-columns: 1fr;
      grid-gap: 20px;
      background: white;
      .copyArea {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 20px;
        justify-items: baseline;
      }
      .link {
        padding: 12px 16px 12px 17px;
        border: 1px solid #cccccc;
        border-radius: 4px;
      }
      .copyButton {
        padding: 12px 25px 12px 25px;
        cursor: pointer;
        color: #007c70;
        border: 2px solid #007c70;
        border-radius: 4px;
        background: white;
        width: 200px;
        text-align: center;
      }
      .infoText {
        margin: 1rem 0rem;
        font-size: 1.2rem;
      }
    }
  }

  .studies {
    .studiesHeader {
      display: grid;
      grid-gap: 10px;
      padding: 10px;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      font-weight: bold;
    }
    .studiesRow {
      display: grid;
      grid-gap: 10px;
      padding: 10px;
      margin-bottom: 2px;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      background: white;
    }
  }

  .empty {
    display: grid;
    grid-template-columns: 1fr auto;
  }

  .assignments {
    .subheader {
      margin: 1rem 0rem;
      display: grid;
      grid-template-columns: auto 1fr;
      grid-gap: 1rem;
      .secondary {
        background: white;
        color: #007c70;
      }
    }
    .backButton {
      margin: 0rem 0rem 2rem 0rem;
    }
    .tab {
      display: grid;
      grid-template-rows: auto 1fr;
      background: white;
      border-radius: 1rem;
      margin: 0.5rem 0rem;
      .header {
        padding: 25px 20px 10px 20px;
        display: grid;
        grid-gap: 20px;
        grid-template-columns: 1fr;
        align-items: center;
        .firstLine {
          display: grid;
          grid-gap: 2rem;
          grid-template-columns: 1fr auto;
          .title {
            display: grid;
            grid-gap: 2rem;
            grid-template-columns: auto 1fr;
            align-items: baseline;
          }
        }
        button {
          min-height: 56px;
          padding: 10px 24px 10px 24px;
          background: #007c70;
          border: 2px solid #007c70;
          box-sizing: border-box;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-family: "Lato";
          max-width: 300px;
        }
        .closeBtn {
          line-height: 3rem;
          text-align: center;
          cursor: pointer;
          border-radius: 2.25rem;
          color: #5f6871;
          font-size: 2rem;
          cursor: pointer;
          :hover {
            transform: scale(1.5);
            transition: transform 0.5s;
            color: red;
          }
        }
        .secondary {
          background: white;
          color: #007c70;
        }
      }
      .headerInfo {
        display: grid;
        grid-gap: 10px;
        grid-template-columns: 1fr auto;
        .buttons {
          display: grid;
          grid-template-columns: auto auto 1fr;
          grid-gap: 1rem;
        }
      }
      .content {
        padding: 15px 20px 20px 20px;
      }
      span {
        cursor: pointer;
      }
    }
    .selector {
      display: grid;
      grid-gap: 2rem;
      background: #f7f9f8;
      .head {
        display: grid;
        grid-gap: 20px;
        grid-template-columns: auto 1fr;
      }
      .closeBtn {
        line-height: 3rem;
        text-align: center;
        cursor: pointer;
        border-radius: 2.25rem;
        color: #5f6871;
      }
      .header {
        display: grid;
        margin: 5px;
        padding: 10px;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        font-weight: bold;
      }
      .row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        align-items: center;
        cursor: pointer;
        margin: 0.2rem 0rem;
        padding: 1.5rem 1rem;
        background: white;
        box-shadow: 0px 2px 4px 0px #00000026;
        transition: box-shadow 300ms ease-out;
        :hover {
          box-shadow: 0px 2px 24px 0px #0000001a;
        }
      }
    }
    .assignmentPage {
      display: grid;
      grid-gap: 2rem;
      .assignmentContent {
        display: grid;
        grid-template-rows: auto 1fr;
        background: white;
        border-radius: 1rem;
        .header {
          padding: 25px 20px 20px 20px;
          display: grid;
          grid-gap: 20px;
          grid-template-columns: 1fr;
          align-items: center;
        }
        .headerInfo {
          display: grid;
          grid-gap: 10px;
          grid-template-columns: 1fr auto auto;
        }
        .content {
          padding: 15px 20px 20px 20px;
        }
      }
      .homework {
        display: grid;
        .homeworkTab {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          background: white;
          padding: 1rem;
          margin: 0.2rem 0rem;
          border-radius: 1rem;
          cursor: pointer;
          box-shadow: 0px 2px 4px 0px #00000026;
          transition: box-shadow 300ms ease-out;
          :hover {
            box-shadow: 0px 2px 24px 0px #0000001a;
          }
        }
        .review {
          display: grid;
          height: 100%;
          grid-row-gap: 10px;
          font-family: Lato;
          font-size: 18px;

          .proposalCardBoard {
            display: grid;
            grid-template-columns: 7fr 3fr;
          }

          .jodit-container {
            border: none !important;
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
            border: 1px solid #cccccc;
            border-radius: 4px;
            width: 100%;
            font-size: 16px;
            line-height: 24px;
            padding: 12px;
            &:focus {
              outline: 0;
              border-color: ${(props) => props.theme.red};
            }
          }
          button,
          input[type="submit"] {
            margin-top: 3rem;
            margin-bottom: 1rem;
            width: 100%;
            background: #007c70;
            color: white;
            padding: 1.5rem 0.5rem;
            font-style: normal;
            font-weight: normal;
            font-size: 18px;
            line-height: 100%;
            border: 2px solid #007c70;
            border-radius: 4px;
            cursor: pointer;
          }
          fieldset {
            display: grid;
            justify-self: center;
            grid-gap: 5px;
            width: 100%;
            border: 0;
            padding: 0;
            &[disabled] {
              opacity: 0.5;
            }
          }
          .cardHeader {
            margin-bottom: 15px;
            font-family: Roboto;
            font-size: 24px;
            font-style: normal;
            font-weight: 400;
            line-height: 30px;
            letter-spacing: 0em;
            text-align: left;
          }
          .cardDescription {
            color: #666666;
            font-family: Roboto;
            font-size: 16px;
            font-style: normal;
            font-weight: 400;
            line-height: 24px;
            letter-spacing: 0em;
            text-align: left;
            padding-bottom: 40px;
            margin-bottom: 44px;
            border-bottom: 2px solid #e6e6e6;
          }
          .textBoard {
            margin: 0px 10px;
          }
          .infoBoard {
            display: grid;
            grid-gap: 20px;
            align-content: baseline;
            background: #f7f9f8;
            border-radius: 0px 4px 4px 0px;
            padding: 53px 30px 30px 37px;
            font-family: Roboto;
            font-size: 16px;
            font-style: normal;
            font-weight: 500;
            line-height: 30px;
            letter-spacing: 0em;
            text-align: left;
            height: 100%;
          }
          .proposalCardComments {
            display: grid;
          }

          .saveButtons {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr auto;
            justify-items: end;
            grid-gap: 10px;

            .saveButton {
              cursor: pointer;
              border-radius: 4px;
              align-items: center;
              padding: 14px 24px;
              font-family: Lato;
              font-size: 18px;
              font-style: normal;
              font-weight: 400;
              line-height: 18px;
              letter-spacing: 0.05em;
              text-align: center;
            }

            .primary {
              background: #007c70;
              color: #ffffff;
              border: 2px solid #007c70;
            }
            .secondary {
              background: #ffffff;
              color: #666666;
              border: 2px solid #b3b3b3;
            }
          }

          .status {
            input {
              all: unset;
            }
            .info-status {
              display: table;
              font-family: Lato;
              font-style: normal;
              font-size: 12px;
              line-height: 100%;
              letter-spacing: 0.05em;
              border-radius: 30px;
              /* position: absolute; */
              margin: 8px;
            }
            .status-not-started {
              color: #896900 !important;
              background: rgba(254, 210, 79, 0.18) !important;
            }
            .status-started {
              color: #0063ce !important;
              background: rgba(0, 117, 224, 0.12) !important;
            }
            .status-needs-feedback {
              color: #c92927 !important;
              background: rgba(224, 103, 102, 0.12) !important;
            }
            .status-feedback-given {
              color: #6f25ce !important;
              background: rgba(111, 37, 206, 0.12) !important;
            }
            .status-completed {
              color: #00635a !important;
              background: rgba(0, 124, 112, 0.12) !important;
            }
            .info-status :hover {
              background: #f7f7f7 !important;
            }
          }
        }
        .jodit {
          height: 100%;
          input,
          textarea,
          select {
            width: 100%;
            &:focus {
              outline: 0;
              background: white;
              border-color: mintcream;
            }
          }
          button {
            background: transparent;
            margin: 1px;
            border: 0px solid #e6e6e6;
            cursor: pointer;
          }
        }
      }
    }
  }
  .settings {
    .informationBlock {
      display: grid;
      grid-gap: 20px;
      grid-template-columns: 1fr 1fr;
      margin-bottom: 20px;
      .block {
        padding: 20px;
        background: white;
      }
    }
  }
  .dashboard {
    .ag-cell-button {
      color: black;
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      padding: 0 10px;
    }

    .ag-cell-button:hover {
      background-color: #f0f0f0;
    }

    .manageModal {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-gap: 10px;
    }
  }
`;

export default StyledClass;
