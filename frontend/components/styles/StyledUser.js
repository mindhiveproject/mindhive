import styled from "styled-components";

export const StyledUserPage = styled.div`
  display: grid;
  max-width: var(--maxWidth);
  width: 100%;
  justify-self: center;

  grid-template-columns: 1fr;
  grid-gap: 5rem;
  align-items: baseline;

  border-radius: 20px;
  background: var(--neutral_white, #fff);
  box-shadow: 0px 4px 75px 0px rgba(0, 0, 0, 0.1);
  padding: 62px 40px 60px 40px;

  .profile {
    display: grid;
    grid-template-columns: 1fr;
    grid-gap: 1rem;
    justify-items: start;
    align-content: baseline;

    @media only screen and (max-width: 800px) {
      grid-template-columns: 1fr;
      justify-items: center;
    }

    .profileContainer {
      display: grid;
      grid-gap: 2rem;
      padding: 1rem;
      .firstLine {
        display: grid;
        grid-gap: 2rem;
        grid-template-columns: 3fr 1fr;
        align-items: center;
        @media only screen and (max-width: 500px) {
          grid-template-columns: 1fr;
          justify-items: center;
        }
        .avatar {
          cursor: pointer;
        }
        .snsLinks {
          padding: 0.5rem 0rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
          align-items: center;
        }
        .websiteInfo {
          display: grid;
          grid-gap: 1rem;
          grid-template-columns: auto 1fr;
        }
      }
      .secondLine {
        display: grid;
        grid-template-columns: 1fr auto;

        @media only screen and (max-width: 500px) {
          grid-template-columns: 1fr;
        }

        .username {
          h1 {
            font-size: 3rem;
            font-weight: 500;
          }
        }
      }
      .thirdLine {
        display: grid;
        grid-gap: 1rem;
        grid-template-columns: repeat(5, auto);
        color: var(--lightBlack);
        justify-content: space-between;
        @media only screen and (max-width: 500px) {
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        }
      }
      .fourthLine {
        display: grid;
        grid-gap: 1rem;
        grid-template-columns: repeat(3, 1fr);
        justify-content: stretch;
        width: 100%;
        height: 100%;

        @media only screen and (max-width: 500px) {
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        }

        button {
          min-width: 150px;
          width: 100%;
          border-radius: 12px;
          height: auto;
          font-size: 1.8rem;
          padding: 1rem;
          background: white;
          color: var(--green);
          border: 2px solid var(--green);
        }
        button: hover {
          transition: background-color 0.5s ease;
          background: var(--green);
          color: white;
        }
        .followed: hover {
          transition: background-color 0.5s ease;
          background: var(--pink);
          color: white;
        }
      }
    }
    .bioContainer {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      grid-gap: 10rem;
      padding: 1rem;
      .bio {
        overflow-y: auto;
        max-height: 200px;
      }
      .wallet {
        display: grid;
        .walletAddress {
          color: var(--darkGreen);
        }
      }
    }
  }

  .display {
    display: grid;

    .headerArtistMenu {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      justify-items: center;
      justify-content: stretch;
      width: 100%;

      @media only screen and (max-width: 800px) {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }

      a {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 1.5em;
        color: var(--green);
      }

      .item {
        width: 100%;
        display: grid;
        justify-content: center;
        border-bottom: 10px solid #4ca1997d;
        border-radius: 0px;
      }

      .active {
        background: none !important;
        border-bottom: 10px solid var(--green);
        border-radius: 0px !important;
        a {
          color: black;
        }
      }
      .active:hover {
        background: none !important;
      }
    }

    .headerCollectorMenu {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      justify-items: center;
      justify-content: stretch;
      width: 100%;

      @media only screen and (max-width: 800px) {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }

      a {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 1.5em;
        color: var(--green);
      }

      .item {
        width: 100%;
        display: grid;
        justify-content: center;
        border-bottom: 10px solid #4ca1997d;
        border-radius: 0px;
      }

      .active {
        background: none !important;
        border-bottom: 10px solid var(--green);
        border-radius: 0px !important;
        a {
          color: black;
        }
      }
      .active:hover {
        background: none !important;
      }
    }

    .headerPublicArtistMenu {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      justify-items: center;
      justify-content: stretch;
      width: 100%;

      @media only screen and (max-width: 800px) {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }

      a {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 1.5em;
        color: var(--green);
        cursor: pointer;
      }

      .item {
        width: 100%;
        display: grid;
        justify-content: center;
        border-bottom: 10px solid #4ca1997d;
        border-radius: 0px;
      }

      .active {
        background: none !important;
        border-bottom: 10px solid var(--green);
        border-radius: 0px !important;
        a {
          color: black;
        }
      }
      .active:hover {
        background: none !important;
      }
    }
  }
`;
