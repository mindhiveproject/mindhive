import styled from "styled-components";

export const StyledActionPage = styled.div`
  display: grid;

  .board {
    display: grid;
    grid-gap: 20px;
    grid-template-columns: 1fr 1fr;
    padding: 0px 36px;
  }

  .proposal {
    display: grid;
    grid-gap: 10px;
    padding: 20px 0px;
    align-content: baseline;
  }
  .instructions {
    display: grid;
    grid-gap: 20px;
    background: #f7f9f8;
    padding: 20px 36px;
    align-content: baseline;
  }
  .iconTitle {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: auto 1fr;
  }
  .title {
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    color: #3b3b3b;
  }
  .subtitle {
    font: var(--MH-Type-Body-Large);
    letter-spacing: 0;
    color: #626269;
  }
  .warning {
    color: #b9261a;
  }
  .cards {
    display: grid;
    grid-gap: 10px;
  }
  .card {
    display: grid;
    grid-gap: 10px;
    padding-top: 24px;
    // border: 1px solid #deddd9;
    border-radius: 10px;
  }
  .cardTitleIcon {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: 1fr auto;
  }
  .cardTitle {
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
    color: #171717;
  }
  .lists {
    display: grid;
  }
  .list {
    display: grid;
    grid-gap: 10px;
    padding: 12px;
  }
  .listIconTitle {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: auto 1fr;
    align-items: center;
  }
  .listTitle {
    font: var(--MH-Type-Label-Large);
    letter-spacing: 0;
    color: #626269;
  }
  .listSubtitle {
    font: var(--MH-Type-Label-Large);
    font-style: italic;
    letter-spacing: 0;
    color: #969696;
  }

  .reviews {
    display: grid;
    .reviewsCards {
      display: grid;
      grid-gap: 27px;
    }
    .reviewerSection {
      display: grid;
      grid-gap: 10px;
      background: white;
      padding: 16px 23px;
    }
    .reviewerTitle {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 40px 1fr auto;
      align-items: center;
    }
    .reviewerComments {
      display: grid;
      grid-gap: 15px;
    }
    .reviewerComment {
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
      color: #3b3b3b;
    }
    .questionTitle {
      font: var(--MH-Type-Title-Base);
      letter-spacing: 0;
      margin-bottom: 5px;
    }
    .questionAnswer {
      font-weight: 700;
      font-style: normal;
    }
  }
`;

export const StyledReviewPage = styled.div`
  display: grid;
  width: 100%;

  .review {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 60px 1fr;
    grid-template-areas:
      "header"
      "content";
    height: 85vh;

    .header {
      grid-area: header;
      padding: 0rem 2rem;
      display: grid;
      grid-template-columns: 1fr auto;
      grid-gap: 3rem;
      justify-content: flex-start;
      align-items: center;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
      text-align: left;
      color: #007c70;
      .backBtn {
        cursor: pointer;
      }
      .headerLeft {
      }
    }
    .content {
      grid-area: content;
      background: #f7f9f8;
      padding: 1rem 2rem;
    }
  }
  .reviewBoard {
    display: grid;
    grid-gap: 30px;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;

    .block {
      display: grid;
      grid-gap: 1rem;
      min-width: 300px;
      background: white;
      padding: 20px;
      text-align: center;
      align-content: baseline;
      .rating {
        display: grid;
        align-items: center;
        justify-self: center;
      }
    }
  }
  .descriptionMenu {
    .item {
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
      color: #1a1a1a;
    }
  }
`;

export const StyledReviewSection = styled.div`
  background: #e5e5e5;
  display: grid;
  justify-content: stretch;
`;

export const StyledReviewBoard = styled.div`
  display: grid;
  max-width: 1100px;
  margin: 45px 0px 45px 0px;
  width: 100%;
  justify-self: center;
  align-content: baseline;

  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    "submit submit"
    "checklist reviews";
  grid-gap: 20px;

  .submit {
    grid-area: submit;
    .submitPanel {
      display: grid;
      grid-template-columns: 4fr 3fr;
    }
    .submitBtnContainer {
      display: grid;
      justify-content: end;
      align-content: baseline;
      button {
        border: 2px solid #b3b3b3;
        color: grey;
      }
    }
  }
  .checklist {
    grid-area: checklist;
    .checklistItems {
      display: grid;
      grid-gap: 10px;
      margin-top: 18px;
    }
    a {
      text-decoration: underline !important;
    }
  }
  .reviews {
    grid-area: reviews;
    .reviewsCards {
      display: grid;
      grid-gap: 10px;
      .allReviewsToggle {
        cursor: pointer;
        color: #007c70;
        font: var(--MH-Type-Body-Base);
        letter-spacing: 0;
        text-align: left;
        text-decoration-line: underline;
      }
    }
    .reviewsPlaceholder {
      border: 1px solid #e6e6e6;
      box-sizing: border-box;
      border-radius: 4px;
      padding: 40px;
      p {
        text-align: center;
      }
    }
    .reviewerSection {
      display: grid;
      border: 1.5px solid #dadfe2;
      padding: 16px 23px;
      border-radius: 8px;
    }
    .reviewerTitle {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      font: var(--MH-Type-Label-Base);
      letter-spacing: 0;
      text-align: left;
    }
    .reviewerComments {
      display: grid;
      grid-gap: 20px;
      .reviewerComment {
        display: grid;
        .question {
          font: var(--MH-Type-Title-Base);
          letter-spacing: 0;
          text-align: left;
        }
        .answer {
          font: var(--MH-Type-Body-Base);
          letter-spacing: 0;
          text-align: left;
        }
      }
    }
  }
  .row {
    display: grid;
    padding: 20px 28px;
    background: #ffffff;
    border: 1px solid #e6e6e6;
    box-sizing: border-box;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
    text-align: left;
    cursor: pointer;
  }
`;

export const StyledReviewCard = styled.div`
  background: white;
  border-radius: 4px;
  padding: 30px 24px;
  height: 80vh;
  overflow: auto;
  h2 {
    font: var(--MH-Type-Heading-Small);
    letter-spacing: 0;
    text-align: left;
    color: #1a1a1a;
  }
  p {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    text-align: left;
  }

  .dropdown {
    background: #fff9e6;
    padding: 0.5rem 0.5rem 0.5rem 1rem;
    border-radius: 1rem;
  }
  .buttons {
    display: grid;
    grid-row-gap: 16px;
    grid-column-gap: 24px;
    grid-template-columns: auto 1fr;
    .step {
      font: var(--MH-Type-Title-Base);
      letter-spacing: 0;
      text-align: left;
      color: var(--neutral_grey2, #3b3b3b);
    }
  }
`;

export const StyledDasboardReview = styled.div`
  .overview {
    display: grid;
    grid-gap: 16px;
    .overviewHeader {
      display: grid;
      gap: 4px;
      margin-bottom: 8px;
      h1 {
        margin: 0;
        color: var(--MH-Theme-Neutrals-Black, #171717);
      }
      p {
        margin: 0;
        max-width: 640px;
        color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
        font: var(--MH-Type-Body-Base);
        letter-spacing: 0;
      }
    }
    .board {
      display: grid;
      grid-gap: 24px;
      .searchTopArea {
        display: grid;
        margin: 16px 0px;
        grid-gap: 16px;
        grid-template-columns: 3fr 1fr 1fr 1fr;
      }
      .checkboxArea {
        display: grid;
        align-items: center;
      }
      input,
      textarea,
      select {
        font: var(--MH-Type-Body-Base);
        letter-spacing: 0;
        border: 1px solid #cccccc;
        border-radius: 4px;
        width: 100%;
        padding: 12px;
      }
      .dropdown {
        display: grid;
        align-items: center;
        justify-content: start;
        border-radius: 4px;
        width: 100%;
        font: var(--MH-Type-Body-Base);
        letter-spacing: 0;
        .default.text {
          color: #979797;
        }
      }
      .checkbox {
        label {
          font: var(--MH-Type-Label-Large);
          letter-spacing: 0;
          text-align: left;
          color: #666666;
        }
      }
    }
    .cardsArea {
      display: grid;
      grid-gap: 16px;
      grid-template-columns: auto auto 1fr;
    }

    .customlink: hover {
      opacity: 1;
      .card {
        box-shadow: 0px 4px 4px 0px #97979d40;
        .imageContainer {
          img {
            opacity: 0.7;
          }
        }
        .options {
          color: var(--SECONDARY_BLUE1, #28619e);
          img {
            filter: sepia(100%) hue-rotate(190deg) saturate(500%);
          }
        }
      }
    }

    .card {
      display: grid;
      grid-gap: 8px;
      align-content: baseline;
      width: 340px;
      background: white;
      padding: 12px 16px;
      border-radius: 8px;
      transition: box-shadow 0.2s ease, transform 0.2s ease;

      &.isClickable {
        cursor: pointer;

        &:hover {
          box-shadow: 0px 6px 16px rgba(15, 56, 75, 0.12);
          transform: translateY(-2px);
        }

        &:focus-visible {
          outline: 2px solid #28619e;
          outline-offset: 3px;
        }
      }

      .headline {
        display: grid;
        grid-gap: 10px;
        grid-template-columns: auto 1fr;
      }

      .lowPanel {
        display: grid;
        grid-template-columns: 2fr 1fr;
      }

      .imageContainer {
        height: 125px;
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
        }
        .noImage {
          display: grid;
          margin-left: 30px;
          justify-content: center;
          align-content: center;
          height: 100%;
          img {
            border-radius: 0px;
            width: 80%;
            object-fit: contain;
          }
        }
      }
      .tag {
        padding: 1px 6px;
        width: fit-content;
        border-radius: 4px;
        font: var(--MH-Type-Label-Small);
        letter-spacing: 0;
        text-align: left;
      }
      .proposal {
        background: var(--SECONDARY_BLUE3, #d8f1f8);
        border: 1px solid var(--SECONDARY_BLUE1, #28619e);
        color: var(--SECONDARY_BLUE1, #28619e);
      }
      .peerreview {
        background: #e4efee;
        border: 1px solid var(--PRIMARY_GREEN3, #007c70);
        color: var(--PRIMARY_GREEN3, #007c70);
      }
      .closed {
        background: #ffe6e6;
        border: 1px solid #cc0000;
        color: #cc0000;
        font-weight: bold;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .options {
        display: grid;
        grid-gap: 10px;
        grid-template-columns: 1fr auto;
        align-content: center;
        justify-items: end;
        font: var(--MH-Type-Label-Small);
        letter-spacing: 0;
        text-align: left;
        .option {
          display: grid;
          grid-gap: 6px;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          justify-items: end;
        }
      }
    }
  }
  .view {
    display: grid;
    grid-gap: 16px;
    .studyArea {
      display: grid;
      margin: 24px 0px;
      position: relative;
      .closeBtn {
        position: absolute;
        top: -4%;
        left: -3%;
        cursor: pointer;
        :hover {
          transform: scale(1.1);
          transition: transform 0.5s;
        }
      }
      .studyImage {
        height: 340px;
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
        }
      }
      .studyInfo {
        display: grid;
        grid-gap: 16px;
        background: #ffffff;
        padding: 24px 48px;

        font: var(--MH-Type-Body-Large);
        letter-spacing: 0;
        text-align: left;

        .topLine {
          display: grid;
          grid-gap: 10px;
          grid-template-columns: auto 1fr;
        }
        .title {
          color: #171717;
          font: var(--MH-Type-Heading-Base);
          letter-spacing: 0;
          text-align: left;
        }
        .studyWhatWhoHow {
          display: grid;
          grid-gap: 32px;
          margin-top: 32px;
          .navTopLine {
            display: grid;
            grid-template-columns: 1fr auto;
          }
          .content {
            min-height: 200px;
          }
        }
        .options {
          display: grid;
          grid-template-columns: 1fr auto;
          align-content: center;
          justify-items: end;
          border-bottom: 1px solid #d4d4d5;
          .option {
            height: 50px;
            display: grid;
            border: 2px solid #347a70;
            border-radius: 5px;
            padding: 10px 16px;
            grid-gap: 10px;
            grid-template-columns: auto 1fr;
            align-items: center;
            justify-items: end;
            margin-left: 10px;
          }
        }
      }
    }
  }
  .navigationMenu {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    margin-bottom: 24px !important;
    background: #f6f9f8;
    border-radius: 7px;

    .navigationTitle {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
      width: auto;
      display: grid;
      justify-content: center;
      border: 1px solid #e6e6e6;
      text-align: center;
      padding: 20px;
      background: rgb(255, 255, 255);
      box-shadow: rgba(0, 0, 0, 0.07) 0px 2px 10px;
      border-radius: 8px;

      p {
        font: var(--MH-Type-Body-Base);
        letter-spacing: 0;
        color: #666666;
      }
    }
    .selectedMenuTitle {
      background: #007c70 !important;
      p {
        color: white;
      }
    }
  }

  .reviewHeader {
    display: grid;
    margin: 5px;
    padding: 10px;
    grid-template-columns: 150px 150px 150px 120px 120px 200px;
    grid-gap: 5px;
    font-weight: bold;
    .centered {
      text-align: center;
    }
  }

  .row {
    display: grid;
    margin: 5px;
    padding: 10px;
    grid-template-columns: 150px 150px 150px 120px 120px 300px;
    grid-gap: 5px;
    background: white;
    .buttons {
      display: grid;
      grid-gap: 1rem;
      grid-template-columns: 1fr 1fr 1fr;
      cursor: pointer;
      a {
        font-size: 1.5rem;
      }
    }
    .centered {
      text-align: center;
    }
  }

  .reviewContainer {
    display: grid;
    height: 100vh;
    align-content: baseline;

    .double {
      display: grid;
      grid-gap: 8px;
      grid-template-columns: 1fr 1fr;
    }

    .single {
      display: grid;
      grid-template-columns: 1fr;
      .studyPage {
        max-width: 1090px;
        margin: 0 auto;
      }
    }

    .header {
      padding: 1rem 2rem;
      display: grid;
      grid-template-columns: 250px 1fr 1fr auto auto;
      grid-gap: 2rem;
      align-items: center;
      justify-items: baseline;

      .backBtn {
        display: grid;
        grid-gap: 4px;
        grid-template-columns: auto 1fr;
        align-items: center;
        cursor: pointer;
        .text {
          font: var(--MH-Type-Title-Small);
          letter-spacing: 0;
          text-align: left;
          color: var(--neutral_grey2, #3b3b3b);
        }
      }
      .title {
        display: grid;
        justify-content: center;
        font: var(--MH-Type-Label-Base);
        letter-spacing: 0;
        text-align: center;
        color: var(--neutral_grey2, #3b3b3b);
      }

      .saveBtn {
        display: grid;
        justify-content: end;
        display: grid;
      }
    }

    .panelLeft {
      background: #f7f9f8;
      padding: 2.4rem 3.2rem;
      height: 90vh;
      overflow-y: scroll;
      overflow-x: auto;

      .headerMenu {
        font: var(--MH-Type-Label-Large);
        letter-spacing: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, 150px);
        cursor: pointer;
        border-bottom: 1px solid #4c4d54;

        .headerMenuTitle {
          width: 150px;
          display: grid;
          justify-content: center;
          padding: 10px;
        }
        .selectedMenuTitle {
          border-top: 1px solid #4c4d54;
          border-right: 1px solid #4c4d54;
          border-left: 1px solid #4c4d54;
          p {
            color: #1a1a1a;
          }
        }
      }

      .studyPage {
        display: grid;
        .imageContainer {
          margin-top: 24px;
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
          }
        }
        .studyInformation {
          display: grid;
          grid-gap: 8px;
        }
        .studyDescription {
          margin: 8px 0px;
        }
        .ui.accordion:not(.styled) .accordion .title ~ .content:not(.ui),
        .ui.accordion:not(.styled) .title ~ .content:not(.ui) {
          overflow: hidden;
          font: var(--MH-Type-Body-Base);
          letter-spacing: 0;
          text-align: left;
          color: #626269;
          border-bottom: 1px solid var(--neutral_grey2, #3b3b3b);
          border-left: 1px solid var(--neutral_grey2, #3b3b3b);
          border-right: 1px solid var(--neutral_grey2, #3b3b3b);
          padding: 24px 16px;
        }
        .ui.accordion .title:not(.ui) {
          font: var(--MH-Type-Title-Large);
          letter-spacing: 0;
          text-align: left;
          padding: 24px 16px;
          margin-top: 24px;
        }
        .ui.accordion .title:not(.ui) {
          border-top: 1px solid var(--neutral_grey2, #3b3b3b);
          border-bottom: 1px solid var(--neutral_grey2, #3b3b3b);
          border-left: 1px solid var(--neutral_grey2, #3b3b3b);
          border-right: 1px solid var(--neutral_grey2, #3b3b3b);
        }
      }
      .studyDetails {
        display: grid;
        margin: 40px 0px;
        .participateLinkWrapper {
          display: grid;
          justify-self: end;
        }
        .participateLink {
          display: grid;
          grid-gap: 10px;
          grid-template-columns: 1fr auto;
          font: var(--MH-Type-Title-Small);
          letter-spacing: 0;
          text-align: left;
          color: var(--SECONDARY_BLUE1, #28619e);
        }

        h1 {
          font: var(--MH-Type-Heading-Small);
          letter-spacing: 0;
          text-align: left;
          color: #171717;
        }
      }
    }
    .panelRight {
      height: 90vh;
      overflow-y: scroll;
    }
  }

  .reviewQuestions {
    display: grid;
    padding: 27px 44px 37px 50px;

    .subtitle {
      font: var(--MH-Type-Body-Large);
      font-style: italic;
      letter-spacing: 0;
    }

    .reviewItems {
      display: grid;
      grid-gap: 30px;
      margin-top: 40px;
      margin-bottom: 40px;
    }
    h1 {
      font: var(--MH-Type-Heading-Small);
      letter-spacing: 0;
      text-align: left;
    }
    h2 {
      font: var(--MH-Type-Title-Base);
      letter-spacing: 0;
      margin-bottom: 0;
    }
    p {
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
      text-align: left;
    }

    textarea {
      padding: 0.5rem;
      width: 100%;
      height: 150px;
      background: #ffffff;
      border: 1px solid #cccccc;
      box-sizing: border-box;
      border-radius: 4px;
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
      text-align: left;
    }
    .updateMessage {
      padding: 20px 0px;
    }
    .reviewItem {
      display: grid;
      grid-gap: 5px;
      .question {
        font: var(--MH-Type-Label-Large);
        letter-spacing: 0;
        color: #171717;
      }
      .subtitle {
        font: var(--MH-Type-Body-Base);
        font-style: italic;
        letter-spacing: 0;
        color: #6c6c6c;
      }
      .dropdownOption {
        display: grid;
        grid-gap: 20px;
        grid-template-columns: auto 1fr;
        align-items: center;
        padding: 5px;
        .title {
          font: var(--MH-Type-Title-Base);
          display: flex;
          align-items: center;
          letter-spacing: 0;
          color: #171717;
          margin-bottom: 2px;
        }
        .subtitle {
          font: var(--MH-Type-Body-Base);
          letter-spacing: 0;
          color: #626269;
        }
      }
      .dropdownSelectedOption {
        display: grid;
        grid-gap: 20px;
        grid-template-columns: auto 1fr;
        align-items: center;
        .title {
          font: var(--MH-Type-Title-Base);
          display: flex;
          align-items: center;
          letter-spacing: 0;
          color: #171717;
        }
      }
      .custom-dropdown .menu {
        max-height: none !important;
        overflow-y: visible !important;
        position: absolute !important;
        top: 100% !important;
      }
      .dropdownSelectedTask {
        .ui.label {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-gap: 30px;
          align-items: center;
          background: #fdf2d0 !important;
          border: 1px solid #cccccc !important;
          border-radius: 20px !important;
          padding: 10px 20px !important;
          width: fit-content !important;
          .title {
            font: var(--MH-Type-Body-Base);
            letter-spacing: 0;
            display: flex;
            color: #5d5763;
          }
        }
      }
    }
  }

  .p12 {
    font: var(--MH-Type-Label-Small);
    letter-spacing: 0;
    text-align: left;
    color: #6e6a6a;
  }
  .p12_400 {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    text-align: left;
    color: #666666;
  }
  .p13 {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    text-align: left;
    color: #47484d;
  }
  .p14 {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    text-align: left;
    color: var(--neutral_grey2, #3b3b3b);
  }
  .p16 {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    text-align: center;
    color: #6e6d71;
  }
  .p16_500 {
    font: var(--MH-Type-Label-Large);
    letter-spacing: 0;
    text-align: left;
    color: #666666;
  }
  .p16_600 {
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
    text-align: left;
    color: var(--neutral_black1, #171717);
  }
  .p17 {
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
    text-align: left;
  }
  .p18 {
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    color: var(--neutral_black1, #171717);
  }
  .p22 {
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    text-align: left;
    color: #007c70;
  }
  .h24 {
    //styleName: H3;
    font: var(--MH-Type-Heading-Small);
    letter-spacing: 0;
    text-align: left;
    color: #666666;
  }
  .h28 {
    font: var(--MH-Type-Heading-Small);
    letter-spacing: 0;
    text-align: left;
    color: #171717;
  }
  .h40 {
    //styleName: H2;
    font: var(--MH-Type-Heading-Base);
    letter-spacing: 0;
    text-align: left;
    color: var(--neutral_black1, #171717);
  }
  .noStudyDetailsContainer  {
    display: grid;
    grid-gap: 8px;
    border: 1px solid #dadfe2;
    margin: 80px 65px;
    padding: 40px 47px;
    text-align: center;
  }
  .descriptionMenu {
    .item {
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
      color: #1a1a1a;
    }
  }
`;
