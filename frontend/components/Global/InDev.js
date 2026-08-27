import styled from "styled-components";
import useTranslation from 'next-translate/useTranslation';

const StyledInDev = styled.div`
  background: #e5e5e5;
  display: grid;
  width: 100%;
  height: 100vh;
  justify-content: center;
  align-content: center;
  text-align: center;
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
`;

export default function InDev({ header, message }) {
  const { t } = useTranslation('common');
  const h =
    header ||
    t('inDev.header', 'This part of the platform is currently in development 🚧👷🏻‍♂️🚜👷⚙️');
  const m = message || t('inDev.message', 'Please come back later to check it out.');
  return (
    <StyledInDev>
      <h1>{h}</h1>
      <p>{m}</p>
    </StyledInDev>
  );
}
