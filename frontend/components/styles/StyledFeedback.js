import styled from "styled-components";

const StyledFeedback = styled.div`
  display: grid;
  margin: 0;
  grid-gap: 16px;
  font-style: normal;
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;

  .section {
    display: grid;
    grid-gap: 1rem;
    min-width: 300px;
    padding: 20px 24px;

    align-content: baseline;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 12px;

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
        .voteButton {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
        }
        .voteButtonActive {
          opacity: 1;
        }
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
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
      padding: 16px 20px;
      border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
      border-radius: 12px;
      background: var(--MH-Theme-Neutrals-White, #ffffff);

      .reviewAnswerPart + .reviewAnswerPart {
        margin-top: 12px;
      }
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
      font-style: normal;
      font: var(--MH-Type-Title-Small);
      letter-spacing: 0;
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
