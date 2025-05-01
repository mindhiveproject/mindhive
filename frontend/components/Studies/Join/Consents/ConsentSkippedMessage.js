import styled from "styled-components";

export default function ConsentSkippedMessage() {
  return (
    <StyledContainer>
      <h1>Unable to Participate</h1>
      <p>
        Unfortunately, you cannot participate in the study because you did not
        agree to the required consent form.
      </p>
      <p>Please contact the study administrator for more information.</p>
    </StyledContainer>
  );
}

const StyledContainer = styled.div`
  font-family: Nunito, sans-serif;
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  text-align: center;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #333333;
    margin-bottom: 16px;
  }

  p {
    font-size: 16px;
    color: #666666;
    margin-bottom: 16px;
    line-height: 1.5;
  }
`;
