import styled from "styled-components";

export const StyledDocumentPage = styled.div`
  display: grid;
  max-width: 1200px;
  margin: 2rem auto;
  padding: 3rem;
  min-height: 800px;

  p,
  li {
    font-family: Lato;
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    color: #666666;
  }

  h1 {
    font-family: Lato;
    font-style: normal;
    font-weight: 400;
    font-size: 48px;
    line-height: 56px;
    color: #1a1a1a;
  }

  h2 {
    font-family: Lato;
    font-style: normal;
    font-weight: 400;
    font-size: 24px;
    line-height: 32px;
    color: #1a1a1a;
  }

  h3 {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
    line-height: 32px;
    color: #1a1a1a;
  }

  a {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 22px;
    text-decoration-line: underline;
    color: #007c70;
  }

  .contents {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(11, 1fr);
    grid-column-gap: 30px;
    @media (max-width: 600px) {
      width: 300px;
      display: grid;
      grid-auto-flow: row;
      grid-template-columns: 1fr;
      justify-content: center;
    }
  }
`;

export const StyledTeachersInfo = styled.div`
  display: grid;
  grid-gap: 5rem;
  width: 100%;
  margin: 5rem 0rem;

  .white {
    display: grid;
    grid-gap: 3rem;
    width: 100%;
    max-width: 1200px;
    justify-self: center;
    margin: 5rem 0rem;
  }
  .greyOuter {
    display: grid;
    width: 100%;
    background: #f6f9f8;
  }
  .greyInner {
    display: grid;
    width: 100%;
    max-width: 1200px;
    justify-self: center;
    margin: 5rem 0rem;
  }
  .videoWrapper {
    display: grid;
    align-content: center;
  }
  .doubled {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 3rem;
  }
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 2rem;
    .card {
      display: grid;
      border-radius: 10px;
      grid-template-rows: 40px 1fr;

      .cardHeader {
        padding: 1rem 5rem 0rem 5rem;
      }
      .innerCard {
        display: grid;
        grid-gap: 5rem;
        padding: 7rem 5rem;
        margin: 1rem 0rem 2rem 0rem;
      }
    }
    .sky {
      background: #b1e4f1;
      .innerCard {
        background: #ecf8fb;
      }
    }
    .pine {
      background: #99cbc6;
      .innerCard {
        background: #e6f2f1;
      }
    }
    .yellow {
      background: #ffe69c;
      .innerCard {
        background: #fff9e6;
      }
    }
  }

  h1 {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 48px;
    line-height: 56px;
    color: #1a1a1a;
  }
  h2 {
    font-family: Roboto;
    font-style: normal;
    font-weight: normal;
    font-size: 36px;
    line-height: 42px;
    color: #1a1a1a;
  }
  h3 {
    font-family: Lato;
    font-style: normal;
    font-weight: bold;
    font-size: 14px;
    line-height: 32px;
    letter-spacing: 0.3em;
    color: #1a1a1a;
  }
  h4 {
    font-family: Lato;
    font-style: normal;
    font-weight: bold;
    font-size: 14px;
    line-height: 32px;
    letter-spacing: 0.3em;
    color: #1a1a1a;
  }
  h5 {
    font-family: Roboto;
    font-style: normal;
    font-weight: bold;
    font-size: 24px;
    line-height: 28px;
    color: #1a1a1a;
  }
  p {
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 24px;
    color: #666666;
  }
  .centered {
    text-align: center;
  }
  button {
    font-family: Lato;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: 0.05em;
    text-align: center;
    background: white;
    color: #007c70;
    padding: 19px 24px 19px 24px;
    border-radius: 4px;
    cursor: pointer;
  }
  .primary {
    border: 2px solid #007c70;
  }
  .secondary {
    border: 0px solid white;
  }
  .stretchedBlockForTwo {
    display: grid;
    grid-template-rows: 1fr auto;
  }
  a {
    text-decoration-line: underline;
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 24px;
    color: #666666;
  }
  .underscored {
    text-decoration-line: underline;
  }
`;

export const StyledProgram = styled.div`
  .title {
    background: #ecf8fb !important;
    box-shadow: 0px 5px 6px 0px #00000014;
    transition: box-shadow 300ms ease-out !important;
    :hover {
      background: #ecf8fb !important;
      box-shadow: 0px 2px 24px 0px #0000001a;
    }

    padding: 1rem 2rem !important;
    display: grid;
    grid-gap: 2rem;
    grid-template-columns: 10px auto auto;
    justify-content: start;

    .number {
      color: #3dbbdb;
    }
    .text {
      color: #1a1a1a;
    }
    .duration {
      color: #666666;
      font-weight: normal;
    }
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    line-height: 48px;
  }
  .content {
    background: #ecf8fb;
    padding: 3rem 4rem !important;
  }
  .theclass {
    display: grid;
    grid-gap: 0.5rem;
    margin: 1rem 0rem 4rem 0rem;
    .classBlock {
      display: grid;
      grid-template-columns: 30px 1fr;
      grid-gap: 1rem !important;
      background: white;
      border-radius: 8px;
      padding: 2rem 2rem;
      align-items: center !important;
      img {
        height: 24px;
        width: 24px;
      }
    }
  }
  h3 {
    font-family: Lato;
    font-size: 18px;
    font-style: normal;
    font-weight: 700;
    line-height: 22px;
    letter-spacing: 0em;
    text-align: left;
  }
  h4 {
    font-family: Lato;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
    line-height: 14px;
    letter-spacing: 0.3em;
    text-align: left;
    color: #666666;
  }
`;
