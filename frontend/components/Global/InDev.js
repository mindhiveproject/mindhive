import styled from "styled-components";

const StyledInDev = styled.div`
  background: #e5e5e5;
  display: grid;
  width: 100%;
  height: 100vh;
  justify-content: center;
  align-content: center;
  text-align: center;
  font-family: Roboto;
  font-size: 16px;
`;

export default function InDev({ header, message }) {
  const h =
    header ||
    `This part of the platform is currently in development 🚧👷🏻‍♂️🚜👷⚙️`;
  const m = message || `Please come back later to check it out.`;
  return (
    <StyledInDev>
      <h1>{h}</h1>
      <p>{m}</p>
    </StyledInDev>
  );
}
