import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

const StyledTermsConditions = styled.div`
  span {
    font-size: 14px;
    line-height: 18px;
    color: #666666;
  }
`;

export default function TermsConditions({ btnName }) {
  const { t } = useTranslation("common");
  return (
    <StyledTermsConditions>
      <span>
        {t("terms.byClicking", { btnName })} {" "}
        <a target="_blank" href="/docs/terms" rel="noreferrer">
          {t("terms.termsOfService")}
        </a>
        , {t("terms.includingOur")} {" "}
        <a target="_blank" href="/docs/privacy" rel="noreferrer">
          {t("terms.privacyPolicy")}
        </a>
        .
      </span>
    </StyledTermsConditions>
  );
}
