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
    // position: sticky;
    // top: 0;
    // z-index: 105;
    // background: #ffffff;
    // box-shadow: 0px 2px 12px rgba(15, 56, 75, 0.08);
    .firstLine {
      display: grid;
      align-items: center;
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
      align-items: center;
      .title {
        color: #00635a;
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
      /* Project journey tab bar (Figma Navbar 2187:2324) */
      padding: 0 8px;
      background: #f3f3f3;

      .menu {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .menuTitle {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        border-bottom: 4px solid transparent;
        cursor: pointer;

        .titleWithIcon {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;

          img {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
          }

          p {
            font-family: Inter, sans-serif;
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
            color: #171717;
            margin: 0;
          }
        }
      }

      .selectedMenuTitle {
        border-bottom-color: #f2be42;
      }

      @media (max-width: 800px) {
        .menu {
          flex-wrap: wrap;
          row-gap: 8px;
        }

        .menuTitle {
          flex: 1 1 45%;
        }

        .menuTitle .titleWithIcon {
          white-space: normal;
        }
      }
    }
  }
  .cardNavigation {
    display: grid;
    align-items: center;
    padding: 6px 9px;
    grid-template-columns: auto 1fr auto;
    grid-gap: 20px;
    height: 64px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
    background: var(--MH-Theme-Neutrals-White, #FFF);
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
        // box-shadow: 0px 1px 3px 0px #0000004d;
        cursor: pointer;
      }
    }
    .middle {
      overflow: hidden;
      color: var(--MH-Theme-Neutrals-Black, #171717);
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: Inter;
      font-size: 22px;
      font-style: normal;
      font-weight: 600;
      line-height: 28px;
      text-align: left;
      text-underline-position: from-font;
      text-decoration-skip-ink: none;
      max-width: 100%;
    }
    .right {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-gap: 10px;
      align-items: center;
      .saveButton {
        display: flex;
        height: 40px;
        padding: 8px 24px;
        justify-content: center;
        align-items: center;
        gap: 8px;
        border-radius: 100px;
        background: var(--MH-Theme-Primary-Dark, #336F8A);
        border: 1px solid var(--MH-Theme-Neutrals-White, #336F8A);

        text-align: center;
        /* MH-Theme/label/base */
        font-family: Inter;
        font-size: 14px;
        font-style: normal;
        font-weight: 600;
        line-height: 20px; /* 142.857% */
          &:hover {
            background: var(--MH-Theme-Accent-Medium, #F9D978);
            color: var(--MH-Theme-Accent-Dark, #5D5763);
            border: 1px solid var(--MH-Theme-Accent-Dark, #5D5763);
            border-color: var(--MH-Theme-Accent-Dark, #5D5763);
          }
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
        background: var(--MH-Theme-Neutrals-Light, #E6E6E6);
        color: var(--MH-Theme-Neutrals-Dark, #6A6A6A);
        border: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
      }
    }
  }
`;

export default StyledProject;
