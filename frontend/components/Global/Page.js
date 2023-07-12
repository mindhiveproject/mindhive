import PropTypes from "prop-types";
import styled from "styled-components";
import { useContext } from "react";

import { UserContext } from "./Authorized";

import Header from "./Header";
import Footer from "./Footer";

const StyledPage = styled.div`
  margin: 0 auto;
  min-height: 100vh;
  max-width: 1200px;
`;

export default function Page({ children }) {
  const user = useContext(UserContext);
  return (
    <>
      <Header user={user} />
      <StyledPage>{children}</StyledPage>
      <Footer />
    </>
  );
}

Page.propTypes = {
  children: PropTypes.any,
};
