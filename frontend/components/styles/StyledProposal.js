import styled from "styled-components";

export const StyledProposal = styled.div`
  display: ${(props) => (props.$cardFullView ? "flex" : "grid")};
  flex-direction: ${(props) => (props.$cardFullView ? "column" : "unset")};
  width: 100%;
  height: 100%;
  overflow-y: ${(props) => (props.$cardFullView ? "hidden" : "auto")};
  // padding: ${(props) => (props.$cardFullView ? "0" : "20px")};
  // min-height: 80vh;
  background: #f7f9f8;
  align-items: ${(props) => (props.$cardFullView ? "stretch" : "baseline")};
  min-height: ${(props) => (props.$cardFullView ? "0" : "unset")};

  i.icon {
    font-family: Icons !important; /* or the exact name from semantic.min.css */
  }
  .hideScrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hideScrollbar::-webkit-scrollbar {
    display: none;
  }

  .closeBtn {
    line-height: 3rem;
    text-align: center;
    cursor: pointer;
    border-radius: 2.25rem;
    color: #5f6871;
    font-size: 3rem;
    cursor: pointer;
    :hover {
      transform: scale(1.5);
      transition: transform 0.5s;
      color: red;
    }
  }

  button:not(.DesignSystem-Button) {
    display: grid;
    align-content: center;
    max-width: 300px;
    width: 100%;
    background: none;
    color: #666666;
    padding: 15px 10px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    cursor: pointer;
    font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
    text-align: center;
  }

  .overview {
    display: grid;
    grid-gap: 1rem;
    margin: 3rem;
    align-content: baseline;
    .navigationHeader {
      display: grid;
      justify-content: end;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 200px;
      align-items: center;
    }

    .proposalHeader {
      display: grid;
      margin: 5px;
      padding: 10px;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      cursor: pointer;
      font-weight: bold;
    }
    .itemRow {
      display: grid;
      margin: 5px;
      padding: 10px;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      background: white;
      align-items: center;
      .actionLinks {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        grid-gap: 1rem;
      }
    }
    .main {
      border: 1px solid gray;
    }
  }

  .empty {
    display: grid;
    margin: 10px 0px 20px 0px;
    grid-gap: 1rem;
    align-content: center;
    justify-content: center;
    justify-items: center;
    text-align: center;
    width: 100%;
  }

  .dropdown {
    width: 100%;
    height: auto;
  }

  .proposalBoard {
    display: grid;
    grid-template-rows: auto auto;
    align-content: start;
    margin: 20px;
    min-height: 0;
    --proposal-section-width: 500px;
    --proposal-section-margin: 15px;

    .boardEditorChrome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      width: 100%;
      min-width: 0;
      margin: 0 0 8px;
      padding: 8px;
      background: var(--MH-Theme-Neutrals-White, #ffffff);
      border-radius: 8px;
      border: 1px solid var(--MH-Theme-Neutrals-Light,#e6e6e6);
    }
    .boardEditorChromeLeft {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }
    .boardEditorChromeTitleWrap {
      min-width: 0;
      flex: 1;
    }
    .boardEditorChromeTitleRow {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .boardEditorChromeTypeBadge {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
    }
    .boardEditorChromeTitle {
      margin: 0;
      font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
      letter-spacing: 0;
      color: var(--MH-Theme-Neutrals-Black, #171717);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .boardEditorChromeTitleInput {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
      letter-spacing: 0;
      color: var(--MH-Theme-Neutrals-Black, #171717);
      border: 1px solid var(--MH-Theme-Primary-Dark, #336F8A);
      border-radius: 8px;
      padding: 4px 8px;
      background: var(--MH-Theme-Neutrals-White, #ffffff);
    }
    .boardEditorChromeRight {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .boardEditorChromeEditMode {
      font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
      letter-spacing: 0;
      color: var(--MH-Theme-Neutrals-Dark, #6A6A6A);
      white-space: nowrap;
    }

    .narrowButton {
      height: 40px;
      padding: 8px 24px 8px 16px;
      justify-content: center;
      gap: 8px;
      flex-shrink: 0;
      width: auto;
      display: inline-flex;
      align-items: center;
      margin: 1rem 0;
      background: #336F8A;
      color: white;
      border-radius: 100px;
      font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
      letter-spacing: 0;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    .narrowButton:hover {
      border-radius: 100px;
      border: 1px #F9D978;
      color: #274E5B;
      background: #F9D978;
      box-shadow: 2px 2px 12px 0 rgba(0, 0, 0, 0.15);
    }

    .narrowButtonSecondary {
      height: 40px;
      padding: 8px 24px 8px 16px;
      justify-content: center;
      gap: 8px;
      flex-shrink: 0;
      width: auto;
      display: inline-flex;
      align-items: center;
      margin: 1rem 0;
      background: white;
      color: #336F8A;
      border-radius: 100px;
      font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
      letter-spacing: 0;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    .narrowButtonSecondary:hover {
      display: inline-flex;
      height: 40px;
      padding: 8px 24px 8px 16px;
      justify-content: center;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      border-radius: 100px;
      border: 1px solid var(--MH-Theme-Primary-Dark, #336F8A);
      background: var(--MH-Theme-Neutrals-Lighter, #F3F3F3);
    }

    .previewToggle {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      column-gap: 16px;
      align-items: center;
      margin: 5px 36px 15px 0px;
      span {
        font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
        letter-spacing: 0;
      }
      .goBackButton {
        cursor: pointer;
      }
      .preview {
        display: grid;
        grid-gap: 1rem;
        grid-template-columns: auto 1fr;
        align-items: center;
      }
      .alert {
        background: #fff9e6;
        padding: 5px 10px 5px 10px;
        margin-left: 5px;
        border-radius: 4px;
        span,
        .icon {
          font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
          letter-spacing: 0;
          color: #666666;
        }
      }
    }
    .proposalPDF {
      display: grid;
      align-content: baseline;
      margin: 20px;
      max-width: 90vw;
      height: 100%;
    }
  }

  .newInput {
    display: grid;
    width: 100%;
    justify-content: stretch;
    text-align: start;
    padding: 0px 20px;
    input {
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      padding: 10px 10px 10px 10px;
      height: 70px;
    }
    .addBtn {
      display: grid;
      justify-self: center;
      margin: 10px 0px 5px 0px;
      cursor: pointer;
      text-align: center;
      padding: 5px;
      color: #007c70;
      width: fit-content;
    }
  }

  .inner {
    display: grid;
    grid-template-columns: 1fr auto;
    .scrollable {
      overflow-x: auto;
    }
  }

  .boardInner {
    display: flex;
    flex-direction: column;
    min-height: 0;
    width: 100%;
    max-width: 100%;
    flex: 1;
    .boardInnerToolbar {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: max-content;
      gap: 8px;
      padding: 0 15px 8px;
      .boardInnerToolbarSelect {
        min-width: 220px;
        max-width: 280px;
      }
    }
    .scrollable {
      flex: 1;
      min-width: 0;
      overflow-x: auto;
      padding: 0px;
    }
  }

  .sections {
  }

  .section {
    display: grid;
    justify-items: center;
    grid-gap: 12px;
    position: relative;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    border: 1.5px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
    border-radius: 8px;
    min-width: 250px;
    width: var(--proposal-section-width);
    max-width: var(--proposal-section-width);
    margin: var(--proposal-section-margin);
    padding: 24px;
    &.sectionSelectSelected {
      outline: 2px solid var(--MH-Theme-Danger-Dark, #8F1F14);
      outline-offset: -2px;
    }
    & > div {
      width: 100%;
    }
    .smooth-dnd-container.vertical {
      width: 100%;
    }
    .infoLine {
      margin: 1rem 0px 0px 0rem;
      display: grid;
      color: #b3b3b3;
      font: var(--MH-Type-Label-Large, 500 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
      text-align: left;
      text-underline-position: from-font;
      text-decoration-skip-ink: none;
    }
    .column-drag-handle {
      display: grid;
      width: 100%;
      min-width: 0;
      margin: 0px 0px 0px 0px;
      // padding: 1rem 2rem 1rem 2rem;
      // box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      .firstLine {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        grid-gap: 10px;
        justify-items: baseline;
        align-items: center;
        text-align: center;
        margin: 1rem 0px 0px 0rem;
        &.firstLineSelectMode {
          grid-template-columns: auto minmax(0, 1fr) auto;
        }
      }
      .sectionSelectCheckbox {
        width: 20px;
        height: 20px;
        margin: 0;
        cursor: pointer;
        accent-color: var(--MH-Theme-Danger-Dark, #8F1F14);
      }
      .sectionTitle {
        font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
        color: #171717;
        letter-spacing: 0;
        text-align: left;
        text-underline-position: from-font;
        text-decoration-skip-ink: none;
        min-width: 0;
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        word-break: break-word;
        text-overflow: ellipsis;
      }
      .sectionTitleInput {
        font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
        letter-spacing: 0;
        text-align: left;
        width: 100%;
        min-width: 0;
        border: 1px solid #336F8A;
        border-radius: 4px;
        padding: 2px 6px;
        outline: none;
        box-sizing: border-box;
        resize: vertical;
        min-height: 36px;
        max-height: 80px;
        white-space: pre-line;
        overflow-y: auto;
      }
      span {
        font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
        letter-spacing: 0;
        text-align: center;
      }
    }
    .deleteBtn {
      position: absolute;
      bottom: -12px;
      left: -5px;
      cursor: pointer;
      img {
        width: 20px;
        opacity: 0.1;
      }
      img: hover {
        opacity: 1;
      }
    }
  }

  &.projectsBoardEditorProposal {
    overflow-y: hidden;
    min-height: 0;
    height: 100%;
    /* Layout tokens live on the shell so previews without .proposalBoard still get gaps. */
    --proposal-section-min-width: 420px;
    --proposal-section-max-width: 500px;
    --proposal-section-width: var(--proposal-section-min-width);
    --proposal-section-gap: 24px;
    --proposal-card-gap: 12px;
  }

  &.projectsBoardEditorProposal .proposalBoard {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    height: 100%;
    overflow: hidden;
  }

  &.projectsBoardEditorProposal .boardEditorChrome {
    flex-shrink: 0;
    background: #fff;
    z-index: 4;
  }

  &.projectsBoardEditorProposal .boardInner {
    flex: 1;
    min-height: 0;
    max-width: none;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &.projectsBoardEditorProposal .boardInner .boardInnerToolbar {
    flex-shrink: 0;
    z-index: 3;
    padding: 8px 8px;
    margin-bottom: 8px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 8px;
  }

  &.projectsBoardEditorProposal .boardEditorBody {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &.projectsBoardEditorProposal .boardEditorBody .post {
    flex: 1;
    min-height: 0;
    height: auto;
    overflow-y: auto;
  }

  &.projectsBoardEditorProposal .boardEditorBody .post.milestoneCardEditorPost {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &.projectsBoardEditorProposal
    .boardEditorBody
    .post.milestoneCardEditorPost
    .proposalCardBoard {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    align-items: stretch;
  }

  &.projectsBoardEditorProposal
    .boardEditorBody
    .post.milestoneCardEditorPost
    .textBoard {
    overflow-y: auto;
    padding-bottom: 48px;
    margin-bottom: 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  &.projectsBoardEditorProposal
    .boardEditorBody
    .post.milestoneCardEditorPost
    .infoBoard {
    overflow-y: auto;
    max-height: 100%;
    align-self: stretch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  &.projectsBoardEditorProposal .boardInner .boardColumnsWrap {
    position: relative;
    display: flex;
    align-items: stretch;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  &.projectsBoardEditorProposal .boardInner .boardColumnScrollEdge {
    position: absolute;
    top: 0;
    bottom: auto;
    height: var(--board-scroll-edge-height, 100%);
    z-index: 2;
    display: block;
    width: 56px;
    margin: 0;
    padding: 0;
    pointer-events: none;
  }

  &.projectsBoardEditorProposal .boardInner .boardColumnScrollEdgeLeft {
    left: 0;
    padding-left: 2px;
    background: linear-gradient(
      to right,
      #f7f9f8 0%,
      #f7f9f8 42%,
      rgba(247, 249, 248, 0) 100%
    );
  }

  &.projectsBoardEditorProposal .boardInner .boardColumnScrollEdgeRight {
    right: 0;
    padding-right: 2px;
    background: linear-gradient(
      to left,
      #f7f9f8 0%,
      #f7f9f8 42%,
      rgba(247, 249, 248, 0) 100%
    );
  }

  &.projectsBoardEditorProposal .boardInner .boardColumnScrollEdge.isHidden {
    opacity: 0;
    visibility: hidden;
  }

  &.projectsBoardEditorProposal .boardInner .boardColumnScrollArrow {
    position: absolute;
    top: var(--board-scroll-arrow-top, 50%);
    transform: translateY(-50%);
    pointer-events: auto;
  }

  &.projectsBoardEditorProposal .boardInner .boardColumnScrollEdgeLeft .boardColumnScrollArrow {
    left: 2px;
  }

  &.projectsBoardEditorProposal .boardInner .boardColumnScrollEdgeRight .boardColumnScrollArrow {
    right: 2px;
  }

  &.projectsBoardEditorProposal .boardInner .boardColumnScrollArrow .DesignSystem-IconButton-Icon {
    width: 12px !important;
    height: 12px !important;
  }

  &.projectsBoardEditorProposal .boardInner .boardColumnScrollArrow .DesignSystem-IconButton-Icon img {
    width: 12px;
    height: 12px;
    opacity: 0.55;
  }

  &.projectsBoardEditorProposal .boardInner .scrollable {
    flex: 1 1 0;
    max-width: 100%;
  }

  &.projectsBoardEditorProposal .boardInner .boardColumnsWrap .scrollable {
    overflow-y: visible;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
    overscroll-behavior-x: contain;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  &.projectsBoardEditorProposal .sections {
    min-width: 100%;
  }

  &.projectsBoardEditorProposal .sections .smooth-dnd-container.horizontal {
    display: flex !important;
    gap: var(--proposal-section-gap);
    min-width: max-content;
    box-sizing: border-box;
    /* Inset columns so danger borders are not clipped by overflow scrollers. */
    padding: 2px;
  }

  &.projectsBoardEditorProposal .sections .smooth-dnd-container.horizontal > .smooth-dnd-draggable-wrapper {
    flex: 0 0 var(--proposal-section-min-width);
    min-width: var(--proposal-section-min-width) !important;
    max-width: var(--proposal-section-max-width);
    width: auto !important;
    box-sizing: border-box;
  }

  &.projectsBoardEditorProposal .section {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    margin: 0;
  }

  &.projectsBoardEditorProposal .section > div {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  &.projectsBoardEditorProposal .section .smooth-dnd-container.vertical {
    display: flex;
    flex-direction: column;
    gap: var(--proposal-card-gap);
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  &.projectsBoardEditorProposal .section .smooth-dnd-container.vertical > .smooth-dnd-draggable-wrapper {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }

  .header {
    display: grid;
    margin-bottom: 24px;
    height: fit-content;
    .headerContent {
      width: 100%;
      max-width: 100%;
    }
    .headerMainContent {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }
    .headerLeftSection {
      display: flex;
      flex: 1 0 0;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }
    .headerRightSection {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      padding-left: 8px;
    }
    .headerTitleRow {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .headerEditIcon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #F3F3F3;
      border-radius: 100px;
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
      .icon {
        // color: #336F8A;
        margin: 0;
        width: 24px;
        height: 24px;
        aspect-ratio: 1 / 1;
      }
      img {
        width: 24px;
        height: 24px;
        aspect-ratio: 1 / 1;
        object-fit: contain;
        border: none;
      }
      &:hover {
      // background: #E6E6E6;
      border: 1px solid #336F8A;
      img {
        border: none;
      }
    }
    }
    .headerTitleWrapper {
      flex: 1;
      min-width: 0;
    }
    .headerTitle {
      font: var(--MH-Type-Heading-Base, 600 36px/44px "Inter", sans-serif);
      letter-spacing: 0;
      color: #171717;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .headerInfoRow {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 8px;
      width: 100%;
      justify-content: flex-start;
      align-items: flex-start;
    }
    .studyLinkChip {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      height: 32px;
      border-radius: 8px;
      padding: 6px 12px;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1.5px solid;
      white-space: nowrap;
      font-family: inherit;
      width: fit-content;
      &:focus {
        outline: none;
      }
      &.board {
        background: #F9D978;
        border-color: #5D5763;
        color: #171717;
        &:hover:not(:disabled) {
          background: #F5D165;
          border-color: #4A4550;
        }
      }
      &.list {
        background: #DEF8FB;
        border-color: #336F8A;
        color: #171717;
        width: max-content;
        max-width: 100%;
        &:hover:not(:disabled) {
          background: #C8F0F5;
          border-color: #2A5A6D;
        }
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    .studyLinkChipContent {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      padding: 0;
      min-width: 0;
      flex: 0 1 auto;
    }
    .studyLinkIcon {
      width: fit-content;
      height: fit-content;
      flex-shrink: 0;
      margin: 0;
      display: block;
    }
    .studyLinkText {
      margin: 0;
      font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
      color: #171717;
      white-space: nowrap;
      text-align: left;
      letter-spacing: 0;
      width: fit-content;
      vertical-align: middle;
      min-width: 0;
    }
    .collaboratorArray {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: nowrap;
      width: 100%;
    }
    .collaboratorChip {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      border: 1px solid #A1A1A1;
      border-radius: 30px;
      padding: 4px 12px 4px 12px;
      gap: 8px;
      background: white;
      overflow: hidden;
      width: fit-content;
      max-width: 300px;
      span {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: flex;
        height: 100%;
        align-items: center;
      }
    }
    .addCollaboratorButton {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid #A1A1A1;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;
      overflow: hidden;
      &:hover {
        background: #F3F3F3;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
      .icon {
        color: #171717;
        margin: 0;
      }
    }
    .downloadButton {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 40px;
      padding: 8px 12px 8px 16px;
      border-radius: 100px;
      // border: 1px solid #336F8A;
      // background: white;
      color: #336F8A;
      font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
      letter-spacing: 0;
      cursor: pointer;
      flex-shrink: 0;
      &:hover {
        background: #ffffff;
        paddingRight: 12px;
        border: 1px solid #336F8A;
        // color: #625B71;
        .icon {
          color: #625B71;
        }
      }
      .icon {
        margin: 0;
        width: 24px;
        height: 24px;
        color: #336F8A;
      }
    }
    .downloadButtonText {
      white-space: nowrap;
    }
    .viewToggleGroup {
      display: flex;
      align-items: center;
      gap: 0;
    }
    .viewToggleButton {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 40px;
      padding: 8px 24px 8px 16px;
      border: 1px solid #336F8A;
      font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
      letter-spacing: 0;
      cursor: pointer;
      white-space: nowrap;
      margin-right: -1px;
      &.left {
        border-top-left-radius: 100px;
        border-bottom-left-radius: 100px;
      }
      &.right {
        border-top-right-radius: 100px;
        border-bottom-right-radius: 100px;
      }
      &.active {
        background: #D3E0E3;
        color: #336F8A;
        border-color: #336F8A;
        .icon {
          color: #336F8A;
          margin: 0;
        }
      }
      &.inactive {
        background: white;
        color: #336F8A;
        border-color: #336F8A;
        .icon {
          color: #336F8A;
          margin: 0;
        }
      }
      &:hover {
        background: #F3F3F3;
      }
      img {
        width: 18px;
        height: 18px;
        object-fit: contain;
        margin: 0;
        filter: brightness(0) saturate(100%) invert(26%) sepia(94%) saturate(1234%) hue-rotate(158deg) brightness(92%) contrast(87%);
      }
    }
    .titleEdit {
      font: var(--MH-Type-Heading-Base, 600 36px/44px "Inter", sans-serif);
      letter-spacing: 0;
      color: #171717;
      background: white;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    .titleIcon {
      display: grid;
      grid-gap: 20px;
      grid-template-columns: auto 1fr;
      min-width: 0;
      .title {
        font: var(--MH-Type-Heading-Base, 600 36px/44px "Inter", sans-serif);
        letter-spacing: 0;
        color: #171717;
        min-width: 0;
        overflow-wrap: break-word;
      }
      .icon {
        display: grid;
        align-content: center;
        cursor: pointer;
      }
    }
    .subtitle {
      font: var(--MH-Type-Body-Large, 400 22px/28px "Inter", sans-serif);
      letter-spacing: 0;
      color: #6c6c6c;
    }
    input,
    textarea,
    select {
      background: #f6f9f8;
      width: 100%;
      border: 0px solid #e6e6e6;
      border-radius: 4px;
      &:focus {
        outline: 0;
        background: white;
        border-color: mintcream;
      }
    }
    .title {
      letter-spacing: 0;
      text-align: left;
      color: #1a1a1a; */
    }
    .description {
      font: var(--MH-Type-Body-Large, 400 22px/28px "Inter", sans-serif);
      letter-spacing: 0;
      text-align: left;
      color: #666666;
    }
    .checkboxField {
      display: grid;
      grid-template-columns: 30px 1fr;
      grid-gap: 10px;
      align-items: center;
      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        color: green;
      }
    }
    .titleEditBtn {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .templateBanner {
    margin-top: 16px;
    margin-bottom: 24px;
    border-radius: 16px;
    overflow: visible;
    background: #ffffff;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
  }
  .templateBannerHeader {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    background: #ffffff;
    padding: 16px 20px;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    /* when collapsed, header is the only child — round bottom to match container */
    &:only-child {
      border-bottom-left-radius: 16px;
      border-bottom-right-radius: 16px;
    }
  }
  .templateBannerHeaderLeft {
    min-width: 0;
    flex: 1 1 0%;
    display: flex;
    align-items: center;
    gap: 12px; /* ensures spacing between multiple elements (e.g. title and subtitle) */
    flex-wrap: wrap; /* allows for two elements to stack vertically if space runs out */
  }
  .templateBannerHeaderChips {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .templateBanner .templateBannerHeaderToggle {
    display: flex;
    align-items: center;
    gap: 12px;
    width: fit-content;
    padding: 16px;
    background: #F6F9F8;
    border-radius: 16px;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    color: #171717;
    border: 1px solid #E6E6E6;
    &:hover {
      background: #FDF2D0;
    }
    &:active {
      background: var(--MH-Theme-Primary-Light, #DEF8FB);
      color: var(--MH-Theme-Primary-Dark, #336F8A);
      .templateBannerTitle {
        color: inherit;
      }
      img {
        filter: none;
      }
    }
    &:focus-visible {
      outline-offset: 2px;
    }
    img {
      flex-shrink: 0;
    }
  }
  .templateBanner .templateBannerHeaderToggle .templateBannerTitle {
    font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    color: #5D5763;
    margin: 0;
  }
  .templateBannerSubtitle {
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
    color: rgba(255, 255, 255, 0.9);
    margin: 4px 0 0 0;
  }
  .templateBannerContent {
    padding: 0 20px 0 20px;
    background: #ffffff;
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
    border-top: 3px solid #F6F9F8;
  }
  .templateBannerContentInner {
    display: flex;
    flex-direction: row;
    min-height: 0;
  }
  .templateBannerContentLeft {
    flex: 0 0 20%;
    max-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-right: 16px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
  .templateBannerContentDivider {
    width: 3px;
    background: #F6F9F8;
    align-self: stretch;
    flex-shrink: 0;
  }
  .templateBannerContentRight {
    flex: 1;
    min-width: 0;
    padding-left: 20px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
  .templateBannerStudentSettings {
    .templateBannerStudentSettingsHeading {
      font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
      color: #171717;
      margin: 0 0 8px 0;
    }
    .templateBannerStudentSettingsHelp {
      font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
      letter-spacing: 0;
      color: #625B71;
      margin: 0 0 16px 0;
    }
    .templateBannerStudentSettingsItem {
      margin-bottom: 12px;
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  .templateBannerAdminSettings {
    .templateBannerAdminSettingsHeading {
      font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
      color: #171717;
      margin: 0 0 8px 0;
    }
    .templateBannerAdminSettingsItem {
      margin-bottom: 12px;
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  .templateBannerBoardTypeOptions {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex-wrap: wrap;
  }
  .templateBannerBoardTypeIntro {
    font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    color: #171717;
    margin: 0 0 4px 0;
  }
  .templateBannerBoardTypeMentorNote {
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
    color: #625B71;
    margin: 0 0 16px 0;
  }
  .templateBannerBoardTypeOption {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    min-width: 0;
    width: fit-content;
    border: 1px solid #A1A1A1;
    border-radius: 12px;
    background: #ffffff;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
    &:hover {
      border-color: #A1A1A1;
      background: #F6F9F8;
    }
    &.templateBannerBoardTypeOptionSelected {
      border-color: var(--MH-Theme-Primary-Yellow, #F9D978);
      border-width: 3px;
      // background: var(--MH-Theme-Primary-Light, #DEF8FB);
    }
  }
  .templateBannerBoardTypeOptionLogos {
    display: flex;
    flex-direction: row;
    align-items: stretch;      /* Maximize height for children */
    justify-content: flex-start;
    width: fit-content;        /* Fit content for width */
    height: 100%;              /* Maximize height relative to parent/container */
    gap: 12px;
  }
  .templateBannerBoardTypeLogo {
    width: 200px;
    height: 42px;
    object-fit: contain;
  }
  .templateBannerBoardTypeOptionLabel {
    font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
    color: #171717;
  }
  .templateBannerSection {
    margin-bottom: 16px;
    &:last-of-type {
      margin-bottom: 0;
    }
  }
  .templateBannerSectionHeading {
    display: flex;
    align-items: center;
    gap: 8px;
    font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    color: #171717;
    margin: 0 0 6px 0;
  }
  .templateBannerSectionBody {
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
    color: #625B71;
    margin: 0;
    padding-left: 0;
  }
  .templateBannerToggleRow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
  }
  .templateBannerActions {
    margin-top: 16px;
  }
  .templateBanner .templateBannerPrimaryBtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
    cursor: pointer;
    max-width: 320px;
  }

  .cardPreview {
    display: grid;
    grid-gap: 10px;
    margin: 3rem;
    .description {
      background: #fbfaf7;
      padding: 10px 5px;
      border-radius: 7px;
    }

    .buttons {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr auto;
      justify-items: end;
      grid-gap: 10px;
    }
  }

  .post {
    display: grid;
    // grid-row-gap: 10px;
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    text-align: left;
    background: #F7F9F8;
    padding: 0px;
    width: 100%;
    height: 100%;
    min-height: 0;

    /* Single scrollbar: TipTap editors grow with content so only StyledProposal scrolls */
    .ProseMirror {
      max-height: none;
      overflow-y: visible;
    }

    .resourcePreview {
      display: grid;
      grid-gap: 20px;
      .resourceBlockPreview {
        .titleIcons {
          display: grid;
          align-items: center;
          grid-gap: 10px;
          grid-template-columns: 1fr auto auto;
        }
        border: 1px solid #CCCCCC;
        border-radius: 4px;
        padding: 10px;
        border-radius: 10px;
      }
    }

    .lockedMessage {
      display: grid;
      grid-gap: 15px;
      align-items: center;
      grid-template-columns: 1fr auto;
      background: orange;
      padding: 15px;
      .username {
        font-weight: bold;
      }
      .buttonHolder {
        display: grid;
        button {
          background: white;
        }
      }
    }

    .navigation-build-mode {
      display: grid;
      align-items: center;
      height: fit-content;
      padding: 8px 24px 8px 24px;
      grid-template-columns: auto 1fr auto;
      grid-gap: 20px;
      background: white;
      border-radius: 24px;
      border-bottom-right-radius: 0;
      border: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
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
        }
      }
      .middle {
        font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
        letter-spacing: 0;
        text-align: left;
        text-underline-position: from-font;
        text-decoration-skip-ink: none;
        min-width: 0;
        .studyTitle {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      .right {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        grid-gap: 10px;
        &.rightPreviewMode {
          grid-template-columns: 1fr;
          justify-items: end;
        }
        .editModeMessage {
          display: grid;
          align-items: center;
          margin: 0px 10px;
        }
        .saveButton {
          background: #3d85b0;
          color: white;
          border-radius: 100px;
          font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
          letter-spacing: 0;
          text-align: center;
          text-underline-position: from-font;
          text-decoration-skip-ink: none;
          padding: 10px 24px;
        }
      }
      &.navigation-build-modeEmbedded {
        grid-template-columns: 1fr;
        justify-items: end;
        .right {
          justify-self: end;
        }
      }
    }
    .buttons {
      width: auto;
      display: grid;
      grid-gap: 10px;
      grid-template-columns: 200px 200px;
      justify-content: end;
    }

    .proposalCardBoard {
      display: flex;
      align-items: flex-start;
      gap: 24px;
      flex: 1 0 0;
      align-self: stretch;
      min-height: 0;
      overflow-y: visible;
    }

    label {
      display: block;
      font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
      letter-spacing: 0;
    }
    input,
    textarea,
    select {
      border: 1px solid #cccccc;
      border-radius: 4px;
      width: 100%;
      font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
      padding: 12px;
      &:focus {
        outline: 0;
        border-color: ${(props) => props.theme.red};
      }
    }
    fieldset {
      display: grid;
      justify-self: center;
      grid-gap: 5px;
      width: 100%;
      border: 0;
      padding: 0;
      &[disabled] {
        opacity: 0.5;
      }
    }
    .cardHeader {
      align-self: stretch;
      color: var(--MH-Theme-Neutrals-Black, #171717);

      /* MH-Theme/title/large */
      font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
      letter-spacing: 0;
    }
    .cardSubheaderAssign {
      color: var(--MH-Theme-Neutrals-Black, #171717);

      /* MH-Theme/title/base */
      font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
    }
    .cardSubheader {
      margin-top: 16px;
      color: var(--MH-Theme-Neutrals-Black, #171717);

      /* MH-Theme/title/large */
      font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
      letter-spacing: 0;
    }
    .cardSubheaderComment {
      font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
      display: flex;
      align-items: center;
      color: #626269;
      mix-blend-mode: normal;
      opacity: 0.7;
    }
    .originalEntryBlock {
      background: var(--MH-Theme-Neutrals-Lighter, #F3F3F3);
      border-radius: 8px;
      border: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
      // box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      width: 100%;
      .originalEntryBlockHeader {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        max-width: none;
        padding: 12px 16px;
        font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
        letter-spacing: 0;
        color: var(--MH-Theme-Accent-Dark, #5D5763);
        background: var(--MH-Theme-Neutrals-Lighter, #F3F3F3);
        border: 0;
        border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
        border-radius: 0;
        cursor: pointer;
        user-select: none;
        text-align: left;
        &:focus-visible {
          outline: 2px solid var(--MH-Theme-Neutrals-Dark, #6A6A6A);
          outline-offset: 2px;
        }
      }
      .originalEntryBlockContent {
        padding: 16px;
        background: var(--MH-Theme-Neutrals-Lighter, #F3F3F3);
        font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
        letter-spacing: 0;
      }
    }
    .cardDescription {
      color: #626269;
      font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
      text-align: left;
      text-underline-position: from-font;
      text-decoration-skip-ink: none;
    }
    .checkboxText {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-gap: 15px;
      align-items: center;
    }
    .textBoard {
      display: flex;
      margin: 12px 24px 24px 24px;
      padding: 24px 24px 24px 24px;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      gap: 10px;
      flex: 1 0 0;
      width: 100%;
      min-width: 0;
      overflow-y: visible;

      & > div {
        width: 100%;
      }
      & > label {
        width: 100%;
        display: flex;
        flex-direction: column;
        min-width: 0;
        box-sizing: border-box;
        input[type="text"] {
          width: 100%;
          box-sizing: border-box;
        }
        /* Editor and other content blocks take full width */
        & > div:not(.cardHeader) {
          width: 100%;
          min-width: 0;
        }
      }
      /* Assigned section in textBoard – chips and add button (mirrors infoBoard) */
      .collaboratorArray {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: nowrap;
        width: 100%;
        margin-top: 8px;
      }
      .collaboratorChip {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        border: 1px solid #A1A1A1;
        border-radius: 30px;
        padding: 4px 12px 4px 12px;
        gap: 8px;
        background: white;
        overflow: hidden;
        width: fit-content;
        max-width: 300px;
        span {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
          letter-spacing: 0;
          display: flex;
          height: 100%;
          align-items: center;
        }
      }
      .addCollaboratorButton {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: 1px solid #A1A1A1;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        padding: 0;
        flex-shrink: 0;
        overflow: hidden;
        &:hover {
          background: #F3F3F3;
        }
        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .icon {
          color: #171717;
          margin: 0;
        }
      }
    }
    .infoBoard {
      display: flex;
      max-width: 500px;
      padding: 24px;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      gap: 24px;
      flex: 1 0 0;
      align-self: stretch;
      border: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
      border-top: none;
      background: var(--MH-Theme-Neutrals-White, #FFF);
      overflow-y: visible;
      min-height: 0;

      &.infoBoardEdit {
        border-radius: 8px;
        border-top: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
      }

      .collaboratorArray {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: nowrap;
        width: 100%;
        margin-top: 8px;
      }
      .collaboratorChip {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        border: 1px solid #A1A1A1;
        border-radius: 30px;
        padding: 4px 12px 4px 12px;
        gap: 8px;
        background: white;
        overflow: hidden;
        width: fit-content;
        max-width: 300px;
        span {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: flex;
          height: 100%;
          align-items: center;
        }
      }
      .addCollaboratorButton {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid #A1A1A1;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        padding: 0;
        flex-shrink: 0;
        overflow: hidden;
        &:hover {
          background: #F3F3F3;
        }
        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .icon {
          color: #171717;
          margin: 0;
        }
      }
      .linkedItemsSection {
        display: flex;
        flex-direction: column;
        gap: 24px;
        width: 100%;
      }
    }
    .resourceLinks {
      display: grid;
      grid-gap: 10px;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

      .link {
        display: grid;
        background: #def8fb;
        border: 1px solid #cccccc;
        border-radius: 20px;
        padding: 9px 16px;
        font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
        letter-spacing: 0;
        text-align: left;
        text-underline-position: from-font;
        text-decoration-skip-ink: none;
        align-items: center;
        justify-items: center;
        text-align: center;
      }
    }
    .visibilityPanel,
    .feedbackCenterPanel {
      width: 100%;
      background: var(--MH-Theme-Tertiary-Light, #F6F9F8);
      border-radius: 12px;
      border: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
      padding: 16px 16px;
      margin-top: 16px;
    }
    .feedbackCenterPanel {
      margin-top: 12px;
      background: var(--MH-Theme-Neutrals-White, #FFF);
    }
    .visibilityPanelHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .visibilityPanelTitleRow {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .feedbackCenterPanelHeader {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .feedbackCenterPanelTitleRow {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .feedbackOptionCards {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }
    .feedbackOptionCard {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--MH-Theme-Tertiary-Light, #F6F9F8);
      border: 1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6);
      border-radius: 8px;
      cursor: pointer;
    }
    .feedbackOptionCard.feedbackOptionCardSelected {
      border-color: var(--MH-Theme-Primary-Dark, #336F8A);
      background: var(--MH-Theme-Primary-Light, #DEF8FB);
    }
    .feedbackOptionCardIcon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    .feedbackOptionCardContent {
      flex: 1;
      min-width: 0;
    }
    .feedbackOptionCardTitle {
      font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
      letter-spacing: 0;
      color: var(--MH-Theme-Neutrals-Black, #171717);
      margin-bottom: 2px;
    }
    .feedbackOptionCardDescription {
      font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
      letter-spacing: 0;
      color: #626269;
    }
    .proposalCardComments {
      display: grid;
      width: 100%;
    }
  }
`;

export const StyledProposalCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  background: #ffffff;
  border: 1px solid #a1a1a1;
  border-radius: 12px;
  // box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
  width: calc(100% - 20px);
  cursor: pointer;
  margin: 3px 10px;
  box-sizing: border-box;

  &.projectsBoardEditorProposal & {
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  &.cardSelectSelected {
    outline: 2px solid var(--MH-Theme-Danger-Dark, #8F1F14);
    outline-offset: 0;
  }

  &.cardSelectAssociate {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);
    outline-offset: 0;
  }

  .cardSelectCheckbox {
    width: 20px;
    height: 20px;
    margin: 0;
    cursor: pointer;
    accent-color: var(--MH-Theme-Danger-Dark, #8F1F14);
  }

  &.cardSelectAssociate .cardSelectCheckbox {
    accent-color: var(--MH-Theme-Primary-Dark, #336F8A);
  }

  .card-drag-handle {
    height: 100%;
    display: flex;
    flex: 1 0 0;
  }
  .deleteCardBtn {
    position: absolute;
    bottom: -12px;
    left: -5px;
    cursor: pointer;
    img {
      width: 20px;
      opacity: 0.1;
    }
    img:hover {
      opacity: 1;
    }
  }
  .card-information {
    display: flex;
    flex: 1 0 0;
    align-items: center;
    gap: 8px;
    min-height: 80px;
    padding: 0px 0px 0px 16px;

    .info-assigned-container {
      display: grid;
      justify-items: baseline;
      grid-gap: 5px;
    }
    .info-assigned {
      display: grid;
      align-items: center;
      color: #666666;
      background: #ffffff;
      border: 1px solid #e6e6e6;
      box-sizing: border-box;
      border-radius: 60px;
      font: var(--MH-Type-Label-Small, 600 12px/16px "Inter", sans-serif);
      letter-spacing: 0;
      padding: 1px 7px 1px 7px;
    }

    .card-left-side {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      img {
        width: 24px;
        height: 24px;
      }
    }
    .card-right-side {
      display: flex;
      flex: 1 0 0;
      flex-direction: column;
      margin: 0px;
      min-width: 0;
      .card-title {
        display: flex;
        flex: 1 0 0;
        font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
        letter-spacing: 0;
        color: #171717;
        min-width: 0;
        div {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
          max-width: 200px;
          width: 100%;
        }
      }
      .editedByAvatar {
        display: grid;
        align-content: end;
      }
    }
    /* The tag hangs in a Tooltip trigger, which shrink-wraps by default; it has
       to stretch so the tag can still span the card's full height. */
    .DesignSystem-Tooltip-trigger {
      align-self: stretch;
    }
    .card-feedback-tag {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      height: 100%;
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
      flex-shrink: 0;
      img {
        width: 24px;
        height: 24px;
      }
      &.feedback-non-submitted {
        background: #f9d978;
        border-left: 1px solid #a1a1a1;
      }
      &.feedback-submitted {
        background: #def8fb;
        border-left: 1px solid #a1a1a1;
      }
    }
  }
`;

export const StyledActionCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  border-radius: 12px;
  // box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  margin: 3px 10px;
  width: calc(100% - 20px);
  overflow: hidden;
  box-sizing: border-box;

  &.projectsBoardEditorProposal & {
    margin: 0;
    width: 100%;
    max-width: 100%;
  }

  &.cardSelectSelected {
    outline: 2px solid var(--MH-Theme-Danger-Dark, #8F1F14);
    outline-offset: 0;
  }

  &.actionCardAssociateActive {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);
    outline-offset: 0;
  }

  .cardSelectCheckbox {
    width: 20px;
    height: 20px;
    margin: 0;
    cursor: pointer;
    accent-color: var(--MH-Theme-Danger-Dark, #8F1F14);
  }

  background: ${(props) => {
    if (props.proposalBuildMode) return "#FFFFFF";
    if (props.variant === "ACTION_SUBMITTED") return "#def8fb";
    if (props.variant === "ACTION_NOT_SUBMITTED") return "#fdf2d0";
    return "#FFFFFF";
  }};

  border: ${(props) => {
    if (props.proposalBuildMode) return "1px solid #a1a1a1";
    if (props.variant === "ACTION_SUBMITTED") return "1px solid #336f8a";
    if (props.variant === "ACTION_NOT_SUBMITTED") return "1px solid #5d5763";
    return "1px solid #a1a1a1";
  }};

  .card-drag-handle {
    // height: 100%;
    display: flex;
    flex: 1 0 0;
  }

  .deleteCardBtn {
    position: absolute;
    bottom: -12px;
    left: -5px;
    cursor: pointer;
    img {
      width: 20px;
      opacity: 0.1;
    }
    img:hover {
      opacity: 1;
    }
  }

  .card-information {
    min-width: 350px;
    display: flex;
    flex: 1 0 0;
    align-items: stretch;

    .card-left-section {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 0px 16px 16px;
      border-top-left-radius: 12px;
      border-bottom-left-radius: 12px;
      background: ${(props) => {
        if (props.proposalBuildMode) return "transparent";
        if (props.variant === "ACTION_SUBMITTED") return "#def8fb";
        if (props.variant === "ACTION_NOT_SUBMITTED") return "#fdf2d0";
        return "transparent";
      }};
      flex-shrink: 0;
      img {
        width: 24px;
        height: 24px;
      }
      svg {
        width: 24px;
        height: 24px;
      }
    }

    .card-right-section {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 16px 16px 0px;
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
      background: ${(props) => {
        if (props.proposalBuildMode) return "transparent";
        if (props.variant === "ACTION_SUBMITTED") return "#def8fb";
        if (props.variant === "ACTION_NOT_SUBMITTED") return "#fdf2d0";
        return "transparent";
      }};
      flex-shrink: 0;
      svg {
        width: 24px;
        height: 24px;
      }
    }

    .card-content {
      display: flex;
      flex: 1 0 0;
      flex-direction: column;
      justify-content: center;
      padding: 16px;
      gap: 4px;

      .card-title {
        font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
        letter-spacing: 0;
        color: #171717;
      }

      .card-subtitle {
        font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
        letter-spacing: 0;
        color: #6a6a6a;
      }
    }
  }
`;
