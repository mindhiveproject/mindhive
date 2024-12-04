import styled from "styled-components";

export const StyledStudyCard = styled.div`
  display: grid;
  background: #ffffff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0px 2px 4px 0px #00000026;
  transition: box-shadow 300ms ease-out;
  height: 100%;
  position: relative;

  .tempOverlay {
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: 100%;
    .studyAdmin {
      display: grid;
      grid-template-columns: 1fr;
      grid-gap: 1rem;
      padding: 15px;
      border-radius: 10px;
      justify-items: center;
      font-size: 1rem;
      background: #ffffffb3;
      .message {
        text-align: center;
      }
    }
  }

  :hover {
    box-shadow: 0px 2px 24px 0px #0000001a;
    .optionsIcon {
      display: inline-block;
    }
  }

  .clickableWrapper {
    display: grid;
    cursor: pointer;
    height: 100%;
  }

  .studyImage {
    height: 166px;
    position: relative;
  }

  .optionsIcon {
    position: absolute;
    top: 10%;
    left: 82%;
    display: none;
    background: white;
    border-radius: 30px;
    padding: 10px 10px 10px 10px;
    z-index: 20;
  }

  .archiveDropdown {
    width: 270px;
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.7);
    span {
      font-size: 16px;
      font-weight: bold;
    }
    p {
      color: #666666;
      line-height: 150%;
      font-size: 16px;
    }
    .heading {
      line-height: 200%;
    }
    .red {
      color: #d53533;
    }
    z-index: 100;
  }

  .dropdownItem {
  }

  .noImage {
    background: lightgrey;
    height: 100%;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cardInfo {
    display: grid;
    align-content: space-between;
    padding: 16px;
    grid-gap: 2rem;
    height: 100%;

    .studyMain {
      display: grid;
      grid-gap: 2rem;
      min-height: 260px;
      align-content: baseline;
      .studyParticipants {
        padding: 0.5rem 1rem;
        background: #e6f2f1;
        color: #007c70;
        border-radius: 2rem;
        width: fit-content;
        font-size: 12px;
        font-weight: bold;
      }
    }

    .studyCreatedBy {
      display: grid;
      grid-gap: 1rem;
      .studyCreatedByHeader {
        display: grid;
        font-family: Lato;
        font-weight: bold;
        font-size: 10px;
        line-height: 0px;
        color: #666666;
        letter-spacing: 0.2rem;
        text-transform: uppercase;
      }
      .studyCreatedByPanel {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
        grid-gap: 1rem;
        padding: 2rem;
        background: #f7f9f8;
        border-radius: 10px;
        .studyCreatedBySection {
          display: grid;
          grid-gap: 1rem;
          justify-items: center;
          .studyCreatedByNumber {
            font-family: Lato;
            font-weight: bold;
            font-size: 14px;
            color: #000000;
          }
        }
      }
    }
  }

  a {
    letter-spacing: 0.04em;
    text-decoration-line: underline;
    color: #007c70;
  }
  h2 {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 24px;
    line-height: 30px;
    color: #1a1a1a;
  }
  p {
    font-family: Roboto;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    letter-spacing: 0em;
    text-align: left;
  }
  .studyLink {
    display: grid;
    grid-template-columns: 1fr auto;
    align-self: end;
    margin-bottom: 10px;
    align-items: end;
  }
`;

export const StyledTaskCard = styled.div`
  display: grid;
  align-items: center;
  /* grid-template-columns: 30px 4fr 1fr; */
  grid-gap: 10px;
  background: #ffffff;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.07);
  border-radius: 8px;
  margin-bottom: 10px;
  height: 100%;

  :hover {
    box-shadow: 0px 2px 24px 0px #0000001a;
  }

  border-top: 8px solid;
  border-top-color: ${(props) =>
    props.taskType === "TASK"
      ? "#64c9e2"
      : props.taskType === "SURVEY"
      ? "#28619e"
      : props.taskType === "BLOCK"
      ? "#ffc7c3"
      : "#007c70"};

  .addBlock {
    margin: 0px 10px;
  }
  .movableCard {
    display: grid;
    width: 100%;
    height: 100%;
  }
  .icons {
    display: grid;
    align-items: center;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px;
    padding: 16px;
    .icon {
      display: grid;
      align-items: center;
      justify-items: center;
      background: #f3f5f6;
      width: 42px;
      height: 42px;
      border-radius: 20px;
      cursor: pointer;
    }
  }

  .taskImage {
    img {
      width: 100%;
      height: 166px;
      object-fit: cover;
    }
  }

  .cardInfo {
    padding: 16px;
    .title {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-gap: 1rem;
      font-family: Roboto;
      font-style: normal;
      font-weight: normal;
      font-size: 24px;
      line-height: 30px;
      margin-bottom: 20px;
      .rightSide {
        display: grid;
        grid-gap: 1rem;
        grid-template-columns: auto 1fr;
        align-items: center;
        justify-items: center;
        }
      }
    .subtitle {
      font-size: 14px;
    }
  }
`;
