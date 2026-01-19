import styled from "styled-components";

export const StyledProposal = styled.div`
  display: grid;
  width: 100%;
  overflow-y: auto;
  padding: 20px;
  // min-height: 80vh;
  background: #f7f9f8;
  align-items: baseline;
  font-family: "Nunito";

  .closeBtn {
    line-height: 3rem;
    text-align: center;
    cursor: pointer;
    border-radius: 2.25rem;
    color: #5f6871;
    font-size: 3rem;
    cursor: pointer;
    :hover {
      transform: scale(1.5);
      transition: transform 0.5s;
      color: red;
    }
  }

  button {
    display: grid;
    align-content: center;
    max-width: 300px;
    width: 100%;
    background: none;
    color: #666666;
    padding: 15px 10px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    cursor: pointer;
    font-family: Roboto;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: 0.05em;
    text-align: center;
  }

  .overview {
    display: grid;
    grid-gap: 1rem;
    margin: 3rem;
    align-content: baseline;
    .navigationHeader {
      display: grid;
      justify-content: end;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 200px;
      align-items: center;
    }

    .proposalHeader {
      display: grid;
      margin: 5px;
      padding: 10px;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      cursor: pointer;
      font-weight: bold;
    }
    .itemRow {
      display: grid;
      margin: 5px;
      padding: 10px;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      background: white;
      align-items: center;
      .actionLinks {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        grid-gap: 1rem;
      }
    }
    .main {
      border: 1px solid gray;
    }
  }

  .empty {
    display: grid;
    margin: 10px 0px 20px 0px;
    grid-gap: 1rem;
    align-content: center;
    justify-content: center;
    justify-items: center;
    text-align: center;
    width: 100%;
  }

  .dropdown {
    width: 100%;
    height: auto;
  }

  .proposalBoard {
    display: grid;
    grid-template-rows: auto 1fr;
    margin: 20px;
    
    .narrowButton {
      height: 40px;
      padding: 8px 24px 8px 16px;
      justify-content: center;
      gap: 8px;
      flex-shrink: 0;
      width: auto;
      display: inline-flex;
      align-items: center;
      margin: 1rem 0;
      background: #336F8A;
      color: white;
      border-radius: 100px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    .narrowButton:hover {
      border-radius: 100px;
      border: 1px #F9D978;
      color: #274E5B;
      background: #F9D978;
      box-shadow: 2px 2px 12px 0 rgba(0, 0, 0, 0.15);
    }

    .narrowButtonSecondary {
      height: 40px;
      padding: 8px 24px 8px 16px;
      justify-content: center;
      gap: 8px;
      flex-shrink: 0;
      width: auto;
      display: inline-flex;
      align-items: center;
      margin: 1rem 0;
      background: white;
      color: #336F8A;
      border-radius: 100px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    .narrowButtonSecondary:hover {
      display: inline-flex;
      height: 40px;
      padding: 8px 24px 8px 16px;
      justify-content: center;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      border-radius: 100px;
      border: 1px solid var(--MH-Theme-Primary-Dark, #336F8A);
      background: var(--MH-Theme-Neutrals-Lighter, #F3F3F3);
    }

    .previewToggle {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      column-gap: 16px;
      align-items: center;
      margin: 5px 0px 15px 0px;
      span {
        font-family: Roboto;
        font-size: 18px;
        font-style: normal;
        font-weight: 400;
        line-height: 24px;
        letter-spacing: 0.05em;
      }
      .goBackButton {
        cursor: pointer;
      }
      .preview {
        display: grid;
        grid-gap: 1rem;
        grid-template-columns: auto 1fr;
        align-items: center;
      }
      .alert {
        background: #fff9e6;
        padding: 5px 10px 5px 10px;
        margin-left: 5px;
        border-radius: 4px;
        span,
        .icon {
          font-weight: 400;
          font-size: 13px;
          color: #666666;
        }
      }
    }
    .proposalPDF {
      display: grid;
      align-content: baseline;
      margin: 20px;
      max-width: 90vw;
      height: 100%;
    }
  }

  .newInput {
    display: grid;
    width: 100%;
    justify-content: stretch;
    text-align: start;
    padding: 0px 20px;
    input {
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      padding: 10px 10px 10px 10px;
      height: 70px;
    }
    .addBtn {
      display: grid;
      justify-self: center;
      margin: 10px 0px 5px 0px;
      cursor: pointer;
      text-align: center;
      padding: 5px;
      color: #007c70;
      width: fit-content;
    }
  }

  .inner {
    display: grid;
    grid-template-columns: 1fr auto;
    .scrollable {
      overflow-x: auto;
    }
  }

  .sections {
  }

  .section {
    display: grid;
    justify-items: center;
    grid-gap: 12px;
    position: relative;
    background: none;
    border: 1px solid #A1A1A1;
    border-radius: 8px;
    min-width: 250px;
    margin: 15px;
    padding: 24px;
    // width: 410px;
    .infoLine {
      margin: 1rem 0px 0px 0rem;
      display: grid;
      color: #b3b3b3;
      font-family: Nunito;
      font-size: 16px;
      font-weight: 500;
      line-height: 24px;
      letter-spacing: var(--BodySmallTracking);
      text-align: left;
      text-underline-position: from-font;
      text-decoration-skip-ink: none;
    }
    .column-drag-handle {
      display: grid;
      width: 100%;
      margin: 0px 0px 0px 0px;
      // padding: 1rem 2rem 1rem 2rem;
      // box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      .firstLine {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 10px;
        justify-items: baseline;
        align-items: center;
        text-align: center;
        margin: 1rem 0px 0px 0rem;
      }
      .sectionTitle {
        font-family: Nunito;
        font-size: 22px;
        font-weight: 600;
        line-height: 28px;
        letter-spacing: 0.05em;
        text-align: left;
        text-underline-position: from-font;
        text-decoration-skip-ink: none;
      }
      span {
        font-family: Lato;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 21px;
        letter-spacing: 0em;
        text-align: center;
      }
    }
    .deleteBtn {
      position: absolute;
      bottom: -12px;
      left: -5px;
      cursor: pointer;
      img {
        width: 20px;
        opacity: 0.1;
      }
      img: hover {
        opacity: 1;
      }
    }
  }

  .header {
    display: grid;
    .headerContent {
      width: 100%;
    }
    .headerMainContent {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }
    .headerLeftSection {
      display: flex;
      flex: 1 0 0;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }
    .headerRightSection {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      padding-left: 8px;
    }
    .headerTitleRow {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .headerEditIcon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #F3F3F3;
      border-radius: 100px;
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
      .icon {
        // color: #336F8A;
        margin: 0;
        width: 24px;
        height: 24px;
        aspect-ratio: 1 / 1;
      }
      img {
        width: 24px;
        height: 24px;
        aspect-ratio: 1 / 1;
        object-fit: contain;
        border: none;
      }
      &:hover {
      // background: #E6E6E6;
      border: 1px solid #336F8A;
      img {
        border: none;
      }
    }
    }
    .headerTitle {
      font-family: "Nunito", sans-serif;
      font-style: normal;
      font-weight: 600;
      font-size: 36px;
      line-height: 44px;
      color: #171717;
      margin: 0;
      flex: 1;
    }
    .headerInfoRow {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 8px;
      width: 100%;
      justify-content: flex-start;
      align-items: flex-start;
    }
    .studyLinkChip {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      height: 32px;
      border-radius: 8px;
      padding: 6px 12px;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1.5px solid;
      white-space: nowrap;
      font-family: inherit;
      width: fit-content;
      &:focus {
        outline: none;
      }
      &.board {
        background: #F9D978;
        border-color: #5D5763;
        color: #171717;
        &:hover:not(:disabled) {
          background: #F5D165;
          border-color: #4A4550;
        }
      }
      &.list {
        background: #DEF8FB;
        border-color: #336F8A;
        color: #171717;
        width: max-content;
        max-width: 100%;
        &:hover:not(:disabled) {
          background: #C8F0F5;
          border-color: #2A5A6D;
        }
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    .studyLinkChipContent {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      padding: 0;
      min-width: 0;
      flex: 0 1 auto;
    }
    .studyLinkIcon {
      width: fit-content;
      height: fit-content;
      flex-shrink: 0;
      margin: 0;
      display: block;
    }
    .studyLinkText {
      margin: 0;
      font-family: "Nunito", sans-serif;
      font-style: normal;
      font-weight: 600;
      font-size: 14px;
      line-height: 20px;
      color: #171717;
      white-space: nowrap;
      text-align: left;
      letter-spacing: 0px;
      width: fit-content;
      vertical-align: middle;
      min-width: 0;
    }
    .collaboratorArray {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: nowrap;
      width: 100%;
    }
    .collaboratorChip {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      border: 1px solid #A1A1A1;
      border-radius: 30px;
      padding: 4px 12px 4px 12px;
      gap: 8px;
      background: white;
      overflow: hidden;
      width: fit-content;
      max-width: 300px;
      span {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: flex;
        height: 100%;
        align-items: center;
      }
    }
    .addCollaboratorButton {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid #A1A1A1;
      border-radius: 20px;
      background: white;
      cursor: pointer;
      padding: 4px;
      flex-shrink: 0;
      &:hover {
        background: #F3F3F3;
      }
      .icon {
        color: #171717;
        margin: 0;
      }
    }
    .downloadButton {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 40px;
      padding: 8px 12px 8px 16px;
      border-radius: 100px;
      // border: 1px solid #336F8A;
      // background: white;
      color: #336F8A;
      font-family: "Nunito", sans-serif;
      font-style: normal;
      font-weight: 600;
      font-size: 14px;
      line-height: 20px;
      cursor: pointer;
      flex-shrink: 0;
      &:hover {
        background: #FDF2D0;
        color: #625B71;
        .icon {
          color: #625B71;
        }
      }
      .icon {
        margin: 0;
        width: 24px;
        height: 24px;
        color: #336F8A;
      }
    }
    .downloadButtonText {
      white-space: nowrap;
    }
    .viewToggleGroup {
      display: flex;
      align-items: center;
      gap: 0;
    }
    .viewToggleButton {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 40px;
      padding: 8px 24px 8px 16px;
      border: 1px solid #336F8A;
      font-family: "Nunito", sans-serif;
      font-style: normal;
      font-weight: 600;
      font-size: 14px;
      line-height: 20px;
      cursor: pointer;
      white-space: nowrap;
      margin-right: -1px;
      &.left {
        border-top-left-radius: 100px;
        border-bottom-left-radius: 100px;
      }
      &.right {
        border-top-right-radius: 100px;
        border-bottom-right-radius: 100px;
      }
      &.active {
        background: #D3E0E3;
        color: #336F8A;
        border-color: #336F8A;
        .icon {
          color: #336F8A;
          margin: 0;
        }
      }
      &.inactive {
        background: white;
        color: #336F8A;
        border-color: #336F8A;
        .icon {
          color: #336F8A;
          margin: 0;
        }
      }
      &:hover {
        background: #F3F3F3;
      }
      img {
        width: 18px;
        height: 18px;
        object-fit: contain;
        margin: 0;
        filter: brightness(0) saturate(100%) invert(26%) sepia(94%) saturate(1234%) hue-rotate(158deg) brightness(92%) contrast(87%);
      }
    }
    .titleEdit {
      font-family: "Nunito";
      font-style: normal;
      font-weight: 600;
      font-size: 40px;
      line-height: 125%;
      color: #171717;
      background: white;
    }
    .titleIcon {
      display: grid;
      grid-gap: 20px;
      grid-template-columns: auto 1fr;
      .title {
        font-family: "Nunito";
        font-style: normal;
        font-weight: 600;
        font-size: 40px;
        line-height: 125%;
        color: #171717;
      }
      .icon {
        display: grid;
        align-content: center;
        cursor: pointer;
      }
    }
    .subtitle {
      font-family: "Nunito";
      font-style: normal;
      font-weight: 400;
      font-size: 24px;
      line-height: 32px;
      color: #6c6c6c;
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
      letter-spacing: 0em;
      text-align: left;
      color: #1a1a1a; */
    }
    .description {
      font-family: Lato;
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      line-height: 32px;
      letter-spacing: 0em;
      text-align: left;
      color: #666666;
    }
    .checkboxField {
      display: grid;
      grid-template-columns: 30px 1fr;
      grid-gap: 10px;
      align-items: center;
      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        color: green;
      }
    }
    .titleEditBtn {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .cardPreview {
    display: grid;
    grid-gap: 10px;
    margin: 3rem;
    .description {
      background: #fbfaf7;
      padding: 10px 5px;
      border-radius: 7px;
    }

    .buttons {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr auto;
      justify-items: end;
      grid-gap: 10px;

      .button {
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
  }

  .post {
    display: grid;
    grid-row-gap: 10px;
    font-family: Lato;
    font-size: 18px;
    text-align: left;
    background: #F7F9F8;
    padding: 10px;

    .resourcePreview {
      display: grid;
      grid-gap: 20px;
      .resourceBlockPreview {
        .titleIcons {
          display: grid;
          align-items: center;
          grid-gap: 10px;
          grid-template-columns: 1fr auto auto;
        }
        border: 1px solid #CCCCCC;
        border-radius: 4px;
        padding: 10px;
        border-radius: 10px;
      }
    }

    .lockedMessage {
      display: grid;
      grid-gap: 15px;
      align-items: center;
      grid-template-columns: 1fr auto;
      background: orange;
      padding: 15px;
      .username {
        font-weight: bold;
      }
      .buttonHolder {
        display: grid;
        button {
          background: white;
        }
      }
    }

    .navigation-build-mode {
      display: grid;
      align-items: center;
      padding: 6px 9px;
      grid-template-columns: auto 1fr auto;
      grid-gap: 20px;
      background: white;
      .left {
        display: grid;
        .icon {
          width: 40px;
          height: 40px;
        }
        .selector {
          display: grid;
          grid-gap: 10px;
          align-items: center;
          justify-items: center;
          border-radius: 12px;
          width: 40px;
          height: 40px;
          box-shadow: 0px 1px 3px 0px #0000004d;
        }
      }
      .middle {
        font-family: Nunito;
        font-size: 24px;
        font-weight: 500;
        line-height: 40px;
        text-align: left;
        text-underline-position: from-font;
        text-decoration-skip-ink: none;
      }
      .right {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-gap: 10px;
        .editModeMessage {
          display: grid;
          align-items: center;
          margin: 0px 10px;
        }
        .saveButton {
          background: #3d85b0;
          color: white;
          border-radius: 100px;
          font-family: Nunito;
          font-size: 20px;
          font-weight: 700;
          line-height: var(--LabelLargeLineHeight);
          letter-spacing: var(--LabelLargeTracking);
          text-align: center;
          text-underline-position: from-font;
          text-decoration-skip-ink: none;
          padding: 10px 24px;
        }
      }
    }
    .buttons {
      width: auto;
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 200px 200px;
      justify-content: end;
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

    .proposalCardBoard {
      display: grid;
      align-items: baseline;
      grid-gap: 30px;
      grid-template-columns: 6fr 4fr;
      height: 100%;
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
      font-family: 'Nunito';
      font-style: normal;
      font-weight: 600;
      font-size: 24px;
      line-height: 32px;
      color: #3B3B3B;
    }
    .cardSubheader {
      color: var(--neutral_grey2, #3b3b3b);
      font-family: Nunito;
      font-size: 24px;
      font-weight: 600;
      line-height: 32px;
      text-align: left;
      text-underline-position: from-font;
      text-decoration-skip-ink: none;
    }
    .cardSubheaderComment {
      font-family: 'Nunito';
      font-style: normal;
      font-weight: 400;
      font-size: 16px;
      line-height: 22px;
      display: flex;
      align-items: center;
      color: #626269;
      mix-blend-mode: normal;
      opacity: 0.7;
    }
    .cardDescription {
      color: #626269;
      font-family: Nunito;
      font-size: 17px;
      font-weight: 400;
      line-height: 23.19px;
      text-align: left;
      text-underline-position: from-font;
      text-decoration-skip-ink: none;
    }
    .checkboxText {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-gap: 15px;
      align-items: center;
    }
    .textBoard {
      display: grid;
      grid-gap: 10px;
      margin: 15px 10px 100px 20px;
    }
    .infoBoard {
      display: grid;
      grid-gap: 10px;
      align-content: baseline;
      border-radius: 0px 4px 4px 0px;
      margin: 10px;
      /* padding: 53px 30px 30px 37px; */
      font-family: Roboto;
      font-size: 16px;
      font-style: normal;
      font-weight: 500;
      line-height: 30px;
      letter-spacing: 0em;
      text-align: left;
      height: 100%;
    }
    .resourceLinks {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

      .link {
        display: grid;
        background: #def8fb;
        border: 1px solid #cccccc;
        border-radius: 20px;
        padding: 9px 16px;
        font-family: Nunito;
        font-size: 16px;
        font-weight: 400;
        line-height: 21.82px;
        text-align: left;
        text-underline-position: from-font;
        text-decoration-skip-ink: none;
        align-items: center;
        justify-items: center;
        text-align: center;
      }
    }
    .proposalCardComments {
      display: grid;
    }
  }

  .jodit {
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
      margin: 1px;
      border: 0px solid #e6e6e6;
      cursor: pointer;
    }
    .jodit-toolbar-button__button {
      background: transparent;
      color: black;
    }
    .jodit-ui-button__text {
      color: black;
    }
  }
`;

export const StyledProposalCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  background: #ffffff;
  border: 1px solid #a1a1a1;
  border-radius: 12px;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
  width: calc(100% - 20px);
  cursor: pointer;
  margin: 3px 10px;
  font-family: Nunito;
  box-sizing: border-box;

  .card-drag-handle {
    height: 100%;
    display: flex;
    flex: 1 0 0;
  }
  .deleteCardBtn {
    position: absolute;
    bottom: -12px;
    left: -5px;
    cursor: pointer;
    img {
      width: 20px;
      opacity: 0.1;
    }
    img:hover {
      opacity: 1;
    }
  }
  .card-information {
    display: flex;
    flex: 1 0 0;
    align-items: center;
    gap: 8px;
    min-height: 80px;
    padding: 0px 0px 0px 16px;

    .info-assigned-container {
      display: grid;
      justify-items: baseline;
      grid-gap: 5px;
    }
    .info-assigned {
      display: grid;
      align-items: center;
      color: #666666;
      background: #ffffff;
      border: 1px solid #e6e6e6;
      box-sizing: border-box;
      border-radius: 60px;
      font-family: Lato;
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 0.05em;
      padding: 1px 7px 1px 7px;
    }

    .card-left-side {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      img {
        width: 24px;
        height: 24px;
      }
    }
    .card-right-side {
      display: flex;
      flex: 1 0 0;
      flex-direction: column;
      margin: 0px;
      min-width: 0;
      .card-title {
        display: flex;
        flex: 1 0 0;
        font-family: Nunito;
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 24px;
        color: #171717;
        min-width: 0;
        div {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 100px;
          max-width: 200px;
        }
      }
      .editedByAvatar {
        display: grid;
        align-content: end;
      }
    }
    .card-feedback-tag {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      height: 100%;
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
      flex-shrink: 0;
      img {
        width: 24px;
        height: 24px;
      }
      &.feedback-non-submitted {
        background: #f9d978;
        border-left: 1px solid #a1a1a1;
      }
      &.feedback-submitted {
        background: #def8fb;
        border-left: 1px solid #a1a1a1;
      }
    }
  }
`;

export const StyledActionCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  border-radius: 12px;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  margin: 3px 10px;
  width: calc(100% - 20px);
  font-family: Nunito;
  overflow: hidden;
  box-sizing: border-box;

  background: ${(props) => {
    if (props.proposalBuildMode) return "#FFFFFF";
    if (props.variant === "ACTION_SUBMITTED") return "#def8fb";
    if (props.variant === "ACTION_NOT_SUBMITTED") return "#fdf2d0";
    return "#FFFFFF";
  }};

  border: ${(props) => {
    if (props.proposalBuildMode) return "1px solid #a1a1a1";
    if (props.variant === "ACTION_SUBMITTED") return "1px solid #336f8a";
    if (props.variant === "ACTION_NOT_SUBMITTED") return "1px solid #5d5763";
    return "1px solid #a1a1a1";
  }};

  .card-drag-handle {
    // height: 100%;
    display: flex;
    flex: 1 0 0;
  }

  .deleteCardBtn {
    position: absolute;
    bottom: -12px;
    left: -5px;
    cursor: pointer;
    img {
      width: 20px;
      opacity: 0.1;
    }
    img:hover {
      opacity: 1;
    }
  }

  .card-information {
    display: flex;
    flex: 1 0 0;
    align-items: stretch;

    .card-left-section {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 0px 16px 16px;
      border-top-left-radius: 12px;
      border-bottom-left-radius: 12px;
      background: ${(props) => {
        if (props.proposalBuildMode) return "transparent";
        if (props.variant === "ACTION_SUBMITTED") return "#def8fb";
        if (props.variant === "ACTION_NOT_SUBMITTED") return "#fdf2d0";
        return "transparent";
      }};
      flex-shrink: 0;
      img {
        width: 24px;
        height: 24px;
      }
      svg {
        width: 24px;
        height: 24px;
      }
    }

    .card-right-section {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 16px 16px 0px;
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
      background: ${(props) => {
        if (props.proposalBuildMode) return "transparent";
        if (props.variant === "ACTION_SUBMITTED") return "#def8fb";
        if (props.variant === "ACTION_NOT_SUBMITTED") return "#fdf2d0";
        return "transparent";
      }};
      flex-shrink: 0;
      svg {
        width: 24px;
        height: 24px;
      }
    }

    .card-content {
      display: flex;
      flex: 1 0 0;
      flex-direction: column;
      justify-content: center;
      padding: 16px;
      gap: 4px;

      .card-title {
        font-family: Nunito;
        font-style: normal;
        font-weight: 600;
        font-size: 16px;
        line-height: 24px;
        color: #171717;
      }

      .card-subtitle {
        font-family: Nunito;
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        color: #6a6a6a;
      }
    }
  }
`;
