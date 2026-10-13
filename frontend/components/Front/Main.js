import Footer from "../Global/Footer";
import Header from "../Global/Header";
import StyledFront from "../styles/StyledFront";
import Library from "./Library";

import { useContext } from "react";

import { UserContext } from "../Global/Authorized";

export default function FrontMain(props) {
  const { user } = useContext(UserContext);
  return (
    <>
      <Header user={user} />
      <StyledFront>
        <Library {...props} user={user} />
      </StyledFront>
      <Footer />
    </>
  );
}
