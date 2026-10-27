import styled from "styled-components";

export const StyledConsent = styled.div`
  display: grid;
  grid-gap: 2rem;
  min-width: 0;

  .header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  /* Protocol lists (same look as the student classes list) */
  .consentListHeader,
  .consentListRow {
    display: grid;
    grid-template-columns:
      minmax(10rem, 2fr)
      minmax(8rem, 2fr)
      minmax(5rem, 1fr)
      minmax(7rem, 1fr);
    column-gap: 16px;
    align-items: center;
  }

  .consentListHeader.hasActions,
  .consentListRow.hasActions {
    grid-template-columns: minmax(10rem, 3fr) minmax(5rem, 1fr);
  }

  .consentListHeader.hasAction,
  .consentListRow.hasAction {
    grid-template-columns:
      minmax(10rem, 2fr)
      minmax(8rem, 2fr)
      minmax(7rem, 1fr)
      8.5rem;
  }

  .consentListContainer {
    background-color: var(--MH-Theme-Neutrals-White, #ffffff);
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 12px;
    padding: 8px 8px 16px;
  }

  .consentListHeader {
    margin: 0;
    padding: 12px 16px 8px;
    font: var(--MH-Type-Label-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .consentListBoard {
    display: grid;
    gap: 12px;
    margin-top: 8px;
  }

  .consentListBoard > a {
    display: block;
    color: inherit;
    text-decoration: none;
    border-radius: 8px;
  }

  .consentListBoard > a:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }

  .consentListRow {
    padding: 18px 16px;
    border-radius: 8px;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .consentListRow.hasActions {
    position: relative;
    transition: background-color 180ms ease-out;

    &:hover {
      background-color: var(--MH-Theme-Primary-Light, #def8fb);
    }
  }

  .consentListRowLink {
    color: inherit;
    text-decoration: none;
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 8px;
    }
    &:focus-visible {
      outline: none;
      &::after {
        outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
        outline-offset: 2px;
      }
    }
  }

  .consentListRow.hasActions > .consentListRowAction {
    position: relative;
    z-index: 1;
  }

  .consentListRow.hasAction {
    cursor: pointer;
    transition: background-color 180ms ease-out;

    &:hover {
      background-color: var(--MH-Theme-Primary-Light, #def8fb);
    }
  }

  .consentListRow > div {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .consentListRowTitle a {
    color: inherit;
    text-decoration: none;
  }

  .consentListRowMeta {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .consentListRow > .consentListRowAction {
    overflow: visible;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .consentListEmpty {
    padding: 8px 0 16px;
    max-width: 36rem;
  }

  .consentListEmpty h3 {
    margin: 0 0 8px;
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
  }

  .consentListEmpty p {
    margin: 0;
    font: var(--MH-Type-Body-Base);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .consentListLoading {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .consentListError {
    color: var(--MH-Theme-Danger-Dark, #8f1f14);
    max-width: 36rem;
  }

  @media (max-width: 720px) {
    .consentListHeader,
    .consentListRow {
      grid-template-columns: minmax(0, 1fr) minmax(6rem, auto);
    }
    .consentListHeader.hasActions,
    .consentListRow.hasActions {
      grid-template-columns: minmax(0, 1fr) 6.5rem;
    }
    .consentListHeader.hasAction,
    .consentListRow.hasAction {
      grid-template-columns: minmax(0, 1fr) 8.5rem;
    }
    /* keep title + action buttons */
    .consentListHeader.hasActions > :nth-child(2),
    .consentListRow.hasActions > :nth-child(2),
    .consentListHeader.hasAction > :nth-child(2),
    .consentListHeader.hasAction > :nth-child(3),
    .consentListRow.hasAction > :nth-child(2),
    .consentListRow.hasAction > :nth-child(3) {
      display: none;
    }
  }

  /* Protocol editor (Figma node 10:359) */
  .consentEditor {
    display: grid;
    gap: 20px;
    min-width: 0;
  }

  /* sticky so Save / Create stays reachable while scrolling */
  .consentEditorHeader {
    position: sticky;
    top: 0;
    z-index: 5;
    padding: 12px 0;
    margin: -12px 0;
    background: #f6f9f8; /* dashboard background */
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px 24px;
    h1 {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0 0 0 -8px;
      min-width: 0;
      font: var(--MH-Type-Heading-Small);
      letter-spacing: 0;
      color: var(--MH-Theme-Neutrals-Black, #171717);
      overflow-wrap: anywhere;
    }
  }

  .consentHeaderActions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .consentSavedNotice {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Success-Dark, #1d6b3a);
    animation: consentSavedFade 2.5s ease-out forwards;
  }

  @keyframes consentSavedFade {
    0%,
    75% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .consentFormTabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    overflow-x: auto;
    scrollbar-width: thin;

    button {
      flex: none;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px 9px;
      border: none;
      border-bottom: 3px solid transparent;
      background: transparent;
      font: var(--MH-Type-Label-Base);
      font-weight: 400;
      letter-spacing: 0;
      white-space: nowrap;
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
      cursor: pointer;
      &:hover {
        color: var(--MH-Theme-Neutrals-Black, #171717);
      }
      &.selected {
        font-weight: 500;
        color: var(--MH-Theme-Neutrals-Black, #171717);
        border-bottom-color: var(--MH-Theme-Primary-Dark, #336f8a);
      }
      &:focus-visible {
        outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
        outline-offset: -2px;
      }
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--MH-Theme-Accent-Base, #f2be42);
      &.complete {
        background: var(--MH-Theme-Success-Dark, #1d6b3a);
      }
    }
  }

  .consentEditorBody {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    grid-template-areas:
      "sections checklist"
      "sections review"
      "sections .";
    grid-template-rows: auto auto 1fr;
    gap: 16px 24px;
    align-items: start;
  }

  .consentSections {
    grid-area: sections;
    display: grid;
    gap: 12px;
    min-width: 0;
  }

  .consentSectionCard {
    display: grid;
    gap: 8px;
    padding: 16px 20px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 12px;
    min-width: 0;
  }

  .consentSectionLabel {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .consentSectionHint {
    margin: 0;
    font: var(--MH-Type-Body-Small);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .consentSectionCard .DesignSystem-Input {
    height: auto;
    min-height: 64px;
    padding: 10px 12px;
    border-color: var(--MH-Theme-Neutrals-Light, #e6e6e6);
    background: #fbfaf7;
    font-size: 14px;
    line-height: 20px;
    resize: vertical;
    field-sizing: content;
  }

  .consentSideCard {
    display: grid;
    gap: 12px;
    padding: 24px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 12px;
    min-width: 0;
    h2 {
      margin: 0;
      font: var(--MH-Type-Title-Base);
      letter-spacing: 0;
      color: var(--MH-Theme-Neutrals-Black, #171717);
    }
  }

  .consentChecklistCard {
    grid-area: checklist;
    ul {
      display: grid;
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      gap: 10px;
      font: var(--MH-Type-Body-Small);
      font-size: 14px;
      line-height: 20px;
      color: var(--MH-Theme-Neutrals-Black, #171717);
      > span:first-child {
        flex: none;
        font-weight: 500;
      }
      &.done > span:first-child {
        color: var(--MH-Theme-Success-Dark, #1d6b3a);
      }
      &.missing {
        color: var(--MH-Theme-Error, #b3261e);
      }
    }
  }

  .consentChecklistCount {
    margin: 0;
    font: var(--MH-Type-Body-Small);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .consentFormCollaborators {
    display: grid;
    gap: 8px;
  }

  .consentFormClass {
    display: grid;
    gap: 6px;
    font: var(--MH-Type-Body-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .consentReviewCard {
    grid-area: review;
    gap: 8px;
    p {
      margin: 0;
      font: var(--MH-Type-Body-Small);
      letter-spacing: 0;
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    }
    .statusBadge {
      justify-self: start;
      align-self: start;
    }
  }

  .consentReviewNote {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 8px 12px;
    border-left: 3px solid var(--MH-Theme-Accent-Base, #f2be42);
    border-radius: 4px;
    background: var(--MH-Theme-Accent-Light, #fdf2d0);
    font: var(--MH-Type-Body-Small);
    color: var(--MH-Theme-Neutrals-Black, #171717);
    white-space: pre-wrap;
    cite {
      font-style: normal;
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    }
  }

  .consentEditorBody.noSide {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: "sections";
    grid-template-rows: none;
    max-width: 880px;
  }

  .consentSectionText {
    margin: 0;
    font: var(--MH-Type-Body-Base);
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    &.empty {
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
      font-style: italic;
    }
  }

  h3.consentSectionLabel {
    margin: 0;
  }

  .consentReviewReopen {
    display: grid;
    gap: 12px;
  }

  @media (max-width: 1000px) {
    .consentEditorBody {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "checklist"
        "review"
        "sections";
      grid-template-rows: none;
    }
  }

  @media (max-width: 480px) {
    .consentSectionCard,
    .consentSideCard {
      padding: 16px;
    }
    .consentHeaderActions {
      width: 100%;
      > * {
        flex: 1;
      }
    }
  }
  /* Consent & eligibility settings (Figma node 9:336) */
  .consentSettings {
    display: grid;
    gap: 20px;
    min-width: 0;
    max-width: 960px;
  }

  .consentSettingsIntro {
    margin: 0;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: #5f6871;
  }

  .consentSettingsCard {
    display: grid;
    gap: 16px;
    padding: 24px 28px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 12px;
    min-width: 0;
    h2 {
      margin: 0;
      font: var(--MH-Type-Title-Base);
      letter-spacing: 0;
      color: var(--MH-Theme-Neutrals-Black, #171717);
    }
  }

  .consentSettingsCardHeader {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .consentSettingsNote {
    margin: 0;
    font: var(--MH-Type-Body-Small);
    letter-spacing: 0;
    color: #5e6970;
  }

  .consentGroupList {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      margin-left: -14px;
    }
  }

  .consentGroupText {
    display: grid;
    gap: 2px;
    min-width: 0;
    cursor: pointer;
  }

  .consentFormStatus {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 10px;
    overflow: hidden;

    li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
      &:last-child {
        border-bottom: none;
      }
      > div {
        display: grid;
        gap: 2px;
        flex: 1 1 14rem;
        min-width: 0;
      }
    }
  }

  .consentFormStatusName {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .consentFormStatusHint {
    font: var(--MH-Type-Body-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .consentFormStatusEdit {
    font: var(--MH-Type-Label-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Primary-Dark, #336f8a);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
    &.disabled {
      color: var(--MH-Theme-Neutrals-Medium, #a1a1a1);
      text-decoration: none;
      cursor: not-allowed;
    }
  }

  .statusBadge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px 4px 10px;
    border-radius: 100px;
    font: var(--MH-Type-Label-Small);
    letter-spacing: 0;
    white-space: nowrap;
    background: var(--MH-Theme-Accent-Light, #fdf2d0);
    color: var(--MH-Theme-Neutrals-Black, #171717);
    &::before {
      content: "";
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    &.ready {
      background: #e3f4ec;
      color: var(--MH-Theme-Success-Dark, #1d6b3a);
    }
  }

  .consentSettingRow {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    > div:first-child {
      display: grid;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }
    p {
      margin: 0;
      font: var(--MH-Type-Body-Base);
      font-size: 14px;
      line-height: 20px;
      color: #5f6871;
    }
    .consentSettingTitle {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .consentSettingTitle h2 {
      font: var(--MH-Type-Label-Base);
    }
  }

  .consentSettingSelects {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    label {
      display: grid;
      gap: 6px;
      flex: 0 1 260px;
      min-width: 200px;
      font: var(--MH-Type-Label-Base);
      letter-spacing: 0;
      color: var(--MH-Theme-Neutrals-Black, #171717);
    }
  }

  @media (max-width: 600px) {
    .consentSettingsCard {
      padding: 16px;
    }
    .consentSettingRow {
      flex-direction: column;
    }
    .consentSettingSelects label {
      flex: 1 1 100%;
    }
  }
`;

export default StyledConsent;
