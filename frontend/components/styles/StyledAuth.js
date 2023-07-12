import styled, { keyframes } from "styled-components";

const loading = keyframes`
  from {
    background-position: 0 0;
  }

  to {
    background-position: 100% 100%;
  }
`;

export const StyledAuth = styled.div`
  display: grid;
  text-align: initial;
  font-size: 1.5rem;
  line-height: 1.5;
  font-weight: 600;
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
    margin-bottom: 1rem;
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
    margin-top: 3rem;
    margin-bottom: 3rem;
    width: 100%;
    background: #007c70;
    color: white;
    padding: 1.5rem 0.5rem;
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    line-height: 100%;
    border: 2px solid #007c70;
    border-radius: 4px;
    cursor: pointer;
  }
  span {
    font-size: 18px;
    line-height: 18px;
    color: #795548;
    font-style: normal;
    font-weight: normal;
    a {
      color: #007c70;
      border-bottom: 1px solid #64c9e2;
    }
    fieldset {
      border: 0;
      padding: 0;
      &[disabled] {
        opacity: 0.5;
      }
      &::before {
        height: 10px;
        content: "";
        display: block;
      }
      &[aria-busy="true"]::before {
        background-size: 50% auto;
        animation: ${loading} 0.5s linear infinite;
      }
    }
  }
  .helpMessage {
    font-family: Lato;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: 0em;
    text-align: left;
  }
  .enterCodeScreen {
    max-width: 340px;
  }
  .classFoundScreen {
    max-width: 700px;
    display: grid;
    text-align: center;
    justify-items: center;
  }
  .classInformation {
    background: #fff3cd;
    border-radius: 4px;
    padding: 19px 24px 19px 24px;
    font-family: Roboto;
    font-size: 24px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.05em;
    text-align: center;
    color: #1a1a1a;
    margin-top: 20px;
    margin-bottom: 30px;
  }
  .navigationBtns {
    display: grid;
    grid-template-columns: 220px 220px;
    grid-gap: 15px;
  }
  .primaryBtn {
    background: #007c70;
    color: #ffffff;
    max-width: 220px;
  }
  .secondaryBtn {
    background: #ffffff;
    color: #007c70;
    max-width: 220px;
  }
  .signupOptions {
    margin-top: 35px;
    margin-bottom: 40px;
    display: grid;
    grid-gap: 20px;
  }
  .studentSignupOptions {
    max-width: 380px;
    margin-top: 35px;
    margin-bottom: 40px;
    display: grid;
    grid-gap: 20px;
    justify-self: center;
  }
  .guestParticipationBlock {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid #f2f2f2;
    font-family: Lato;
    font-style: normal;
    font-weight: normal;
    font-size: 18px;
    line-height: 24px;
    color: #666666;
  }
  .loginHereLine {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-gap: 5px;
    @media (max-width: 400px) {
      grid-template-columns: 1fr;
    }
  }
`;

export default StyledAuth;
