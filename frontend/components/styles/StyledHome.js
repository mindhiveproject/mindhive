import styled from "styled-components";

const StyledHome = styled.div`
  display: grid;
  grid-gap: 1rem;

  .titleIcon {
    align-items: start;
  }

  .profileMetaStack {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }

  .profileMetaChips,
  .profileMetaIds {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    max-width: 280px;
  }

  .h36 {
    font: var(--MH-Type-Heading-Base, 600 36px/44px "Inter", sans-serif);
    letter-spacing: 0;
    text-align: left;
    color: var(--neutral_black1, #171717);
    margin-bottom: 16px;
  }
  .h32 {
    font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
    letter-spacing: 0;
    text-align: left;
    color: #171717;
    margin-bottom: 17px;
  }
  .h26 {
    font: var(--MH-Type-Heading-Small, 600 28px/36px "Inter", sans-serif);
    letter-spacing: 0;
    text-align: left;
    color: var(--neutral_grey2, #3b3b3b);
  }
  .p20 {
    font: var(--MH-Type-Body-Large, 400 22px/28px "Inter", sans-serif);
    letter-spacing: 0;
    text-align: left;
    color: #666666;
  }
  .p18 {
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    text-align: left;
    color: var(--neutral_grey2, #3b3b3b);
  }
  .createProfileAreaWrapper {
    display: grid;
    grid-gap: 4rem;
    margin: 7rem 0rem;
  }
  .createProfileArea {
    display: grid;
    grid-gap: 1rem;
    padding: 3.2rem;
    border-radius: 10px;
    background: var(--neutral_white, #fff);
    border: 1.5px solid #d9d9d9;
    :hover {
      border: 1.5px solid #d9d9d9;
      background: #ebf9f7;
    }
  }
`;

export default StyledHome;
