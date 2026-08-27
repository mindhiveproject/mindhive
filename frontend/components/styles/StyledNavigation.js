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
    font: var(--MH-Type-Label-Small, 600 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
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
  font: var(--MH-Type-Label-Large, 500 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
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
    font: var(--MH-Type-Label-Large, 500 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
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
    grid-column-gap: 12px;
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
