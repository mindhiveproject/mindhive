import PropTypes from "prop-types";
import styled from "styled-components";
import { useContext } from "react";

import { UserContext } from "./Authorized";

import Header from "./Header";
import Footer from "./Footer";

const StyledPage = styled.div`
  margin: 0 auto;
  min-height: 100vh;
  ${(props) => !props.fullScreen && `max-width: 1200px;`};
  padding: 2rem 0rem;
  margin-bottom: 100px;
`;

export default function Page({ children, fullScreen }) {
  const user = useContext(UserContext);
  return (
    <>
      <Header user={user} />
      <StyledPage fullScreen={fullScreen}>{children}</StyledPage>
      <Footer />
    </>
  );
}

Page.propTypes = {
  children: PropTypes.any,
};
