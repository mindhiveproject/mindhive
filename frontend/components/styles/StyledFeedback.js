import styled from "styled-components";

const StyledFeedback = styled.div`
  display: grid;
  margin: 40px 0px;
  grid-gap: 30px;
  font-family: Lato;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 21px;
  letter-spacing: 0em;

  .section {
    display: grid;
    grid-gap: 1rem;
    min-width: 300px;
    padding: 16px 23px;

    align-content: baseline;
    background: #ffffff;
    border: 1px solid #deddd9;
    border-radius: 8px;

    .topLine {
      display: grid;
      grid-gap: 8px;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      /* img {
        height: 40px;
      } */
      .reviewer {
        display: grid;
        grid-gap: 5px;
        grid-template-columns: auto 1fr;
        align-items: center;
      }
      .voteArea {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        border: 1px solid #a1a1a1;
        border-radius: 4px;
        padding: 5px;
        .votesCounter {
          border-left: 1px solid #a1a1a1;
          text-align: center;
        }
      }
    }

    .tasksArea {
      display: grid;
      justify-content: end;
      justify-items: end;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      .task {
        display: grid;
        grid-gap: 10px;
        grid-template-columns: auto 1fr;
        padding: 10px 20px;
        background: #fdf2d0;
        border-radius: 20px;
      }
    }
  }

  .cards {
    display: grid;
    padding: 8px;
    grid-gap: 1rem;

    .reviewerComment {
      font-family: "Nunito";
      font-size: 16px;
      line-height: 137%;
      color: #3b3b3b;
    }
    .questionTitle {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .questionAnswer {
      font-weight: 700;
      font-style: normal;
    }
  }

  .card {
    .title {
      display: grid;
      grid-gap: 8px;
      grid-template-columns: auto 1fr;
    }
    display: grid;
    grid-gap: 1rem;
    color: #1a1a1a;
    box-sizing: border-box;
    border-radius: 4px;
    text-align: left;
  }

  .status {
    display: grid;
    grid-gap: 15px;
    grid-template-columns: auto 1fr;
    padding: 8px;
    border-radius: 4px;
    .title {
      font-family: "Nunito";
      font-style: normal;
      font-weight: 600;
      font-size: 14px;
      line-height: 24px;
    }
  }
  .readyMoveForward {
    background: #def8fb;
  }
  .needsMinorAdjustments {
    background: #fdf2d0;
    color: #5d5763;
  }
  .needsSignificantWork {
    background: #ebe5f8;
    color: #6f25ce;
  }
  .requiresReevaluation {
    background: #fdeae8;
    color: #b9261a;
  }
`;

export default StyledFeedback;
