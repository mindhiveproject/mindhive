import styled from "styled-components";

export const StyledFeaturedStudies = styled.div`
  display: grid;
  grid-gap: 2rem;

  @media (max-width: 1200px) {
    padding: 0rem 2rem;
  }

  .featuredContainerWrapper {
    display: grid;
    grid-gap: 2rem;
  }

  .featuredContainer {
    display: grid;
    width: 100%;
    min-height: 400px;
  }

  .buttonsWrapper {
    display: grid;
    justify-content: center;
    width: 100%;
  }

  .buttons {
    display: grid;
    justify-content: center;
    margin: 1rem 0rem;
    grid-template-columns: repeat(auto-fit, 20px);
    grid-gap: 1rem;
    width: 300px;
    input[type="radio"] {
      cursor: pointer;
      display: inline-block;
      height: 20px;
      width: 20px;
      position: relative;
      -webkit-appearance: none;
      -webkit-transition: all 0.3s ease;
      -moz-transition: all 0.3s ease;
      -o-transition: all 0.3s ease;
      -ms-transition: all 0.3s ease;
      border-radius: 20px;
      background-color: white;
      border: 1px solid #117c70;
      outline: none;
    }
    input[type='radio']: checked {
      background-color: #117c70;
    }
  }

  .card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 3rem;
    width: 100%;
    height: 100%;

    .cardInfo {
      display: grid;
      grid-template-rows: 1fr auto;
      grid-gap: 1rem;
      align-content: baseline;
      grid-gap: 2rem;
      height: 100%;

      .cardMain {
        display: grid;
        grid-gap: 2rem;
        align-content: baseline;
        .studyFeatured {
          display: grid;
          font-family: Lato;
          font-weight: bold;
          font-size: 10px;
          line-height: 0px;
          color: #666666;
          letter-spacing: 0.2rem;
          text-transform: uppercase;
        }
      }

      .studyLink {
        display: grid;
        width: fit-content;
        button {
          min-height: 56px;
          padding: 10px 24px 10px 24px;
          background: white;
          border: 2px solid #007c70;
          box-sizing: border-box;
          border-radius: 4px;
          color: #007c70;
          cursor: pointer;
          font-family: "Lato";
        }
      }
    }

    .studyImage {
      .noImage {
        width: 100%;
        height: 100%;
        background: lightgrey;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    a {
      cursor: pointer;
      font-family: Lato;
      font-size: 18px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
      letter-spacing: 0em;
      text-align: left;
      color: #007c70;
    }

    p {
      font-family: Roboto;
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: 20px;
      letter-spacing: 0em;
      text-align: left;
    }

    h1 {
      font-family: Lato;
      font-size: 48px;
      font-style: normal;
      font-weight: 400;
      line-height: 56px;
      letter-spacing: 0em;
      text-align: left;
      color: #1a1a1a;
    }

    h2 {
      font-family: Lato;
      font-style: normal;
      font-weight: normal;
      font-size: 24px;
      line-height: 30px;
      color: #1a1a1a;
    }
  }
`;
