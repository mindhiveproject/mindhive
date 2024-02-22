import styled from "styled-components";

export const StyledReviewPage = styled.div`
  display: grid;
  width: 100%;
  overflow-y: scroll;

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
      font-family: Lato;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 0em;
      text-align: left;
      color: #007c70;
      font-size: 18px;
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
      overflow-y: scroll;
    }
  }
  .reviewBoard {
    display: grid;
    grid-gap: 30px;
    font-family: Lato;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 21px;
    letter-spacing: 0em;

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
  }
  .reviews {
    grid-area: reviews;
    .reviewsCards {
      display: grid;
      grid-gap: 10px;
      .allReviewsToggle {
        cursor: pointer;
        color: #007c70;
        font-family: Lato;
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: 24px;
        letter-spacing: 0em;
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
  }
  .row {
    display: grid;
    padding: 20px 28px;
    background: #ffffff;
    border: 1px solid #e6e6e6;
    box-sizing: border-box;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    font-family: Lato;
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
    line-height: 24px;
    letter-spacing: 0em;
    text-align: left;
    cursor: pointer;
  }
`;

export const StyledReviewCard = styled.div`
  background: white;
  border-radius: 4px;
  padding: 41px 50px 21px 50px;
  h2 {
    font-family: Lato;
    font-size: 24px;
    font-style: normal;
    font-weight: 400;
    line-height: 36px;
    letter-spacing: 0em;
    text-align: left;
    color: #1a1a1a;
  }
  p {
    font-family: Lato;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0em;
    text-align: left;
  }
  .dropdown {
    background: #fff9e6;
    padding: 0.5rem 0.5rem 0.5rem 1rem;
    border-radius: 1rem;
  }
`;

export const StyledDasboardReview = styled.div`
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
      p {
        font-family: Lato;
        font-size: 18px;
        font-style: normal;
        font-weight: 400;
        line-height: 23px;
        letter-spacing: 0em;
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
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 71px 1fr;
    grid-template-areas:
      "header header"
      "content review";
    height: 100vh;

    .header {
      grid-area: header;
      padding: 2rem 2rem;
      display: grid;
      grid-template-columns: 1fr auto;
      grid-gap: 3rem;
      justify-content: flex-start;
      /* align-items: baseline; */
      font-family: Lato;
      font-style: normal;
      font-weight: 400;
      letter-spacing: 0em;
      text-align: left;
      color: #007c70;
      font-size: 18px;
      .backBtn {
        cursor: pointer;
      }

      .headerMenu {
        font-size: 18px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        cursor: pointer;
        .headerMenuTitle {
          width: 150px;
          display: grid;
          justify-content: center;
          padding-bottom: 20px !important;
        }
        .selectedMenuTitle {
          border-bottom: 4px solid #ffc107 !important;
          p {
            color: #1a1a1a;
          }
        }
      }

      .headerLeft {
        display: grid;
        grid-template-columns: auto auto auto;
        justify-content: flex-start;
        align-items: baseline;
        grid-gap: 3rem;
      }
      .headerRight {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 9px;
        background: #ffffff;
        box-sizing: border-box;
        border-radius: 4px;
        align-items: center;
      }
    }
    .content {
      grid-area: content;
      background: #f7f9f8;
      padding: 1rem 2rem;
      overflow-y: scroll;
      overflow-x: scroll;
    }
    .questions {
      grid-area: review;
      padding: 37px 44px 37px 50px;
      height: 90%;
      overflow-y: scroll;
    }
  }

  .reviewQuestions {
    display: grid;
    .reviewItems {
      display: grid;
      grid-gap: 20px;
      margin-bottom: 40px;
    }
    h1 {
      font-family: Lato;
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      line-height: 36px;
      letter-spacing: 0em;
      text-align: left;
    }
    h2 {
      font-family: Lato;
      font-size: 16px;
      font-style: normal;
      font-weight: 700, Bold;
      line-height: 24px;
      margin-bottom: 0;
    }
    p {
      font-family: Lato;
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px;
      letter-spacing: 0em;
      text-align: left;
    }
    button {
      background: #007c70;
      border: 2px solid #007c70;
      box-sizing: border-box;
      border-radius: 4px;
      width: 140px;
      padding: 14px 24px;
      color: #ffffff;
      font-family: Lato;
      font-size: 18px;
      font-style: normal;
      font-weight: 400;
      line-height: 18px;
      letter-spacing: 0.05em;
      text-align: center;
      cursor: pointer;
    }
    textarea {
      padding: 0.5rem;
      width: 100%;
      height: 150px;
      background: #ffffff;
      border: 1px solid #cccccc;
      box-sizing: border-box;
      border-radius: 4px;
      font-family: Lato;
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: 24px;
      letter-spacing: 0em;
      text-align: left;
    }
    .updateMessage {
      padding: 20px 0px;
    }
    .reviewItem {
      display: grid;
      grid-gap: 5px;
    }
  }
`;
