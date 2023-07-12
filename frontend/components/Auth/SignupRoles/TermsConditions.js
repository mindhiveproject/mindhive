import styled from "styled-components";

const StyledTermsConditions = styled.div`
  span {
    font-size: 14px;
    line-height: 18px;
    color: #666666;
  }
`;

export default function TermsConditions({ btnName }) {
  return (
    <StyledTermsConditions>
      <span>
        By clicking on {btnName} you agree to MindHive’s{" "}
        <a target="_blank" href="/docs/terms" rel="noreferrer">
          Terms of Service
        </a>
        , including our{" "}
        <a target="_blank" href="/docs/privacy" rel="noreferrer">
          Privacy Policy
        </a>
        .
      </span>
    </StyledTermsConditions>
  );
}
