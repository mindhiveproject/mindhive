import styled from "styled-components";

export const StyledLinkedProjects = styled.div`
  display: grid;
  margin-top: 20px;

  font: var(--MH-Type-Label-Large);
  letter-spacing: 0;
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
      padding: 8px 8px 8px 16px;
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
      grid-template-columns: minmax(0, 1fr) auto;
      grid-gap: 20px;
      align-items: center;
      .title {
        color: #00635a;
      }
      span.studyTitle {
        display: block;
        width: 100%;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
        font: var(--MH-Type-Title-Large);
        letter-spacing: 0;
        color: var(--MH-Theme-Neutrals-Black, #171717);
        text-align: left;
        text-underline-position: from-font;
        text-decoration-skip-ink: none;
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
      background: #F6F9F8;
      border-bottom: 1px solid #E6E6E6;
      border-top: 1px solid #E6E6E6;

      .menu {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .menuTitle {
        display: flex;
        align-items: center;
        padding: 0px 8px 8px 8px;
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
            font: var(--MH-Type-Label-Large);
            letter-spacing: 0;
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
      font: var(--MH-Type-Title-Large);
      letter-spacing: 0;
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
      /* The save/submit button here is DesignSystem/Button (variant="filled")
         now — no local CSS to keep in sync with it. */
      .iconBtn {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-gap: 10px;
      }
      .lockText {
        font: var(--MH-Type-Body-Base);
        letter-spacing: 0;
        display: flex;
        align-items: center;
        color: #666666;
      }
      .lockButton {
        background: white;
        color: #3d85b0;
        border: 1px solid #3d85b0;
        border-radius: 100px;
        font: var(--MH-Type-Label-Base);
        letter-spacing: 0;
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
