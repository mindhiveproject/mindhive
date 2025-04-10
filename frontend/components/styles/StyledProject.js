import styled from "styled-components";

export const StyledLinkedProjects = styled.div`
  display: grid;
  margin-top: 20px;

  font-family: Nunito;
  font-size: 18px;
  font-weight: 500;
  line-height: 40px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;

  .projectName {
    color: #3d85b0;
  }
  .project {
    display: grid;
    align-content: center;
    grid-template-columns: auto 1fr;
    grid-gap: 10px;
  }
`;

const StyledProject = styled.div`
  display: grid;
  height: 100vh;
  align-content: baseline;
  grid-template-rows: auto 1fr;
  .navigation {
    display: grid;
    .firstLine {
      display: grid;
      align-items: center;
      padding: 6px 9px;
      grid-template-columns: auto 1fr auto;
      grid-gap: 20px;
      padding: 7px 10px;
      min-height: 55px;
    }

    .on {
    }
    .off {
      background: lightGrey;
      border: 1px solid lightGrey;
    }
    .left {
      display: grid;
      .selector {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 10px;
        align-items: center;
        background: #f3f5f6;
        border-radius: 25px;
        width: 225px;
        height: 42px;
        .icon {
          display: grid;
          justify-items: center;
          align-items: center;
          border: 1px solid #c0c0c0;
          border-radius: 25px;
          height: 42px;
          width: 42px;
        }
        .option {
          display: grid;
          grid-template-columns: 25px 1fr;
          grid-gap: 10px;
          align-items: center;
          padding: 10px 9px;
          width: 225px;
        }
      }
    }
    .middle {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-gap: 20px;
      .title {
        color: #3d85b0;
      }
    }
    .right {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-gap: 10px;
      .connectArea {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-gap: 5px;
        align-items: center;
      }
    }
    .secondLine {
      padding: 0px 15px;
      background: #e8ebef;
      box-shadow: 0px 2px 20px rgba(0, 0, 0, 0.07);
    }
  }
  .cardNavigation {
    display: grid;
    align-items: center;
    padding: 6px 9px;
    grid-template-columns: auto 1fr auto;
    grid-gap: 20px;
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
        cursor: pointer;
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
      .saveButton {
        background: #3d85b0;
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
      .disabled {
        opacity: 50%;
      }
      .iconBtn {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 10px;
      }
      .lockText {
        font-family: "Nunito";
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 22px;
        display: flex;
        align-items: center;
        color: #666666;
      }
      .lockButton {
        background: white;
        color: #3d85b0;
        border: 1px solid #3d85b0;
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
      .off {
        background: lightGrey;
        border: 1px solid lightGrey;
      }
    }
  }
`;

export default StyledProject;
