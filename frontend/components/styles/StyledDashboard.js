import styled from "styled-components";

export const StyledDashboard = styled.div`
  display: grid;
  grid-template-columns: 225px auto;
  grid-gap: 10px;
  width: 100%;
  height: 100vh;
  background: #f6f9f8;
`;

export const StyledDashboardContent = styled.div`
  display: grid;
  margin: 50px;
  max-width: 1300px;
  grid-gap: 20px;
  align-content: start;

  .header {
    display: grid;
    grid-gap: 2rem;
    grid-template-columns: 1fr 1fr;
    .idInfo {
      display: grid;
      grid-gap: 1rem;
    }
  }

  .code {
    background: white;
    padding: 1rem;
    border-radius: 5px;
  }

  .updatesBoard {
    display: grid;
    margin-top: 40px;
  }

  .updates {
    margin-top: 30px;
    display: grid;
    grid-row-gap: 25px;
  }

  .dropdown {
    display: grid;
    justify-content: end;
    p {
      font-size: 16px;
    }
  }
`;

export const StyledDashboardNavigation = styled.div`
  display: grid;
  background: white;
  height: 100%;
  grid-template-columns: 1fr;
  grid-gap: 40px;
  justify-items: left;
  align-content: start;
  padding: 50px 0 40px 17px;

  .navLinks {
    display: grid;
    align-items: center;
    grid-row-gap: 40px;
    padding-bottom: 40px;
    border-bottom: 1px solid #e6e6e6;
  }

  .navBottomLinks {
    display: grid;
    align-items: center;
    grid-row-gap: 31px;
  }

  .workspaceHeader {
    font-family: Lato;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
    line-height: 14px;
    letter-spacing: 0em;
    text-align: left;
    color: #b3b3b3;
    margin-top: 7px;
  }

  .headerWithUpdateCounter {
    display: grid;
    grid-template-columns: 1fr auto;
    .updateCounter {
      display: grid;
      align-items: center;
      background: red;
      color: white;
      font-size: 16px;
      font-weight: bold;
      padding: 0px 12px;
      border: 0;
      border-radius: 20px;
    }
  }
`;

export const StyledNavigationLink = styled.div`
  display: grid;
  grid-template-columns: 20px auto;
  grid-column-gap: 12px;
  cursor: pointer;
  font-family: Lato;
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
  letter-spacing: 0em;
  text-align: left;
  padding-right: 1rem;
  ${(props) => props.selected && `border-right: 3px solid #ffc107`};
  :hover {
    opacity: 0.6;
  }
`;
