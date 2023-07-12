import PropTypes from "prop-types";
import styled from "styled-components";

const StyledForm = styled.div`
  display: grid;
  width: 100%;
  height: 90vh;
  justify-content: center;
  align-content: center;
`;

export default function Page({ children }) {
  return <StyledForm>{children}</StyledForm>;
}

Page.propTypes = {
  children: PropTypes.any,
};
