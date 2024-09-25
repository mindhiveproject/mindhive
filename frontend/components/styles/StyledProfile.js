import styled from "styled-components";

const StyledProfile = styled.div`
  display: grid;
  .headerProfile {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-gap: 20px;
    img {
      max-height: 200px;
    }
  }
  .pageProfile {
    display: grid;
    grid-gap: 10px;
  }
  .empty {
    display: grid;
    padding: 10px;
    grid-template-columns: 1fr;
    background: white;
    grid-gap: 1rem;
    text-align: center;
    align-content: center;
    height: 100%;
  }
  .headerParticipatedStudies {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: 50px 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    padding: 10px;
    font-weight: bold;
    grid-gap: 1rem;
  }
  .rowParticipatedStudies {
    display: grid;
    padding: 10px;
    grid-template-columns: 50px 1fr;
    background: white;
    grid-gap: 1rem;
    border-bottom: 1px solid lightGrey;
    .title {
      display: grid;
      grid-template-columns: 1fr;
      align-content: center;
      grid-gap: 1rem;
      align-content: baseline;
    }
    .conditionName {
      display: grid;
      align-content: baseline;
    }
    li {
      font-size: 1.3rem;
    }
  }
  .rowTasks {
    display: grid;
    padding: 0rem 1rem;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    grid-gap: 5px;
    align-items: center;
    background: ${(props) => (props.odd ? "#f0f0f0" : "white")};
    border-radius: 5px;
    align-content: baseline;
  }
  .headerCreatedStudies {
    display: grid;
    grid-template-columns: 3fr 1fr 250px 250px;
    padding: 10px;
    font-weight: bold;
    grid-gap: 1rem;
  }
  .rowCreatedStudies {
    display: grid;
    padding: 10px;
    grid-template-columns: 3fr 1fr 250px 250px;
    background: white;
    grid-gap: 1rem;
    .title {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-gap: 1rem;
      align-items: center;
    }
  }

  .headerReviewedStudies {
    display: grid;
    grid-gap: 1rem;
    grid-template-columns: 300px 70px 70px 100px 200px auto;
    padding: 10px;
    font-weight: bold;
  }
  .rowReviewedStudies {
    display: grid;
    padding: 10px;
    grid-template-columns: 300px 70px 70px 100px 200px auto;
    background: white;
    grid-gap: 1rem;
    .title {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-gap: 1rem;
      align-items: center;
    }
    margin: 1rem 0rem;
  }
  .reviewOverview {
    display: grid;
    grid-gap: 1rem;
    font-family: Lato;
    font-size: 1.4rem;
    font-style: normal;
    font-weight: 400;
    line-height: 21px;
    letter-spacing: 0em;
    .section {
      display: grid;
      grid-gap: 1rem;
      min-width: 300px;
      background: white;
      padding: 20px;
      text-align: left;
      align-content: baseline;
      .title {
        font-weight: bold;
        font-size: 1.3rem;
      }
      .answer {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-gap: 1rem;
        background-color: #f6f9f8;
        padding: 1rem;
        border-radius: 5px;
      }
      .averageRating {
        display: grid;
        grid-template-columns: 1fr;
        align-items: start;
        justify-self: start;
      }
    }
  }

  .journalWrapperLine {
    display: grid;
    grid-template-columns: 1fr 50px;
    align-items: center;
  }
  .journalListHeader {
    display: grid;
    margin: 5px;
    padding: 10px;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    cursor: pointer;
    font-weight: bold;
  }
  .journalRow {
    display: grid;
    margin: 5px;
    padding: 10px;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    background: white;
    cursor: pointer;
  }
`;

export const StyledCreateProfileFlow = styled.div`
  display: grid;
  background: var(--neutral_white5, #f7f9f8);
  .progressBar {
    .ui.progress {
      background: var(--neutral_white, #fff);
      border-radius: 10px;
    }
    .bar {
      background: var(--SECONDARY_BLUE2, #5381b1) !important;
      border-radius: 10px;
    }
    .ui.progress > .label {
      font-size: 16px;
    }
    .progressLabels {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      justify-items: center;
      margin-top: 16px;
      font-family: Lato;
      font-size: 13px;
      font-weight: 500;
      line-height: 18px;
      text-align: left;
      color: var(--neutral_grey2, #3b3b3b);
    }
  }
  .chooseProfileType {
    display: grid;
    height: 70vh;
    align-content: center;
    justify-items: center;
    justify-self: center;
    max-width: 800px;
    .profileChoicesArea {
      display: grid;
      margin: 2rem 1rem;
      padding: 10px;
      grid-template-columns: 1fr 1fr;
      grid-gap: 4rem;
      .profileChoiceButton {
        display: grid;
        grid-template-columns: auto auto;
        grid-gap: 1.6rem;
        justify-content: center;
        align-items: center;
        margin: 0rem 0rem 2.4rem 0rem;
        padding: 3rem 2rem;
        border-radius: 10px;
        border: 2px solid var(--sds-color-border-default-default);
        background: var(--neutral_white, #fff);
        color: var(--neutral_black1, #171717);
        font-family: Lato;
        font-size: 17px;
        font-style: normal;
        font-weight: 600;
        line-height: 22px; /* 129.412% */
        max-width: 377px;
      }
      p {
        color: var(--neutral_black1, #171717);
        text-align: center;
        font-family: Lato;
        font-size: 15px;
        font-style: normal;
        font-weight: 400;
        line-height: 20px; /* 133.333% */
      }
    }
    h2 {
      color: var(--neutral_black1, #171717);
      /* H2 */
      font-family: Lato;
      font-size: 40px;
      font-style: normal;
      font-weight: 600;
      line-height: 125%; /* 50px */
    }
  }

  .aboutMe {
    .profileBlock {
      display: grid;
      grid-gap: 2rem;
      margin-top: 7.3rem;
      padding: 4rem 4.8rem;
      border-radius: 8px;
      background: #fdfdfd;
      box-shadow: 0px 7px 64px 0px rgba(0, 0, 0, 0.07);
      width: 100%;
      .twoColumnsInput {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 2.4rem;
      }
      .oneColumnInputWithIcon {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-gap: 2.4rem;
        align-items: center;
        margin: 1rem 0rem;
      }
      .twoColumnsInputWithIcon {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        grid-gap: 2.4rem;
        align-items: center;
        margin: 1rem 0rem;
      }
      .title {
        color: var(--neutral_black1, #171717);
        font-family: Lato;
        font-size: 24px;
        font-style: normal;
        font-weight: 600;
        line-height: 32px; /* 133.333% */
        margin-bottom: 12px;
      }
      .subtitle {
        color: var(--neutral_black1, #171717);
        font-family: Lato;
        font-size: 15px;
        font-style: normal;
        font-weight: 400;
        line-height: 20px; /* 133.333% */
      }
      .inputLineBlock {
        margin: 1rem 0rem;
      }

      .addLink {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 0.8rem;
        cursor: pointer;
        p {
          color: var(--SECONDARY_BLUE1, #28619e);
          /* BUTTON_1 */
          font-family: Lato;
          font-size: 17px;
          font-style: normal;
          font-weight: 600;
          line-height: 22px; /* 129.412% */
        }
      }
      p {
        color: var(--neutral_black1, #171717);
        /* BODY_1 */
        font-family: Lato;
        font-size: 15px;
        font-style: normal;
        font-weight: 400;
        line-height: 20px; /* 133.333% */
      }
      h3 {
        color: var(--neutral_black1, #171717);
        /* H3 */
        font-family: Lato;
        font-size: 24px;
        font-style: normal;
        font-weight: 400;
        line-height: 32px; /* 133.333% */
      }
      .ui.fluid.dropdown {
        font-family: Lato;
        border: 1px solid #cccccc;
        border-radius: 4px;
        width: 100%;
        font-size: 16px;
        line-height: 24px;
        padding: 12px;
        height: 50px;
      }
      .ui.checkbox input.hidden + label {
        color: var(--neutral_black1, #171717);
        font-family: Lato;
        font-size: 15px;
        font-style: normal;
        font-weight: 500;
        line-height: 20px; /* 133.333% */
      }
    }
  }
  .interests {
    display: grid;
    grid-gap: 3rem;
    margin: 12rem 9rem;
    .interestsHeader {
      display: grid;
      grid-gap: 15px;
      margin: 1rem 17.7rem;
      justify-items: center;
      .h40 {
        //styleName: H2;
        font-family: Lato;
        font-size: 40px;
        font-weight: 600;
        line-height: 50px;
        text-align: left;
        color: var(--neutral_black1, #171717);
      }
      .p15 {
        //styleName: BODY_1;
        font-family: Lato;
        font-size: 15px;
        font-weight: 400;
        line-height: 20px;
        text-align: center;
        color: var(--neutral_grey2, #3b3b3b);
      }
    }
    .interestsSelector {
      display: grid;
      grid-gap: 3rem;
      .suggestedInterests {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, auto));
        grid-gap: 16px;
        .interest {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-gap: 2rem;
          align-items: center;
          background: #ffffff;
          border: 1.5px solid #dfdfdf;
          padding: 8px 16px;
          width: auto;
          border-radius: 20px;
          img {
            cursor: pointer;
          }
        }
      }
    }
  }
  .navButtons {
    display: grid;
    grid-template-columns: 186px 186px;
    grid-gap: 1.6rem;
    justify-content: end;
    margin: 4rem 0rem;
    button {
      width: 186px;
    }
    .primary {
      text-align: center;
      font-family: Lato;
      font-size: 18px;
      font-style: normal;
      font-weight: 500;
      line-height: 125%; /* 22.5px */
    }
    .secondary {
      background: var(--neutral_white5, #f7f9f8);
      color: var(--Button-Green, #347a70);
      text-align: center;
      font-family: Lato;
      font-size: 18px;
      font-style: normal;
      font-weight: 500;
      line-height: 125%; /* 22.5px */
    }
  }
`;

export const StyledSaveButton = styled.div`
  margin-top: 7rem;
  button {
    background: ${(props) => (props.changed ? "#28619E" : "#9a9a9a")};
    border-color: ${(props) => (props.changed ? "#28619E" : "#9a9a9a")};
  }
`;

export const StyledSimpleSaveButton = styled.div`
  button {
    background: ${(props) => (props.changed ? "#347A70" : "#9a9a9a")};
    border-color: ${(props) => (props.changed ? "#347A70" : "#9a9a9a")};
  }
`;

export default StyledProfile;
