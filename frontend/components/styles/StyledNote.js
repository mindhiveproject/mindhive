import styled from "styled-components";

const StyledNote = styled.div`
  display: grid;
  margin: 20px;
  label {
    display: block;
    font-style: normal;
    font: var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif);
    letter-spacing: 0;
  }
  input,
  textarea,
  select {
    border: 1px solid #cccccc;
    border-radius: 4px;
    width: 100%;
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    padding: 12px;
    &:focus {
      outline: 0;
      border-color: ${(props) => props.theme.red};
    }
  }
`;

export default StyledNote;
