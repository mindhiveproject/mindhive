import styled from "styled-components";

const StyledHome = styled.div`
  display: grid;
  .h36 {
    font-family: Lato;
    font-size: 36px;
    font-weight: 700;
    line-height: 45px;
    text-align: left;
    color: var(--neutral_black1, #171717);
    margin-bottom: 16px;
  }
  .h32 {
    font-family: Lato;
    font-size: 24px;
    font-weight: 600;
    line-height: 32px;
    text-align: left;
    color: #171717;
    margin-bottom: 17px;
  }
  .h26 {
    font-family: Lato;
    font-size: 26px;
    font-weight: 600;
    line-height: 32px;
    text-align: left;
    color: var(--neutral_grey2, #3b3b3b);
  }
  .p20 {
    font-family: Lato;
    font-size: 20px;
    font-weight: 400;
    line-height: 32px;
    text-align: left;
    color: #666666;
  }
  .p18 {
    font-family: Lato;
    font-size: 18px;
    font-weight: 400;
    line-height: 22.5px;
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

  .updatesBoard {
    display: grid;
    margin-bottom: 56px;
    .updates {
      display: grid;
      margin-top: 30px;
      grid-row-gap: 32px;
    }
  }
`;

export default StyledHome;
