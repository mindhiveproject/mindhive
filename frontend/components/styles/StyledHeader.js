import styled from "styled-components";

export const StyledHeader = styled.header`
  display: grid;
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
  justify-self: center;
  grid-area: nav;
  .bar {
    display: grid;
    grid-template-columns: 200px auto 1fr;
    grid-gap: 1rem 4rem;
    align-items: center;
    width: 100%;
    margin-top: 33px;
    @media (max-width: 700px) {
      grid-template-columns: 1fr;
      justify-items: center;
    }
  }
  .sub-bar {
    display: grid;
    grid-template-columns: 1fr auto;
    border-bottom: 1px solid ${(props) => props.theme.lightgrey};
  }
  .links {
    display: grid;
    grid-gap: 2rem;
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

export const Logo = styled.div`
  display: grid;
  justify-items: start;
  cursor: pointer;
  .logo {
    display: grid;
    margin-left: 20px;
    grid-template-columns: 1fr;
    @media (max-width: 700px) {
      display: grid;
      justify-items: center;
    }
  }
  img {
    margin-right: 10px;
  }
  :hover {
    opacity: 0.6;
  }
`;

export const MainNavLink = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  cursor: pointer;
  font-family: Lato;
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
  letter-spacing: 0em;
  text-align: center;
  padding: 0rem 0rem 0.5rem 0rem;
  ${(props) => props.selected && `border-bottom: 3px solid #ffc107`};
`;
