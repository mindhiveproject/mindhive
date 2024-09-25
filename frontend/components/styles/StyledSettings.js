import styled from "styled-components";

const StyledSettings = styled.div`
  display: grid;
  h3 {
    //styleName: H3;
    font-family: Lato;
    font-size: 24px;
    font-weight: 400;
    line-height: 32px;
    text-align: left;
  }

  .quickLinks {
    display: grid;
    grid-gap: 24px;
    margin: 6rem 11rem;

    .links {
      background: #ffffff;
      border: 1px solid var(--neutral_grey3, #c9d6cd);
      border-radius: 10px;
      .divider {
        margin: 0rem 24px;
      }
    }
    .link {
      margin: 20px;
      padding: 14px;
      display: grid;
      grid-template-columns: 50px 1fr auto;
      align-items: center;
      justify-items: baseline;
      /* border-bottom: 1px solid var(--neutral_grey3, #c9d6cd); */
      .content {
        display: grid;
        grid-gap: 8px;
      }
    }
    .link: hover {
      cursor: pointer;
      border-radius: 10px;
      background: #eff1f080;
    }
  }

  .content {
    display: grid;
    grid-gap: 16px;
    max-width: 500px;
  }

  .buttons {
    display: grid;
    width: 100%;
    grid-gap: 32px;
    grid-template-columns: 1fr 1fr;
    margin-top: 24px;
    button {
      width: 100%;
    }
    .back {
      background: #ffffff;
      color: var(--Button-Green, #347a70);
    }
    .consentButtonBack {
      display: grid;
      justify-self: end;
    }
  }

  .p24 {
    //styleName: Form Text Top Header Type;
    font-family: Lato;
    font-size: 24px;
    font-weight: 600;
    line-height: 32px;
    text-align: left;
    color: #000000;
  }

  .p24-thin {
    //styleName: Form Text Top Header Type;
    font-family: Lato;
    font-size: 24px;
    font-weight: 400;
    line-height: 32px;
    text-align: left;
    color: #000000;
  }

  .p18 {
    font-family: Lato;
    font-size: 18px;
    font-weight: 600;
    line-height: 20px;
    text-align: left;
    color: var(--neutral_black1, #171717);
  }
`;

export default StyledSettings;
