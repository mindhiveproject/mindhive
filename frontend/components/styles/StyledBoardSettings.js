import styled from "styled-components";

const StyledBoardSettings = styled.div`
  display: grid;
  gap: 28px;

  .boardSettingsSection {
    display: grid;
    gap: 14px;
    padding: 0;
  }

  .boardSettingsSectionTitle {
    margin: 0;
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
    color: #171717;
  }

  .boardSettingsSectionDescription {
    margin: -6px 0 0;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: #625b71;
  }

  .boardSettingsPanel {
    display: grid;
    gap: 16px;
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
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
    color: #171717;
  }

  .boardSettingsConfirm {
    display: grid;
    gap: 12px;
    padding: 14px;
    border: 1px solid var(--MH-Theme-Warning-Light, #edcecd);
    border-radius: 12px;
    background: #fdf6f5;

    p {
      margin: 0;
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
      color: #171717;
    }
  }

  .boardSettingsConfirmActions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .curriculumTypeSelector {
    border: none;
    margin: 0;
    padding: 0;
  }

  .curriculumTypeHelp {
    font: var(--MH-Type-Body-Base);
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
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: #171717;
  }
`;

export default StyledBoardSettings;
