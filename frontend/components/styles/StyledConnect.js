import styled from "styled-components";

const StyledConnect = styled.div`
  display: grid;
  grid-gap: 3rem;
  .navigation {
    display: grid;
    justify-items: end;
    button {
      border-radius: 5px;
      border: 1.5px solid var(--Button-Green, #347a70);
      background: var(--neutral_white, #fff);
      color: #007c70;
    }
  }
  .header {
    display: grid;
    grid-template-columns: 1fr;
    justify-items: center;
    .title {
      color: var(--neutral_black1, #171717);

      /* H1 */
      font-family: Lato;
      font-size: 60px;
      font-style: normal;
      font-weight: 600;
      line-height: 41px; /* 68.333% */
    }
    .subtitle {
      color: #666;
      text-align: center;

      /* H3 */
      font-family: Lato;
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      line-height: 32px; /* 133.333% */
    }
  }
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 48px;
    margin-top: 95px;
  }
  .card {
    display: grid;
    justify-items: center;
    width: 306px;
    height: 393px;
    border-radius: 30px;
    background: var(--neutral_white, #fff);
    box-shadow: 0px 4px 75px 0px rgba(0, 0, 0, 0.1);
    padding: 3rem;
    text-align: center;
    .avatar {
      img {
        height: 75px;
      }
    }
    .name {
      color: var(--neutral_black1, #171717);
      text-align: center;
      /* H3 */
      font-family: Lato;
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      line-height: 32px; /* 133.333% */
    }
    .location {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-gap: 4px;
      justify-items: center;
      color: var(--neutral_grey2, #3b3b3b);
      /* SMALL_TEXT */
      font-family: Lato;
      font-size: 11px;
      font-style: normal;
      font-weight: 400;
      line-height: 13px; /* 118.182% */
    }
    .interest {
      display: inline-flex;
      padding: 6px 17px;
      justify-content: center;
      align-items: center;
      gap: 10px;
      border-radius: 12.5px;
      border: 1px solid var(--PRIMARY_GREEN2, #00635a);
      background: #f7fffa;
    }
    .bio {
      color: #252525;
      text-align: center;

      /* SMALL_TEXT */
      font-family: Lato;
      font-size: 11px;
      font-style: normal;
      font-weight: 400;
      line-height: 13px; /* 118.182% */
    }
    button {
      width: 118px;
      padding: 8px 12px;
      border-radius: 29px;
      background: var(--PRIMARY_GREEN2, #00635a);
    }
  }
`;

export default StyledConnect;
