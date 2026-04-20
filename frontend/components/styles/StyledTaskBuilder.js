import styled from "styled-components";

const StyledTaskBuilder = styled.div`
  .buildArea {
    display: grid;
    align-content: baseline;
    grid-gap: 20px;
    margin: 3rem;
    width: auto;
    font-size: 1.5rem;
    line-height: 1.5;

    height: 90vh;
    overflow-y: auto;

    .block {
      display: grid;
      max-width: 800px;
    }

    .wideBlock {
      display: grid;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
    }

    label {
      display: block;
      font-style: normal;
      font-weight: 600;
      font-size: 1.5rem;
      color: #4a5568;
      margin-bottom: 4px;
    }

    input,
    textarea,
    select {
      font-family: Lato;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      width: 100%;
      font-size: 16px;
      line-height: 24px;
      padding: 10px 12px;
      background: #fff;
      color: #2d3748;
      &:focus {
        outline: 0;
        border-color: #007c70;
        box-shadow: 0 0 0 3px rgba(0, 124, 112, 0.1);
      }
    }
    fieldset {
      display: grid;
      grid-gap: 20px;
      border: 0;
      padding: 0;
      &[disabled] {
        opacity: 0.5;
      }

      /* Section header for "Task parameters" */
      > label {
        font-size: 1.6rem;
        font-weight: 700;
        color: #2d3748;
        padding-bottom: 8px;
        border-bottom: 2px solid #e2e8f0;
        margin-bottom: 4px;
      }
    }
  }

  .goBackBtn {
    cursor: pointer;
    margin: 1rem;
    font-family: Lato;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    letter-spacing: 0em;
    text-align: left;
    color: #007c70;
  }

  .parametersArea {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 10px;
  }

  .hideContinueBtn {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 10px;
    align-items: center;
  }

  .surveyBuilderItemLine {
    border-bottom: 3px #e7d6d6 solid;
    padding-bottom: 30px;
    margin: 3rem 0rem;
    display: grid;
    grid-template-columns: 9fr 1fr;
    grid-column-gap: 10px;
    .controlButtons {
      display: grid;
      button {
        background-color: #ff2d2d;
        border-radius: 2.25rem;
      }
    }
    .deleteDiv {
      display: grid;
      align-self: start;
      justify-self: end;
    }
    .moveButtons {
      display: grid;
      align-self: end;
      justify-self: end;
      button {
        background-color: orange;
        :hover {
          background-color: #d9b616;
          transform: scale(1.1);
          transition: transform 0.5s;
        }
      }
    }
    button {
      cursor: pointer;
      width: 4.3rem;
      text-align: center;
      /* border-radius: 2.25rem; */
      /* background-color: #ff2d2d; */
      color: white;
      font-size: 2rem;
      :hover {
        /* background-color: #ea0707; */
        transform: scale(1.1);
        transition: transform 0.5s;
      }
    }
    textarea {
      height: 120px;
    }
    .optionRow {
      display: grid;
      grid-template-columns: 9fr 1fr;
      grid-column-gap: 10px;
    }
    .addOptionButton {
      cursor: pointer;
      width: 10rem;
      text-align: center;
      border-radius: 3rem;
      background-color: #a78803;
      color: white;
      font-size: 1.5rem;
      :hover {
        background-color: #e5bc0c;
        transform: scale(1.1);
        transition: transform 0.5s;
      }
    }
  }

  .timeout {
    margin: 1rem 0rem 0rem 0rem;
    max-width: 300px;
  }

  .statementLine {
    display: grid;
    grid-template-columns: 9fr 1fr;
    button {
      cursor: pointer;
      width: 4.3rem;
      text-align: center;
      border-radius: 2.25rem;
      background-color: #4fbf1f;
      color: white;
      font-size: 2rem;
      :hover {
        background-color: #ea0707;
        transform: scale(1.1);
        transition: transform 0.5s;
      }
    }
  }

  .optionLine {
    width: auto;
    background: white;
    color: grey;
    border: 0;
    border-radius: 5px;
    font-size: 2rem;
    font-weight: 600;
    padding: 1rem 1.2rem;
    margin-bottom: 10px;
    cursor: pointer;
    border: 1px solid lightslategrey;
    &.selected {
      background: #24b781;
      color: white;
    }
  }

  /* ── Survey Builder Page Navigation ── */
  .surveyPageNav {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .surveyPageNavLabel {
    font-size: 1.3rem;
    font-weight: 700;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-right: 4px;
  }

  .pageTabButton {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid #007c70;
    background: white;
    color: #007c70;
    font-size: 1.4rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: background 0.15s, color 0.15s;
    &:hover {
      background: #e6f4f3;
    }
    &.active {
      background: #007c70;
      color: white;
    }
  }

  .addPageButton {
    height: 36px;
    padding: 0 14px;
    border-radius: 18px;
    border: 2px dashed #007c70;
    background: white;
    color: #007c70;
    font-size: 1.4rem;
    cursor: pointer;
    font-family: Lato;
    transition: background 0.15s;
    &:hover {
      background: #e6f4f3;
    }
  }

  .surveyPreviewBtn {
    height: 36px;
    padding: 0 14px;
    border-radius: 18px;
    border: 2px solid #007c70;
    background: #007c70;
    color: white;
    font-size: 1.4rem;
    cursor: pointer;
    font-family: Lato;
    transition: all 0.15s;
    &:hover {
      background: #005a52;
      border-color: #005a52;
    }
  }

  .deletePageButton {
    margin-left: auto;
    height: 32px;
    padding: 0 12px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    background: white;
    color: #a0aec0;
    font-size: 1.3rem;
    font-family: Lato;
    cursor: pointer;
    transition: all 0.15s;
    &:hover {
      border-color: #e53e3e;
      color: #e53e3e;
      background: #fff5f5;
    }
  }

  .surveyEmptyState {
    text-align: center;
    padding: 32px 20px;
    background: #f7fafc;
    border-radius: 8px;
    border: 2px dashed #e2e8f0;
    color: #a0aec0;
    font-size: 1.5rem;
  }

  /* ── Page Settings Panel ── */
  .pageSettingsPanel {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 24px;
    padding: 12px 16px;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 16px;

    .pageSettingItem {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.4rem;
      color: #4a5568;

      label {
        font-size: 1.4rem;
        font-weight: normal;
        display: inline;
      }

      input[type="checkbox"] {
        width: auto;
        margin: 0;
        cursor: pointer;
      }

      input[type="number"] {
        width: 100px !important;
        padding: 6px 10px !important;
        font-size: 1.4rem;
        display: inline-block;
      }

      .timeoutUnit {
        color: #718096;
        font-size: 1.3rem;
      }
    }
  }

  /* ── Survey Item Cards ── */
  .surveyItemCard {
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #007c70;
    background: white;
    margin-bottom: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

    &.type-text     { border-left-color: #007c70; }
    &.type-select   { border-left-color: #3182ce; }
    &.type-checkbox { border-left-color: #5a67d8; }
    &.type-freeinput { border-left-color: #319795; }
    &.type-vas      { border-left-color: #d69e2e; }
    &.type-likert   { border-left-color: #805ad5; }
    &.type-block    { border-left-color: #718096; }
  }

  .surveyItemCardHeader {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;

    .itemNum {
      font-size: 1.3rem;
      font-weight: 700;
      color: #a0aec0;
      min-width: 28px;
      flex-shrink: 0;
    }

    select {
      flex: 1;
      max-width: 300px;
      min-width: 0;
      width: auto !important;
      padding: 5px 8px !important;
      font-size: 1.3rem !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 4px !important;
      background: white;
      color: #2d3748;
    }

    .itemCardControls {
      margin-left: auto;
      display: flex;
      gap: 4px;
      align-items: center;
      flex-shrink: 0;
    }

    .itemMoveBtn {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      background: white;
      color: #718096;
      font-size: 1.4rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      transition: all 0.15s;
      &:hover {
        border-color: #007c70;
        color: #007c70;
        background: #e6f4f3;
      }
    }

    .itemDeleteBtn {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      background: white;
      color: #a0aec0;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      transition: all 0.15s;
      &:hover {
        border-color: #e53e3e;
        color: #e53e3e;
        background: #fff5f5;
      }
    }
  }

  .surveyItemCardBody {
    padding: 16px;
    display: grid;
    gap: 6px;

    textarea {
      height: 100px;
    }

    .fieldLabel {
      font-size: 1.3rem;
      color: #718096;
      font-weight: 500;
      margin-top: 6px;
      margin-bottom: 2px;
      &:first-child {
        margin-top: 0;
      }
    }

    .optionRow {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 6px;
      align-items: center;
      margin-bottom: 4px;

      button {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        border: 1px solid transparent;
        background: transparent;
        color: #a0aec0;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        transition: color 0.15s;
        &:hover {
          color: #e53e3e;
        }
      }
    }

    .addOptionLink {
      background: none;
      border: none;
      color: #007c70;
      font-size: 1.3rem;
      cursor: pointer;
      padding: 4px 0;
      font-weight: 500;
      font-family: Lato;
      text-align: left;
      &:hover {
        color: #005a52;
        text-decoration: underline;
      }
    }
  }

  /* ── Add Question Button ── */
  .addItemButton {
    width: 100%;
    margin-top: 8px;
    padding: 14px;
    border: 2px dashed #007c70;
    border-radius: 8px;
    background: white;
    color: #007c70;
    font-size: 1.5rem;
    font-weight: 500;
    font-family: Lato;
    cursor: pointer;
    text-align: center;
    transition: background 0.15s;
    &:hover {
      background: #e6f4f3;
    }
  }

  /* ── Legacy (keep for non-survey parameter types) ── */
  .pageButtons {
    display: grid;
    grid-template-columns: repeat(auto-fill, 50px);
    grid-column-gap: 10px;
    grid-row-gap: 10px;
    margin: 20px 0px 20px 0px;
    .activePageButton {
      background-color: #007c70;
      border-color: #007c70;
      color: white;
    }
    .notActivePageButton {
    }
  }

  .pageHeader {
    display: grid;
    grid-template-columns: 4fr 1fr;
  }

  .parameterBlock {
    display: grid;
    grid-gap: 0.5rem;

    margin-top: 10px;
    .help {
      font-weight: 500;
    }
    .example {
      font-weight: 500;
    }
    .value {
      font-weight: 500;
    }
    .name {
      font-size: 1.5rem;
      color: lightslategrey;
      font-weight: 900;
      justify-self: start;
      margin: 2rem 0rem 1rem 0rem;
    }
    .input {
    }
    textarea {
      height: 120px;
    }
    button {
      background: white;
      color: #aa4747;
      width: fit-content;
      border: 1px solid grey;
    }
    .iconSelector {
      display: grid;
      grid-template-columns: repeat(auto-fill, 50px);
      align-items: center;
      justify-items: center;
    }
  }

  .taskBlock {
    display: grid;
    gap: 6px;
    .help {
      font-size: 1.5rem;
      font-weight: 500;
      color: #2d3748;
    }
    .example {
      font-size: 1.3rem;
      color: #718096;
      font-style: italic;
    }
    .name {
      color: #718096;
      font-weight: 400;
      font-size: 1.3rem;
      justify-self: end;
    }
    .input {
      .name {
        color: #2d3748;
        font-style: normal;
        font-size: 1.4rem;
      }
    }
    textarea {
      height: 300px;
    }
    .addButton {
      cursor: pointer;
      width: 5.5rem;
      text-align: center;
      border-radius: 6rem;
      background-color: #007c70;
      color: white;
      font-size: 3rem;
      border: none;
      &:hover {
        background-color: #005a52;
        transform: scale(1.05);
        transition: transform 0.2s;
      }
    }
    .activePageButton {
      border-radius: 10rem;
    }
    .notActivePageButton {
      border-radius: 10rem;
      background-color: white;
      color: #007c70;
      border: 2px solid #007c70;
    }
  }

  /* Secondary action button (e.g., "Get parameters from template") */
  .secondaryActionBtn {
    height: 36px;
    padding: 0 16px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: white;
    color: #4a5568;
    font-size: 1.4rem;
    font-family: Lato;
    cursor: pointer;
    transition: all 0.15s;
    &:hover {
      border-color: #007c70;
      color: #007c70;
      background: #e6f4f3;
    }
  }
`;

export const StyledIconSpan = styled.span`
  cursor: pointer;
  padding: 10px;
  border-radius: 5px;
  align-content: center;
  justify-content: center;
  ${(props) => props.isSelected && "border: 1px solid #556AEB"};
`;

export default StyledTaskBuilder;
