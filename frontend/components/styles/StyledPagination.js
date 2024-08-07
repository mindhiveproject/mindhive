import styled from "styled-components";

export const StyledPagination = styled.div`
  display: grid;
  align-self: end;
  display: inline-grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  align-items: stretch;
  justify-content: center;
  align-content: center;
  margin: 1rem 0;
  border: 1px solid var(--lightGray);
  border-radius: 10px;
  background: white;
  padding: 0.5rem 1rem;
  width: 100%;
  & > * {
    align-content: center;
    display: grid;
    margin: 0;
    padding: 15px 10px;
    border-right: 1px solid var(--lightGray);
    &:last-child {
      border-right: 0;
    }
  }
  a {
    cursor: pointer;
  }
  a[aria-disabled="true"] {
    color: lightgrey;
    pointer-events: none;
  }
  .prev {
    text-align: start;
  }
  .next {
    text-align: end;
  }
  .inactive {
    text-decoration: none;
  }
  button {
    background: white;
    border: 0px white;
  }
  .pageDropdown {
    display: grid;
    grid-template-columns: auto 100px 1fr;
    grid-gap: 1rem;
    align-items: center;
  }
`;
