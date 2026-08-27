import styled from "styled-components";

const StyledBoardSettings = styled.div`
  display: grid;
  gap: 28px;

  .boardSettingsSection {
    display: grid;
    gap: 14px;
    padding: 0;
  }

  .boardSettingsSection + .boardSettingsSection {
    padding-top: 28px;
    border-top: 1px solid #ece9e6;
  }

  .boardSettingsSectionTitle {
    margin: 0;
    font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    color: #171717;
  }

  .boardSettingsSectionDescription {
    margin: -6px 0 0;
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
    color: #625b71;
  }

  .boardSettingsPanel {
    display: grid;
    gap: 16px;
  }

  .boardSettingsBlockRow {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    .boardSettingsBlock:only-child {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 720px) {
    .boardSettingsBlockRow {
      grid-template-columns: 1fr;
    }
  }

  .boardSettingsBlock {
    display: grid;
    gap: 14px;
    padding: 20px;
    border: 1px solid #ece9e6;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 6px 18px rgba(23, 23, 23, 0.04);

    p {
      margin: 0;
    }
  }

  .settingsQuestion {
    font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    color: #171717;
  }

  .settingsChoiceGroup {
    display: grid;
    gap: 10px;

    label {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 48px;
      padding: 12px 14px;
      border: 1px solid #d9d6d2;
      border-radius: 14px;
      background: #f9faf9;
      color: #333333;
      cursor: pointer;
      font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
      letter-spacing: 0;
      transition: border-color 0.2s ease, background-color 0.2s ease,
        box-shadow 0.2s ease, color 0.2s ease;

      input {
        flex-shrink: 0;
        width: 17px;
        height: 17px;
        margin: 0;
        accent-color: var(--MH-Theme-Primary-Dark, #336f8a);
      }

      &:hover {
        border-color: rgba(51, 111, 138, 0.45);
        background: #f6f9f8;
      }

      &.active {
        border-color: var(--MH-Theme-Primary-Dark, #336f8a);
        background: rgba(51, 111, 138, 0.08);
        color: #265568;
        box-shadow: 0 8px 20px rgba(51, 111, 138, 0.14);
      }
    }
  }

  .curriculumTypeSelector {
    border: none;
    margin: 0;
    padding: 0;
  }

  .curriculumTypeLegend {
    font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    color: #171717;
    margin: 0 0 4px 0;
    padding: 0;
  }

  .curriculumTypeHelp {
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
    color: #625b71;
    margin: 0 0 16px 0;
  }

  .curriculumTypeOptions {
    display: grid;
    margin-top: 16px;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .curriculumTypeOption {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 16px;
    border: 1px solid #a1a1a1;
    border-radius: 16px;
    background: #ffffff;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;

    input {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      margin: 0;
      accent-color: var(--MH-Theme-Primary-Dark, #336f8a);
    }

    &:hover {
      background: #f6f9f8;
      border-color: rgba(51, 111, 138, 0.45);
    }

    &.curriculumTypeOptionSelected {
      border-color: var(--MH-Theme-Primary-Yellow, #f9d978);
      background: #fffaf0;
      box-shadow: 0 8px 20px rgba(242, 190, 66, 0.18);
    }
  }

  .curriculumTypeOptionContent {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .curriculumTypeLogo {
    width: min(200px, 100%);
    height: 42px;
    object-fit: contain;
  }

  .curriculumTypeLabel {
    font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
    color: #171717;
  }
`;

export default StyledBoardSettings;
