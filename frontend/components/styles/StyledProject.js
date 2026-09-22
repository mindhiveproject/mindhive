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
  width: 100%;
  max-width: 100%;
  min-width: 0;
  align-content: baseline;
  grid-template-rows: auto 1fr;
  overflow-x: hidden;
  .navigation {
    display: flex;
    align-items: center;
    column-gap: 20px;
    padding: 8px 8px 8px 16px;
    min-height: 55px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);

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
    .navTitle {
      flex: 0 1 auto;
      min-width: 0;
      max-width: 25%;
      overflow: hidden;
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
    .right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 0 0 auto;
      .connectArea {
        display: flex;
        align-items: center;
        gap: 0;
      }
    }
    .builderNavbar {
      /* Project journey tab bar (Figma Navbar 2187:2324) — rendered via the
         shared Navbar component (variant="underline" dense). Takes the
         remaining middle space so ResizeObserver collapse tracks available
         width (same idea as the study-builder side panel). */
      flex: 1 1 0;
      min-width: 0;
      padding: 0 8px;
      overflow: hidden;
    }
  }
  .cardNavigation {
    display: grid;
    align-items: center;
    padding: 6px 9px;
    grid-template-columns: auto 1fr auto;
    grid-gap: 20px;
    height: 64px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    background: var(--MH-Theme-Neutrals-White, #ffffff);
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
        background: var(--MH-Theme-Neutrals-Light, #e6e6e6);
        color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
        border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
      }
    }
  }
`;

export default StyledProject;
