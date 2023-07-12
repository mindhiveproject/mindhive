import styled from "styled-components";

export const StyledSidebar = styled.div`
  display: grid;
  margin-top: 33px;
  /* grid-template-rows: 100px 4fr 1fr; */
  grid-template-columns: 1fr;
  grid-gap: 40px;
  justify-items: left;
  align-content: start;
  padding: 17px 0 40px 17px;

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
`;

export const NavLink = styled.div`
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

export const NavStyles = styled.ul`
  margin: 0;
  padding: 0;
  display: grid;
  width: 100%;
  font-size: 2rem;
  align-items: center;
  .openMenuBtn {
    cursor: pointer;
    color: #666666;
    font-family: Lato;
    font-size: 24px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0em;
    padding-right: 2rem;
  }
`;

export const NavRightContainer = styled.div`
  display: grid;
  grid-column-gap: 6px;
  justify-content: end;
  @media (max-width: 700px) {
    justify-content: center;
  }
  .menuLinks {
    display: grid;
    grid-template-columns: auto auto;
  }
`;

export const NavButton = styled.button`
  margin: 6px;
  height: 56px;
  font-size: 18px;
  line-height: 100%;
  letter-spacing: 0.05em;
  color: #007c70;
  border: 2px solid #007c70;
  cursor: pointer;
  border-radius: 4px;
  padding: 14px 24px 14px 24px;
  background: none;
  align-items: center;
`;

export const NavButtonSecondary = styled.button`
  margin: 6px;
  height: 56px;
  font-size: 18px;
  line-height: 100%;
  letter-spacing: 0.05em;
  color: #ffffff;
  border: 2px solid #007c70;
  cursor: pointer;
  border-radius: 4px;
  padding: 1rem 3rem;
  background: #007c70;
  align-items: center;
`;

export const SignoutButton = styled.button`
  width: 150px;
  font-size: 18px;
  line-height: 100%;
  letter-spacing: 0.05em;
  color: #007c70;
  border: 2px solid #007c70;
  cursor: pointer;
  border-radius: 4px;
  padding: 14px 24px 14px 24px;
  background: none;
  align-items: center;
  margin-top: 8px;
  :hover {
    opacity: 0.6;
  }
`;

export const MenuModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 10;
  background: white;
  overflow: auto;
  .menuWrapper {
    display: grid;
    justify-content: center;
    width: 100%;
  }
  .menu {
    min-width: 300px;
  }
  .menuHeader {
    display: grid;
    justify-content: end;
  }
  .closeBtn {
    color: #5f6871;
    cursor: pointer;
    text-align: end;
    font-size: 40px;
  }
  .menuLinks {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
    padding: 16px;
  }
`;
