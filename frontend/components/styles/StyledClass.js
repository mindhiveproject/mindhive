import styled from "styled-components";

const StyledClass = styled.div`
  display: grid;

  .teacherClassesHeader {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px 16px;
    margin-bottom: 16px;
  }

  .teacherClassesHeader h1 {
    margin: 0;
  }

  .teacherClassesToolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
  }

  .teacherClassesSortChip {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .teacherClassesSortLabel {
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0.01em;
    color: #171717;
  }

  .teacherClassesSearch {
    flex: 1;
    width: 70%;
    min-width: 200px;
    max-width: 400px;
    min-height: 40px;
    padding: 8px 14px;
    box-sizing: border-box;
    border: 1px solid #a1a1a1;
    border-radius: 8px;
    background: #ffffff;
    color: #171717;
    font-family: Inter, sans-serif;
    font-size: 14px;
    line-height: 20px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .teacherClassesSearch::placeholder {
    color: #6a6a6a;
  }

  .teacherClassesSearch:hover {
    border-color: #6a6a6a;
  }

  .teacherClassesSearch:focus {
    outline: none;
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    box-shadow: 0 0 0 2px rgba(51, 111, 138, 0.2);
  }

  .classListNoMatch {
    margin-top: 24px;
    padding: 12px 0;
    max-width: 36rem;
    color: #666666;
  }

  /* Class detail tabs — aligned with Builder project nav (StyledProject .secondLine) */
  .classPageNav {
    margin-bottom: 30px;

    .secondLine {
      padding: 0 8px;
      background: #f6f9f8;
      border-bottom: 1px solid #e6e6e6;

      .menu {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 16px;
        row-gap: 8px;
      }

      .menuTitle {
        display: flex;
        align-items: center;
        padding: 0px 8px 8px 8px;
        border-bottom: 4px solid transparent;
        cursor: pointer;

        .titleWithIcon {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;

          img {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
          }

          p {
            font-family: Inter, sans-serif;
            font-size: 16px;
            font-weight: 500;
            line-height: 20px;
            color: #5D5763;
            margin: 0;
          }
        }
      }

      .selectedMenuTitle {
        border-bottom-color: #f2be42;
      }

      @media (max-width: 800px) {
        .menuTitle {
          flex: 1 1 45%;
        }

        .menuTitle .titleWithIcon {
          white-space: normal;
        }
      }
    }
  }

  .classListHeader {
    display: grid;
    margin: 0;
    margin-top: 16px;
    padding: 0.75rem 1rem;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    font-family: Inter, sans-serif;
    font-weight: 600;
    font-size: 16px;
    line-height: 14px;
    color: #171717;
    align-items: end;
  }

  .classListBoard {
    display: grid;
    gap: 12px;
    margin-top: 12px;
  }

  .classListContainer {
    margin-top: 12px;
    background-color: #ffffff;
    border-radius: 12px;
    padding: 0 24px 16px 24px;
  }

  .classListBoard a {
    font-size: 14px;
    line-height: 20px;
    color: inherit;
  }

  .classListRow {
    display: grid;
    padding: 1.5rem 1rem;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    cursor: pointer;
    background: transparent;
    border-radius: 8px;
    border: 1px solid #E6E6E6;
    font-family: Inter, sans-serif;
    font-size: 16px;
    line-height: 20px;
    font-weight: 400;
    transition: box-shadow 300ms ease-out;
    :hover {
      background-color: #DEF8FB;
      color: #07365F;
      font-weight: 600;
      box-shadow: 0px 2px 24px 0px #DEF8FB;
    }
  }

  .classListRow > div {
    font-size: inherit;
    line-height: inherit;
    font-weight: inherit;
  }

  .classListEmpty {
    margin-top: 16px;
    padding: 8px 0 16px;
    max-width: 36rem;
  }

  .classListLoading {
    margin-top: 16px;
    color: #666666;
  }

  .classListError {
    margin-top: 16px;
    color: #b00020;
    max-width: 36rem;
  }

  .editableClassHeader {
    display: grid;
    width: 100%;
    margin-bottom: 20px;
    padding: 10px;
    .infoPane {
      display: grid;
      // gap: 8px;
      width: 100%;
      margin-bottom: 8px;
    }
    .infoPane label {
      margin-bottom: 8px;
      font-size: 18px;
      line-height: 24px;
      color: #171717;
    }
    .classHeaderTitleBlock {
      display: grid;
      width: 100%;
      min-width: 0;
    }
    .classHeaderTitleDisplay {
      margin: 0;
      width: 100%;
      min-width: 0;
    }
    .classHeaderTitleDisplayEditable {
      cursor: pointer;
      border-radius: 4px;
      border: none;
      background: transparent;
      &:hover {
        background: transparent;
      }
      &:focus-visible {
        outline: 2px solid #007c70;
        outline-offset: 2px;
      }
    }
    .classHeaderTitleInput {
      margin-top: 0;
      margin-bottom: 0;
      background: transparent !important;
      border: none !important;
      &:focus,
      &:focus-visible {
        background: #fff !important;
        border: none !important;
      }
      &:focus-visible {
        outline: 1px solid #e6e6e6;
        outline-offset: 2px;
      }
    }
    .classHeaderTitleEditor {
      margin-top: 8px;
      width: 100%;
      min-width: 0;
    }
    .classHeaderTitleEditor .tiptapEditor,
    .classFormTitleEditor .tiptapEditor {
      min-height: 48px;
    }
    .classHeaderDescriptionEditor {
      display: flex;
      border-radius: 8px;
      width: 100%;
      min-width: 0;
      // &:hover {
      //   width: 100%;
      //   box-shadow: 0 0 0 1px #F2BE42 inset;
      //   background: #FDF2D0;
      // }
    }
    .classHeaderDescriptionHtml {
      width: 100%;
      min-width: 0;
      color: #3d3d3d;
      font-family: Inter, sans-serif;
      font-size: 15px;
      line-height: 22px;
      overflow-wrap: anywhere;

      p {
        margin: 0 0 8px;
      }

      p:last-child {
        margin-bottom: 0;
      }

      ul,
      ol {
        margin: 8px 0;
        padding-left: 22px;
      }
    }
    .classHeaderMetaRow {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      max-width: 100%;
      margin: 0px 0 12px;
      border-radius: 8px;
      color: #171717;
      flex-wrap: wrap;
    }
    .classHeaderMentorsPanel {
      display: flex;
      align-items: center;
      gap: 8px;
      width: fit-content;
      max-width: 100%;
      margin: 0;
      flex-wrap: wrap;
    }
    .classHeaderMentorItem {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .classHeaderMetaBullet {
      font-size: 16px;
      line-height: 1;
      color: #6a6a6a;
      flex-shrink: 0;
    }
    .classHeaderMetaLabel {
      font-family: Inter, sans-serif;
      font-size: 14px;
      font-weight: 600;
      line-height: 20px;
      color: #274e5b;
    }
    .classHeaderMetaLabel::after {
      content: ":";
      margin-left: 2px;
    }
    .classHeaderMetaValue {
      font-family: Inter, sans-serif;
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
      color: #171717;
      word-break: break-word;
    }
    @media (max-width: 700px) {
      .classHeaderMetaRow {
        width: 100%;
      }
      .classHeaderMentorsPanel {
        width: fit-content;
      }
    }

    .classHeaderDescriptionEditor .tiptapEditor {
      min-height: 120px;
    }
    .classHeaderDescriptionEditor .tiptapEditor .ProseMirror {
      background: transparent !important;
      border: none !important;
      &:focus {
        background: #fff !important;
        outline: 1px solid #e6e6e6;
      }
    }
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
      font-family: Inter;
      font-size: 32px;
      font-style: normal;
      font-weight: 400;
      line-height: 56px;
      letter-spacing: 0em;
      text-align: left;
      color: #1a1a1a;
      margin-bottom: 10px;
      width: 100%;
      resize: vertical;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: break-word;
      min-height: 40px;
    } 
    .description {
      font-family: Inter
      font-size: 28px;
      font-style: normal;
      font-weight: 400;
      /* line-height: 32px; */
      letter-spacing: 0em;
      text-align: left;
      color: #666666;
      margin-bottom: 8px;
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
    .buttons {
      display: grid;
      grid-template-columns: auto auto;
      grid-gap: 10px;
      justify-content: start;
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

  .resources {
    .subheader {
      padding-bottom: 16px;
    }
  }

  .assignments {
    .subheader {
      margin: 1rem 0rem;
      display: flex;
      justify-content: start;
      align-items: center;
      grid-gap: 1rem;
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
          border-bottom: 5px solid #f7faf9;
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
            /* Homework status colors match Builder Card scheme */
            .status-not-started {
              color: #666 !important;
              background: #FFFFFF !important;
            }
            .status-started {
              color: #5D5763 !important;
              background: #FFFFFF !important;
            }
            .status-needs-feedback {
              color: #3F288F !important;
              background: #FFFFFF !important;
            }
            .status-feedback-given {
              color: #0D3944 !important;
              background: #FFFFFF !important;
            }
            .status-completed {
              color: #337C84 !important;
              background: #FFFFFF !important;
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
  .projectsBoardBackBar {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    background: transparent;
  }

  .classTabPage {
    display: grid;
    gap: 28px;
    width: 100%;
    max-width: 100%;
    padding-bottom: 40px;
    font-family: "Inter", sans-serif;

    .classTabSection {
      display: grid;
      gap: 16px;
      padding: 24px;
      border: 1px solid #e6e6e6;
      border-radius: 18px;
      background: linear-gradient(180deg, #ffffff 0%, #fbfbfa 100%);
      box-shadow: 0 10px 30px rgba(23, 23, 23, 0.06);
    }

    .classTabSectionHeader {
      display: grid;
      gap: 6px;
      max-width: 100%;

      h3 {
        margin: 0;
        font-family: "Inter", sans-serif;
        font-size: 22px;
        font-weight: 700;
        line-height: 30px;
        color: #171717;
      }

      p {
        margin: 0;
        font-size: 15px;
        line-height: 22px;
        color: #625b71;
      }
    }

    .classTabActionBar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .classTabInformationBlock {
      display: grid;
      gap: 16px;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
      align-items: stretch;

      .block {
        display: grid;
        align-content: start;
        gap: 14px;
        padding: 20px;
        border: 1px solid #ece9e6;
        border-radius: 16px;
        background: #ffffff;
        box-shadow: 0 6px 18px rgba(23, 23, 23, 0.04);

        p {
          margin: 0;
        }

        &:only-child {
          grid-column: 1 / -1;
        }
      }
    }

    .classTabCopyArea {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;

      .classTabCodeValue,
      .classTabInfoText {
        flex: 1;
        min-width: 120px;
        margin: 0;
      }
    }

    .classTabInviteBlock {
      display: grid;
      gap: 12px;

      .classTabInviteLabel {
        margin: 0;
        font-size: 15px;
        line-height: 22px;
        color: #625b71;
      }

      .classTabInviteLink {
        flex: 1;
        min-width: 200px;
        padding: 12px 16px;
        border: 1px solid #d9d6d2;
        border-radius: 12px;
        background: #f9faf9;
        font-family: "Inter", sans-serif;
        font-size: 14px;
        line-height: 20px;
        color: #171717;
        word-break: break-all;
      }
    }

    .classTabCodeValue {
      margin: 0;
      font-family: "Inter", sans-serif;
      font-size: 24px;
      font-weight: 600;
      line-height: 36px;
      color: #171717;
      letter-spacing: 0.04em;
    }

    .classTabInfoText {
      margin: 0;
      font-size: 14px;
      line-height: 20px;
      color: #625b71;
    }

    .classTabTable {
      width: 100%;
      min-height: 400px;
      height: 600px;
    }

    .classTabEmpty {
      display: grid;
      gap: 16px;
      justify-items: start;
      padding: 8px 0;
      color: #625b71;
      font-size: 15px;
      line-height: 22px;
    }

    .classTabSubsection {
      display: grid;
      gap: 12px;
    }

    .classTabSubsectionTitle {
      margin: 0;
      font-family: "Inter", sans-serif;
      font-size: 18px;
      font-weight: 700;
      line-height: 22px;
      color: #171717;
    }

    .classTabSubsectionDescription {
      margin: 0;
      font-size: 14px;
      line-height: 20px;
      color: #625b71;
    }

    .classTabSubsectionHeaderRow {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .classTabSubsectionHeaderGroup {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .classTabSubsectionDivider {
      margin: 8px 0;
      border-top: 1px solid #ece9e6;
    }

    .classTabTemplateList {
      display: grid;
      gap: 16px;
    }

    .classTabTemplateCard {
      display: grid;
      gap: 12px;
      padding: 18px;
      border: 1px solid #e6e6e6;
      border-radius: 14px;
      background: #f3f3f3;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }

    .classTabTemplateCardActive {
      border: 2px solid #336f8a;
      background: rgba(222, 248, 251, 0.3);
    }

    .classTabTemplateCardRow {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      gap: 12px 16px;
    }

    .classTabTemplateCardTitle {
      margin: 0;
      font-family: "Inter", sans-serif;
      font-size: 16px;
      font-weight: 600;
      line-height: 24px;
      color: #171717;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .classTabTemplateCardTitleLink {
      display: block;
      min-width: 0;
      max-width: 100%;
      text-decoration: none;
      color: inherit;
      cursor: pointer;

      &:hover .classTabTemplateCardTitle {
        color: #336f8a;
        text-decoration: underline;
      }
    }

    .classTabTemplateCardTitleGroup {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      min-width: 0;
    }

    .classTabTemplateCardDescription {
      margin: 0;
      font-size: 14px;
      line-height: 20px;
      color: #625b71;
      word-break: break-word;
    }

    .classTabTemplateCardActions {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      flex-shrink: 0;
    }

    .classTabTemplateCardMeta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      font-size: 12px;
      line-height: 16px;
      color: #8a8a8a;
    }

    .classTabNetworkChipRow {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .classTabNetworkInvite {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px 16px;
      padding-top: 16px;
      margin-top: 4px;
      border-top: 1px solid #ece9e6;

      .networkInviteText {
        display: grid;
        gap: 2px;
        min-width: 180px;
        flex: 1;
      }

      .networkInviteTitle {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        line-height: 22px;
        color: #171717;
      }

      .networkInviteDescription {
        margin: 0;
        font-size: 13px;
        line-height: 18px;
        color: #625b71;
      }

      .networkInviteActions {
        display: flex;
        flex-wrap: wrap;
        flex-shrink: 0;
        align-items: center;
        gap: 10px;
      }
    }

    .classTabExpandableCard {
      gap: 0;
      padding: 0;
      overflow: hidden;
    }

    .classTabExpandableHeaderBar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: stretch;
      gap: 0;
      min-height: 72px;

      .matchingRoundHeaderActions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-shrink: 0;
        padding: 16px 24px 16px 12px;
      }

      .summaryStatus {
        display: inline-flex;
        align-items: flex-start;
        flex-shrink: 0;
        padding: 6px 12px;
        border-radius: 12px;
        background: #f0f4f6;
        color: #5f6871;
        font-size: 12px;
        font-weight: 600;
        line-height: 18px;

        &.summaryStatusMuted {
          background: #f5f0e8;
          color: #8a6d3b;
        }
      }
    }

    .classTabExpandableHeaderToggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      width: 100%;
      min-width: 0;
      min-height: 100%;
      padding: 16px 12px 16px 24px;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      border-radius: 0;

      &:hover:not(:disabled) {
        background: #DEF8FB;
      }

      &:focus-visible {
        outline: 2px solid #336f8a;
        outline-offset: -2px;
      }

      &:disabled,
      &.isDisabled {
        cursor: default;
      }

      .expandableHeaderMain {
        display: grid;
        gap: 8px;
        min-width: 0;
        flex: 1;

        h3 {
          margin: 0;
          font-family: "Inter", sans-serif;
          font-size: 22px;
          font-weight: 700;
          line-height: 30px;
          color: #171717;
        }
      }

      .summaryRoundTitleMuted {
        color: #625b71;
      }

      .expandableSummaryHint {
        margin: 0;
        font-size: 14px;
        line-height: 20px;
        color: #625b71;
      }

      .expandableChevron {
        flex-shrink: 0;
        opacity: 0.7;
        transition: transform 0.2s ease;

        &.expanded {
          transform: rotate(180deg);
        }
      }
    }

    .classTabExpandableBody {
      display: grid;
      gap: 16px;
      padding: 12px 24px 24px;
      border-top: 1px solid #ece9e6;

      .expandableBodyDescription {
        margin: 16px 0 0;
        font-size: 15px;
        line-height: 22px;
        color: #625b71;
      }
    }

    .classTabMatchingRoundForm {
      display: grid;
      gap: 18px;
    }

    .classTabMatchingRoundAlgoChipRow {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      border: 1.5px solid #ece9e6;
      border-radius: 12px;
      background: #ffffff;
      padding: 12px;
    }

    .classTabMatchingRoundPanel {
      display: grid;
      gap: 18px;
    }

    .classTabMatchingRoundFooter {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 12px 16px;
      padding-top: 8px;
      margin-top: 4px;
      border-top: 1px solid #ece9e6;

      .matchingRoundUnsavedHint {
        margin: 0;
        margin-right: auto;
        font-size: 13px;
        line-height: 18px;
        color: #8a6d3b;
        font-weight: 500;
      }
    }

    .classTabRoundSwitcher {
      max-width: 420px;
    }

    .classTabFormGrid {
      display: grid;
      gap: 16px;
    }

    .classTabFormGridTwo {
      grid-template-columns: repeat(2, minmax(0, 1fr));

      @media (max-width: 700px) {
        grid-template-columns: 1fr;
      }
    }

    .classTabFormField {
      display: grid;
      align-content: start;
      gap: 6px;
      font-size: 14px;
      color: #625b71;

      .fieldLabel {
        font-weight: 600;
        color: #171717;
        font-size: 14px;
        line-height: 20px;
      }

      .fieldHint,
      .fieldAlgoHint {
        margin: 0;
        font-size: 12px;
        line-height: 18px;
        color: #888;
      }

      .fieldAlgoHint {
        padding: 8px 12px;
        border: 1px solid #ece9e6;
        border-radius: 10px;
        background: #f9faf9;
        color: #625b71;
      }

      input[type="text"],
      input[type="date"],
      textarea,
      select {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid #d9d6d2;
        border-radius: 12px;
        background: #ffffff;
        font-family: "Inter", sans-serif;
        font-size: 14px;
        line-height: 20px;
        color: #171717;
        outline: none;
        box-sizing: border-box;

        &:focus-visible {
          border-color: #336f8a;
        }

        &:disabled {
          background: #f3f3f2;
          color: #625b71;
        }
      }

      textarea {
        min-height: 72px;
        resize: vertical;
      }
    }

    .classTabFormSubsection {
      display: grid;
      gap: 10px;
      padding-top: 4px;

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        line-height: 22px;
        color: #171717;
      }

      .subsectionHint,
      .classTabEmptyInline {
        margin: 0;
        font-size: 14px;
        line-height: 20px;
        color: #625b71;
      }
    }

    .classTabCheckboxList {
      display: grid;
      gap: 8px;
    }

    .classTabCheckboxRow {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border: 1px solid #ece9e6;
      border-radius: 12px;
      background: #ffffff;
      cursor: pointer;

      &.selected {
        border-color: #c8d8df;
        background: #eef5f9;
      }

      input {
        margin-top: 3px;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .checkboxBody {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .checkboxTitle {
        font-size: 14px;
        font-weight: 600;
        line-height: 20px;
        color: #171717;
      }

      .checkboxMeta {
        margin: 0;
        font-size: 12px;
        line-height: 18px;
        color: #625b71;

        &.expired {
          color: #b3261e;
        }
      }

      .expiredBadge {
        display: inline-flex;
        align-items: center;
        margin-left: 8px;
        padding: 2px 8px;
        border-radius: 100px;
        background: #f8e1e1;
        color: #b3261e;
        font-size: 11px;
        font-weight: 600;
        line-height: 16px;
      }
    }

    .classTabFormActions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 4px;
    }

    .matchingRoundOpportunitiesGrid {
      min-height: 200px;
      width: 100%;
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        display: none;
      }

      .ag-body-vertical-scroll-viewport,
      .ag-body-horizontal-scroll-viewport,
      .ag-center-cols-viewport,
      .ag-body-viewport {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .ag-body-vertical-scroll-viewport::-webkit-scrollbar,
      .ag-body-horizontal-scroll-viewport::-webkit-scrollbar,
      .ag-center-cols-viewport::-webkit-scrollbar,
      .ag-body-viewport::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }

      .ag-root-wrapper {
        border-radius: 12px;
        overflow: hidden;
      }

      .matchingRoundOppRowReturned {
        background-color: #f3f3f3 !important;
        color: #8a8680;

        &.ag-row-hover,
        &.ag-row-selected {
          background-color: #ebebeb !important;
        }

        .ag-cell {
          color: #8a8680;
        }
      }
    }

    .matchingRoundOppInfoGridCell {
      padding: 0 !important;
      height: 100%;

      .ag-cell-wrapper,
      .ag-cell-value,
      .ag-react-container {
        display: flex;
        width: 100%;
        height: 100%;
        min-height: 100%;
        align-items: stretch;
      }
    }

    .matchingRoundOppInfoCell {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 100%;
      padding: 0;
      border: none;
      border-radius: 0;
      background: transparent;
      color: #625b71;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;

      &:hover {
        background: #eef5f9;
        color: #336f8a;
      }

      &.matchingRoundOppInfoCellReturned {
        background: #E6E6E6;
        color: #3f288f;

        &:hover {
          background: #E6E6E6;
          color: #3f288f;
        }
      }
    }

    [data-infotooltip-open="true"] .matchingRoundOppInfoCell {
      background: #eef5f9;
      color: #336f8a;
    }

    [data-infotooltip-open="true"] .matchingRoundOppInfoCellReturned {
      background: #d6cef0;
      color: #3f288f;
    }

    .matchingRoundOppInfoTooltip {
      display: grid;
      gap: 6px;
      max-width: 320px;

      p {
        margin: 0;
        font-size: 14px;
        line-height: 20px;
        color: #171717;
      }

      .expired {
        color: #b3261e;
      }
    }

    .classTabSecondaryLink {
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      border-radius: 100px;
      border: 1px solid #336f8a;
      color: #336f8a;
      font-family: "Inter", sans-serif;
      font-weight: 600;
      font-size: 14px;
      line-height: 20px;
      text-decoration: none;

      &:hover {
        background: #eef5f9;
      }
    }

    .classTabOpportunityList {
      display: grid;
      gap: 10px;
    }

    .classTabOpportunityRow {
      display: grid;
      gap: 6px;
      width: 100%;
      padding: 16px 18px;
      border: 1px solid #ece9e6;
      border-radius: 14px;
      background: #ffffff;
      box-shadow: 0 4px 14px rgba(23, 23, 23, 0.04);
      text-align: left;
      cursor: pointer;
      transition: border-color 0.15s ease, box-shadow 0.15s ease,
        transform 0.15s ease;

      &:hover,
      &:focus-visible {
        border-color: #c8d8df;
        box-shadow: 0 8px 22px rgba(23, 23, 23, 0.08);
        transform: translateY(-1px);
        outline: none;
      }

      .rowTitle {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 700;
        line-height: 22px;
        color: #171717;
      }

      .rowStatus {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 100px;
        background: #f0f4f6;
        color: #5f6871;
        font-size: 11px;
        font-weight: 600;
        line-height: 16px;
        text-transform: capitalize;
      }

      .rowStatusPublished {
        background: #e3f4ec;
        color: #1d6b3a;
      }

      .rowDescription,
      .rowMeta {
        margin: 0;
        font-size: 14px;
        line-height: 20px;
        color: #625b71;
      }
    }

    @media (max-width: 760px) {
      .classTabSection {
        padding: 18px;
        border-radius: 14px;
      }

      .classTabInformationBlock {
        grid-template-columns: 1fr;
      }

      .classTabTemplateCardRow {
        grid-template-columns: 1fr;
      }

      .classTabTemplateCardActions {
        justify-content: flex-start;
        flex-wrap: wrap;
      }
    }
  }

  .settings {
    display: grid;
    gap: 28px;
    max-width: 980px;
    padding-bottom: 40px;
    font-family: "Inter", sans-serif;

    .settingsSection {
      display: grid;
      gap: 16px;
      padding: 24px;
      border: 1px solid #e6e6e6;
      border-radius: 18px;
      background: linear-gradient(180deg, #ffffff 0%, #fbfbfa 100%);
      box-shadow: 0 10px 30px rgba(23, 23, 23, 0.06);
    }

    .settingsSectionHeader {
      display: grid;
      gap: 6px;
      max-width: 100%;

      h3 {
        margin: 0;
        font-family: "Inter", sans-serif;
        font-size: 22px;
        font-weight: 700;
        line-height: 30px;
        color: #171717;
      }

      p {
        margin: 0;
        font-size: 15px;
        line-height: 22px;
        color: #625b71;
      }
    }

    .informationBlock {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      .block {
        display: grid;
        align-content: start;
        gap: 14px;
        padding: 20px;
        border: 1px solid #ece9e6;
        border-radius: 16px;
        background: #ffffff;
        box-shadow: 0 6px 18px rgba(23, 23, 23, 0.04);

        p {
          margin: 0;
        }

        ul {
          display: grid;
          gap: 8px;
          margin: 0;
          padding-left: 20px;
          color: #3d3d3d;
          font-size: 14px;
          line-height: 20px;
        }
      }
      .curriculumTypeBlock {
        grid-column: 1 / -1;
      }
    }

    .settingsQuestion {
      font-family: "Inter", sans-serif;
      font-size: 16px;
      font-weight: 600;
      line-height: 22px;
      color: #171717;
    }

    .classDescriptionSettingsHint {
      margin: 0;
      color: #625b71;
      font-size: 14px;
      line-height: 20px;
    }

    .settingsChoiceGroup {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));

      label {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 48px;
        padding: 12px 14px;
        border: 1px solid #d9d6d2;
        border-radius: 14px;
        background: #f9faf9;
        color: #333333;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
        transition: border-color 0.2s ease, background-color 0.2s ease,
          box-shadow 0.2s ease, color 0.2s ease;

        input {
          flex-shrink: 0;
          width: 17px;
          height: 17px;
          margin: 0;
          accent-color: var(--MH-Theme-Primary-Dark, #336f8a);
        }

        &:hover {
          border-color: rgba(51, 111, 138, 0.45);
          background: #f6f9f8;
        }

        &.active {
          border-color: var(--MH-Theme-Primary-Dark, #336f8a);
          background: rgba(51, 111, 138, 0.08);
          color: #265568;
          box-shadow: 0 8px 20px rgba(51, 111, 138, 0.14);
        }
      }
    }

    .networkTypeSections {
      display: grid;
      gap: 18px;
    }

    .networkTypeSection {
      display: grid;
      gap: 12px;
      padding: 16px;
      border: 1px solid #ece9e6;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.72);
    }

    .networkTypeSection--school {
      border-color: rgba(51, 111, 138, 0.28);
      background: linear-gradient(
        180deg,
        rgba(51, 111, 138, 0.06) 0%,
        rgba(255, 255, 255, 0.88) 48%
      );

      .networkTypeSectionIcon {
        background: rgba(51, 111, 138, 0.12);
      }

      .networkTypeSectionIcon img {
        filter: invert(36%) sepia(18%) saturate(1260%) hue-rotate(155deg)
          brightness(92%) contrast(88%);
      }
    }

    .networkTypeSection--feedback {
      border-color: rgba(124, 102, 194, 0.28);
      background: linear-gradient(
        180deg,
        rgba(124, 102, 194, 0.07) 0%,
        rgba(255, 255, 255, 0.88) 48%
      );

      .networkTypeSectionIcon {
        background: rgba(124, 102, 194, 0.12);
      }

      .networkTypeSectionIcon img {
        filter: invert(42%) sepia(24%) saturate(1140%) hue-rotate(214deg)
          brightness(92%) contrast(90%);
      }

      .networkCard:hover,
      .networkCard:focus-within {
        border-color: rgba(124, 102, 194, 0.45);
        background: #f7f5fc;
        box-shadow: 0 10px 24px rgba(124, 102, 194, 0.12);
      }
    }

    .networkTypeSectionHeader {
      display: grid;
      gap: 6px;

      h4 {
        margin: 0;
        color: #171717;
        font-family: "Inter", sans-serif;
        font-size: 17px;
        font-weight: 700;
        line-height: 24px;
      }

      p {
        margin: 0;
        color: #625b71;
        font-size: 14px;
        line-height: 20px;
      }
    }

    .networkTypeSectionTitleRow {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .networkTypeSectionIcon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;

      img {
        width: 20px;
        height: 20px;
        object-fit: contain;
      }
    }

    .networkTypeSectionActions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: flex-start;
    }

    .networkCardGrid {
      display: grid;
      gap: 12px;
      width: 100%;
      grid-template-columns: repeat(
        auto-fill,
        minmax(min(100%, 280px), 280px)
      );
      align-items: stretch;
      justify-content: start;
    }

    .networkSectionActions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-top: 12px;
    }

    .networkEmptyState {
      margin: 0;
      padding: 16px;
      border: 1px dashed #d3dae0;
      border-radius: 14px;
      background: #ffffff;
      color: #625b71;
      font-size: 14px;
      line-height: 20px;
    }

    .networkCard {
      display: grid;
      gap: 10px;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 14px;
      border: 1px solid #e6e6e6;
      border-radius: 16px;
      background: #ffffff;
      color: inherit;
      font-family: "Inter", sans-serif;
      text-align: left;
      box-shadow: 0 6px 18px rgba(23, 23, 23, 0.03);
      transition: border-color 0.2s ease, background-color 0.2s ease,
        box-shadow 0.2s ease, transform 0.2s ease;
    }

    .networkCard:hover,
    .networkCard:focus-within {
      border-color: rgba(51, 111, 138, 0.45);
      background: #f6f9f8;
      box-shadow: 0 10px 24px rgba(23, 23, 23, 0.08);
      transform: translateY(-1px);
    }

    .networkCardHeader {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }

    .networkCardTitle {
      display: -webkit-box;
      margin: 0;
      overflow: hidden;
      color: #171717;
      font-family: "Inter", sans-serif;
      font-size: 16px;
      font-weight: 700;
      line-height: 22px;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .networkCardDescription {
      display: -webkit-box;
      overflow: hidden;
      color: #625b71;
      font-size: 14px;
      line-height: 20px;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .networkCardMeta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      color: #a1a1a1;
      font-size: 14px;
      line-height: 20px;
    }

    .networkCardAction {
      justify-self: start;
      color: var(--MH-Theme-Primary-Dark, #336f8a);
      font-size: 14px;
      font-weight: 600;
      line-height: 18px;
    }

    .networkCardActions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .curriculumTypeSelector {
      border: none;
      margin: 0;
      padding: 0;
    }

    .curriculumTypeLegend {
      font-family: "Inter", sans-serif;
      font-weight: 600;
      font-size: 17px;
      line-height: 24px;
      color: #171717;
      margin: 0 0 4px 0;
      padding: 0;
    }

    .curriculumTypeHelp {
      font-family: "Inter", sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      color: #625b71;
      margin: 0 0 16px 0;
    }

    .curriculumTypeOptions {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .curriculumTypeOption {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      padding: 16px;
      border: 1px solid #a1a1a1;
      border-radius: 16px;
      background: #ffffff;
      cursor: pointer;
      transition: border-color 0.2s, background-color 0.2s,
        box-shadow 0.2s;

      input {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        margin: 0;
        accent-color: var(--MH-Theme-Primary-Dark, #336f8a);
      }

      &:hover {
        background: #f6f9f8;
        border-color: rgba(51, 111, 138, 0.45);
      }

      &.curriculumTypeOptionSelected {
        border-color: var(--MH-Theme-Primary-Yellow, #f9d978);
        background: #fffaf0;
        box-shadow: 0 8px 20px rgba(242, 190, 66, 0.18);
      }
    }

    .curriculumTypeOptionContent {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .curriculumTypeLogo {
      width: min(200px, 100%);
      height: 42px;
      object-fit: contain;
    }

    .curriculumTypeLabel {
      font-family: "Inter", sans-serif;
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
      color: #171717;
    }

    .curriculumTypeFallbackNote {
      margin: 8px 0 0;
      font-size: 13px;
      color: #625b71;
    }

    .settingsDangerSection {
      border-color: #f2d2d1;
      background: linear-gradient(180deg, #fffefe 0%, #fff8f7 100%);

      .block {
        border-color: #f3dfdd;
      }
    }

    .settingsDeleteButton {
      justify-self: start;
      min-height: 44px;
      padding: 0 18px;
      border: 1px solid #b62524;
      border-radius: 12px;
      background: #d53533;
      color: #ffffff;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      font-weight: 700;
      line-height: 20px;
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease,
        box-shadow 0.2s ease;

      &:hover:not(:disabled) {
        background: #b62524;
        border-color: #9f1f1f;
        box-shadow: 0 8px 20px rgba(213, 53, 51, 0.2);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
    }

    @media (max-width: 760px) {
      .settingsSection {
        padding: 18px;
        border-radius: 14px;
      }

      .informationBlock {
        grid-template-columns: 1fr;
      }

      .networkCardGrid {
        grid-template-columns: minmax(0, 1fr);
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
