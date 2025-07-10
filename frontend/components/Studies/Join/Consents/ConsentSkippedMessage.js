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
