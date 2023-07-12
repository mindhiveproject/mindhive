import styled, { keyframes } from "styled-components";

const loading = keyframes`
  from {
    background-position: 0 0;
  }

  to {
    background-position: 100% 100%;
  }
`;

export const StyledForm = styled.form`
  text-align: initial;
  font-size: 1.5rem;
  line-height: 1.5;
  font-weight: 600;
  max-width: 330px;
  label {
    display: block;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
  }
  input,
  textarea,
  select {
    font-family: Lato;
    height: 48px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    width: 100%;
    font-size: 16px;
    line-height: 24px;
    padding: 12px;
    &:focus {
      outline: 0;
      border-color: ${(props) => props.theme.red};
    }
  }
  button,
  input[type="submit"] {
    font-family: Lato;
    margin-top: 1rem;
    margin-bottom: 1rem;
    width: 100%;
    background: #007c70;
    color: white;
    padding: 1.2rem 0.5rem;
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    line-height: 100%;
    border: 2px solid #007c70;
    border-radius: 4px;
    cursor: pointer;
  }
  fieldset {
    display: grid;
    grid-gap: 10px;
    border: 0;
    padding: 0;
    &[disabled] {
      opacity: 0.5;
    }
  }
  p {
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
    margin-bottom: 4px;
  }
  span {
    font-size: 14px;
    line-height: 18px;
    color: #666666;
  }
  input[type="checkbox"] {
    width: 24px;
    height: 24px;
    color: green;
  }
  .checkboxField {
    display: grid;
    grid-template-columns: 1fr 9fr;
    grid-gap: 16px;
    align-items: start;
    margin-bottom: 10px;
  }
  a {
    color: #007c70;
    border-bottom: 1px solid #64c9e2;
  }
  .forgotLink {
    font-family: Lato;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0em;
    text-align: center;
    margin-top: 1rem;
  }
`;

export const SignupButton = styled.div`
  display: grid;
  grid-template-columns: 20px auto;
  grid-gap: 20px;
  align-items: center;
  text-align: left;
  margin: 0 auto;
  width: 100%;
  height: 56px;
  font-size: 18px;
  line-height: 100%;
  letter-spacing: 0.05em;
  color: #1a1a1a;
  border: 2px solid #e5e5e5;
  cursor: pointer;
  border-radius: 4px;
  background: none;
  padding: 1rem 3rem;
  font-weight: 400;
`;
