import styled from "styled-components";

const StyledNote = styled.div`
  display: grid;
  margin: 20px;
  label {
    display: block;
    font-style: normal;
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
  }
  input,
  textarea,
  select {
    border: 1px solid #cccccc;
    border-radius: 4px;
    width: 100%;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    padding: 12px;
    &:focus {
      outline: 0;
      border-color: ${(props) => props.theme.red};
    }
  }
`;

export default StyledNote;
