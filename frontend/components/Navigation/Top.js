import React, { Component } from "react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import { NavStyles, NavRightContainer } from "../styles/StyledNavigation";
import Button from "../DesignSystem/Button";

const Nav = ({ user }) => {
  const { t } = useTranslation("common");
  return (
    <NavStyles>
      <NavRightContainer>
        {user ? (
          <Link href="/dashboard">
            <Button variant="outline">
              {t("navigation.dashboard", {}, { default: "Dashboard" })}
            </Button>
          </Link>
        ) : (
          <div className="menuLinks">
            <Link href="/login">
              <Button variant="outline">
                {t("navigation.login", {}, { default: "Log in" })}
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="filled">
                {t("navigation.signup", {}, { default: "Sign up" })}
              </Button>
            </Link>
          </div>
        )}
      </NavRightContainer>
    </NavStyles>
  );
};

export default Nav;
