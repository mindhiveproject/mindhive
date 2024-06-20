import Site from "../components/Global/Site";
import FrontMain from "../components/Front/Main";

import Router from "next/router";
import { useContext } from "react";
import { UserContext } from "../components/Global/Authorized";

export default function MainPage() {
  const user = useContext(UserContext);
  if (user) {
    Router.push({
      pathname: "/dashboard",
    });
  }
  return (
    <Site>
      <FrontMain />
    </Site>
  );
}
