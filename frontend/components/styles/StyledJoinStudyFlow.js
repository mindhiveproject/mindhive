import styled from "styled-components";

export const StyledWrapper = styled.div`
  display: grid;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 30px;
  padding: 20px;
  color: var(--MH-Theme-Neutrals-Black, #171717);

  .header {
    display: grid;
    grid-gap: 20px;
    grid-template-columns: 1fr 12fr 1fr;
    align-items: center;
    padding-bottom: 20px;
    margin-bottom: 40px;
    border-bottom: 2px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Primary-Dark, #336f8a);

    .logo {
      display: grid;
      margin: 0 0;
    }

    .headerTitle {
      text-align: center;
    }

    .headerClose {
      display: flex;
      justify-content: flex-end;
    }
  }

  .main {
    margin: 0 auto;
    width: 100%;
  }

  h1 {
    margin: 0 0 12px;
    font: var(--MH-Type-Heading-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  h2 {
    margin: 0;
    font: var(--MH-Type-Title-Large);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  h3 {
    margin: 0 0 24px;
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  p {
    margin: 0 0 12px;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  input {
    max-width: 500px;
    width: 100%;
    margin-bottom: 1rem;
    height: 48px;
    border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
    border-radius: 4px;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    padding: 12px;
    box-sizing: border-box;
    color: var(--MH-Theme-Neutrals-Black, #171717);

    &:focus {
      outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
      outline-offset: 2px;
      border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    }
  }

  .checkboxField {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    display: grid;
    grid-gap: 10px;
    grid-template-columns: auto 1fr;
    align-items: center;
    margin: 8px 0 24px;
    color: var(--MH-Theme-Neutrals-Black, #171717);

    input {
      margin-bottom: 0;
      width: auto;
      height: auto;
      max-width: none;
    }
  }

  .buttonsHolder {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 20px;
  }

  .emailInput {
    width: 300px;
  }

  .questionTitle {
    font: var(--MH-Type-Title-Base);
    letter-spacing: 0;
    margin: 20px 0 8px;
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .pageIntro {
    margin: 0 0 24px;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
    width: 100%;
  }
`;

export const StyledSelector = styled.div`
  display: grid;

  .selectorHeader {
    margin: 0 0 2rem;
    text-align: center;
  }

  .selectorOptions {
    margin: 0;
    display: grid;
    grid-gap: 0;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    text-align: center;

    .option {
      display: grid;
      grid-template-rows: auto 1fr auto;
      grid-gap: 1rem;
      justify-items: center;
      padding: 1rem 2rem;

      p {
        color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
      }

      a {
        display: flex;
        justify-content: center;
        width: 100%;
        max-width: 280px;
      }

      .DesignSystem-Button {
        width: 100%;
      }
    }

    .borderLeft {
      border-left: 2px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    }

    .borderRight {
      border-right: 2px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    }
  }
`;

export const StyledDetails = styled.div`
  display: grid;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;

  .translation {
    margin: 8px 0 1.5rem;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
    width: 100%;
  }

  .actions a,
  .actions > div {
    width: 100%;
  }

  .actions .DesignSystem-Button {
    width: 100%;
  }
`;

export const StyledConsent = styled.div`
  display: grid;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;

  .consentContent {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    margin-bottom: 16px;

    h1 {
      font: var(--MH-Type-Heading-Small);
      letter-spacing: 0;
    }

    h2 {
      font: var(--MH-Type-Title-Large);
      letter-spacing: 0;
      margin: 16px 0 8px;
    }

    h3 {
      font: var(--MH-Type-Title-Base);
      letter-spacing: 0;
      margin: 16px 0 8px;
      color: var(--MH-Theme-Neutrals-Black, #171717);
    }

    p {
      margin-bottom: 12px;
    }
  }

  .consentInfo {
    margin: 16px 0 8px;
    padding-top: 8px;
    border-top: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);

    p {
      color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    }
  }

  .coveredStudiesAndTasks {
    margin: 0 0 16px;
    padding-left: 20px;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
    width: 100%;
  }

  .actions a,
  .actions > div {
    width: 100%;
  }

  .actions .DesignSystem-Button {
    width: 100%;
  }
`;

export const ResponseButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 8px 0 16px;
`;
