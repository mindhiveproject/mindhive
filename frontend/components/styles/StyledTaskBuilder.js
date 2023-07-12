import styled from "styled-components";

const StyledTaskBuilder = styled.div`
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

  .surveyBuilderItemLine {
    border-bottom: 3px #e7d6d6 solid;
    padding-bottom: 30px;
    margin-bottom: 30px;
    display: grid;
    grid-template-columns: 9fr 1fr;
    grid-column-gap: 10px;
    .controlButtons {
      display: grid;
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
      border-radius: 2.25rem;
      background-color: #ff2d2d;
      color: white;
      font-size: 2rem;
      :hover {
        background-color: #ea0707;
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

  .surveyBuilderItemLine {
    border-bottom: 3px #e7d6d6 solid;
    padding-bottom: 30px;
    margin-bottom: 30px;
    display: grid;
    grid-template-columns: 9fr 1fr;
    grid-column-gap: 10px;
    .controlButtons {
      display: grid;
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
      border-radius: 2.25rem;
      background-color: #ff2d2d;
      color: white;
      font-size: 2rem;
      :hover {
        background-color: #ea0707;
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
    grid-template-columns: 1fr;
    grid-column-gap: 20px;
    margin-bottom: 15px;
    border-radius: 5px;
    .help {
      font-size: 2rem;
      font-weight: 500;
    }
    .example {
    }
    .name {
      color: lightslategrey;
      font-weight: 400;
      justify-self: end;
    }
    .input {
    }
    textarea {
      height: 300px;
    }
    .addButton {
      cursor: pointer;
      width: 5.5rem;
      text-align: center;
      border-radius: 6rem;
      background-color: #4fbf1f;
      color: white;
      font-size: 3rem;
      :hover {
        background-color: #3cb906;
        transform: scale(1.1);
        transition: transform 0.5s;
      }
    }
    .activePageButton {
      border-radius: 10rem;
    }
    .notActivePageButton {
      border-radius: 10rem;
      background-color: white;
      color: darkgreen;
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
