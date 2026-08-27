import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

export default function ConsentSkippedMessage() {
  const { t } = useTranslation('common');
  return (
    <StyledContainer>
      <h1>{t('consent.skipped.header')}</h1>
      <p>{t('consent.skipped.message')}</p>
      <p>{t('consent.skipped.contact')}</p>
    </StyledContainer>
  );
}

const StyledContainer = styled.div`
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  text-align: center;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  h1 {
    font: var(--MH-Type-Heading-Small, 600 28px/36px "Inter", sans-serif);
    letter-spacing: 0;
    color: #333333;
    margin-bottom: 16px;
  }

  p {
    font: var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif);
    letter-spacing: 0;
    color: #666666;
    margin-bottom: 16px;
  }
`;
